// Artillery processor for custom functions and data generation
const crypto = require('crypto');

module.exports = {
  // Generate random strings for tokens
  generateRandomToken: function(context, events, done) {
    context.vars.randomToken = crypto.randomBytes(32).toString('hex');
    return done();
  },

  // Generate random user IDs  
  generateUserId: function(context, events, done) {
    context.vars.userId = crypto.randomUUID();
    return done();
  },

  // Custom response validation
  validateTokenResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode === 200) {
      try {
        const body = JSON.parse(response.body);
        if (body.access_token && body.expires_in) {
          ee.emit('counter', 'valid_token_responses', 1);
        } else {
          ee.emit('counter', 'invalid_token_responses', 1);
        }
      } catch (e) {
        ee.emit('counter', 'json_parse_errors', 1);
      }
    } else if (response.statusCode === 429) {
      ee.emit('counter', 'rate_limit_errors', 1);
    } else if (response.statusCode >= 500) {
      ee.emit('counter', 'server_errors', 1);
    }
    
    return next();
  },

  // Log slow responses
  logSlowResponse: function(requestParams, response, context, ee, next) {
    const responseTime = response.timings.response;
    if (responseTime > 500) {
      console.log(`🐌 Slow response: ${responseTime}ms - Status: ${response.statusCode}`);
      ee.emit('counter', 'slow_responses', 1);
    }
    return next();
  }
};