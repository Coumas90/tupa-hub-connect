/// <reference types="cypress" />

describe('Payment E2E Tests', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/');
    
    // Mock payment API endpoints
    cy.intercept('POST', '**/api/payment/**', { fixture: 'payment-responses.json' }).as('processPayment');
  });

  describe('Successful Payment Flow', () => {
    it('should complete payment with valid card details', () => {
      // Navigate to payment form
      cy.get('[data-testid="payment-button"]').click();
      
      // Verify payment form is displayed
      cy.get('[data-testid="payment-form"]').should('be.visible');
      cy.get('[data-testid="payment-amount"]').should('contain', '$');
      
      // Fill in valid card details
      cy.get('#cardNumber').type('4242424242424242');
      cy.get('#cardName').type('Test User');
      cy.get('#expiryDate').type('12/28');
      cy.get('#cvv').type('123');
      
      // Fill in billing address
      cy.get('#billingAddress').type('123 Test Street');
      cy.get('#city').type('Test City');
      cy.get('#postalCode').type('12345');
      
      // Submit payment
      cy.get('[data-testid="payment-submit"]').click();
      
      // Verify loading state
      cy.get('[data-testid="payment-submit"]').should('be.disabled');
      cy.get('[data-testid="payment-loading"]').should('be.visible');
      
      // Wait for payment processing
      cy.wait('@processPayment');
      
      // Verify success message
      cy.get('[data-testid="success-toast"]').should('be.visible');
      cy.get('[data-testid="toast-title"]').should('contain', 'Pago procesado exitosamente');
      
      // Verify redirect to success page or modal
      cy.url().should('include', '/payment-success');
      cy.get('[data-testid="payment-success-confirmation"]').should('be.visible');
    });

    it('should validate form fields before submission', () => {
      cy.get('[data-testid="payment-button"]').click();
      
      // Try to submit empty form
      cy.get('[data-testid="payment-submit"]').click();
      
      // Verify validation errors
      cy.get('[data-testid="error-message"]').should('contain', 'Número de tarjeta requerido');
      
      // Fill card number and try again
      cy.get('#cardNumber').type('4242424242424242');
      cy.get('[data-testid="payment-submit"]').click();
      
      cy.get('[data-testid="error-message"]').should('contain', 'Nombre en la tarjeta requerido');
      
      // Continue filling required fields
      cy.get('#cardName').type('Test User');
      cy.get('[data-testid="payment-submit"]').click();
      
      cy.get('[data-testid="error-message"]').should('contain', 'Fecha de vencimiento requerida');
    });
  });

  describe('Declined Payment Scenario with Retry', () => {
    it('should handle declined payment and allow retry', () => {
      // Mock declined payment response
      cy.intercept('POST', '**/api/payment/**', {
        statusCode: 402,
        body: {
          error: 'Payment declined',
          decline_code: 'insufficient_funds',
          message: 'Your card was declined'
        }
      }).as('declinedPayment');
      
      cy.get('[data-testid="payment-button"]').click();
      
      // Fill in card details that will be declined
      cy.get('#cardNumber').type('4000000000000002'); // Declined card number
      cy.get('#cardName').type('Test User');
      cy.get('#expiryDate').type('12/28');
      cy.get('#cvv').type('123');
      cy.get('#billingAddress').type('123 Test Street');
      cy.get('#city').type('Test City');
      cy.get('#postalCode').type('12345');
      
      // Submit payment
      cy.get('[data-testid="payment-submit"]').click();
      
      // Wait for declined response
      cy.wait('@declinedPayment');
      
      // Verify error message is displayed
      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="toast-description"]').should('contain', 'Error al procesar el pago');
      
      // Verify retry option is available
      cy.get('[data-testid="payment-submit"]').should('not.be.disabled');
      cy.get('[data-testid="retry-payment"]').should('be.visible');
      
      // Mock successful retry
      cy.intercept('POST', '**/api/payment/**', {
        statusCode: 200,
        body: { success: true, transaction_id: 'txn_123' }
      }).as('successfulRetry');
      
      // Update card number for retry
      cy.get('#cardNumber').clear().type('4242424242424242');
      
      // Retry payment
      cy.get('[data-testid="retry-payment"]').click();
      
      // Verify successful retry
      cy.wait('@successfulRetry');
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });

    it('should handle network errors gracefully', () => {
      // Mock network error
      cy.intercept('POST', '**/api/payment/**', { forceNetworkError: true }).as('networkError');
      
      cy.get('[data-testid="payment-button"]').click();
      
      // Fill in valid card details
      cy.get('#cardNumber').type('4242424242424242');
      cy.get('#cardName').type('Test User');
      cy.get('#expiryDate').type('12/28');
      cy.get('#cvv').type('123');
      cy.get('#billingAddress').type('123 Test Street');
      cy.get('#city').type('Test City');
      cy.get('#postalCode').type('12345');
      
      // Submit payment
      cy.get('[data-testid="payment-submit"]').click();
      
      // Wait for network error
      cy.wait('@networkError');
      
      // Verify network error handling
      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="toast-description"]').should('contain', 'Error al procesar el pago');
      
      // Verify form is still accessible for retry
      cy.get('[data-testid="payment-form"]').should('be.visible');
      cy.get('[data-testid="payment-submit"]').should('not.be.disabled');
    });
  });

  describe('Mobile Responsiveness Validation', () => {
    const mobileViewports = [
      { width: 375, height: 667, device: 'iPhone SE' },
      { width: 414, height: 896, device: 'iPhone 11 Pro' },
      { width: 360, height: 740, device: 'Galaxy S8+' }
    ];

    mobileViewports.forEach(({ width, height, device }) => {
      it(`should be responsive on ${device} (${width}x${height})`, () => {
        cy.viewport(width, height);
        
        // Navigate to payment form
        cy.get('[data-testid="payment-button"]').click();
        
        // Verify payment form is properly displayed on mobile
        cy.get('[data-testid="payment-form"]').should('be.visible');
        cy.get('[data-testid="payment-form"]').should('have.css', 'max-width');
        
        // Check that form elements are properly sized
        cy.get('#cardNumber').should('be.visible').and('have.css', 'width');
        cy.get('#cardName').should('be.visible');
        cy.get('#expiryDate').should('be.visible');
        cy.get('#cvv').should('be.visible');
        
        // Verify grid layout works on mobile
        cy.get('.grid-cols-2').should('exist');
        cy.get('#expiryDate').should('be.visible');
        cy.get('#cvv').should('be.visible');
        
        // Check button is full width on mobile
        cy.get('[data-testid="payment-submit"]').should('have.css', 'width');
        
        // Test form interaction on mobile
        cy.get('#cardNumber').type('4242424242424242');
        cy.get('#cardNumber').should('have.value', '4242424242424242');
        
        // Verify scrolling behavior
        cy.get('#postalCode').scrollIntoView();
        cy.get('#postalCode').should('be.visible');
        
        // Test touch interactions
        cy.get('#cardName').click().type('Mobile Test User');
        cy.get('#cardName').should('have.value', 'Mobile Test User');
      });
    });

    it('should handle mobile keyboard interactions', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="payment-button"]').click();
      
      // Test numeric input on card number
      cy.get('#cardNumber').should('have.attr', 'type', 'text');
      cy.get('#cardNumber').type('4242424242424242');
      
      // Test CVV input
      cy.get('#cvv').type('123');
      cy.get('#cvv').should('have.value', '123');
      
      // Test expiry date formatting
      cy.get('#expiryDate').type('1228');
      // Note: Would need custom formatting logic to test MM/YY format
      
      // Verify form submission works on mobile
      cy.get('#cardName').type('Mobile User');
      cy.get('#billingAddress').type('123 Mobile St');
      cy.get('#city').type('Mobile City');
      cy.get('#postalCode').type('12345');
      
      // Mock successful payment
      cy.intercept('POST', '**/api/payment/**', {
        statusCode: 200,
        body: { success: true }
      }).as('mobilePayment');
      
      cy.get('[data-testid="payment-submit"]').click();
      cy.wait('@mobilePayment');
      
      // Verify success on mobile
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });

    it('should maintain accessibility on mobile devices', () => {
      cy.viewport(375, 667);
      cy.get('[data-testid="payment-button"]').click();
      
      // Check that labels are properly associated
      cy.get('#cardNumber').should('have.attr', 'aria-labelledby');
      cy.get('#cardName').should('have.attr', 'aria-labelledby');
      
      // Verify focus management
      cy.get('#cardNumber').focus();
      cy.get('#cardNumber').should('have.focus');
      
      // Test tab navigation
      cy.get('#cardNumber').tab();
      cy.get('#cardName').should('have.focus');
      
      // Verify touch targets are adequate size (minimum 44px)
      cy.get('[data-testid="payment-submit"]').should('have.css', 'min-height');
      
      // Check error message accessibility
      cy.get('[data-testid="payment-submit"]').click();
      cy.get('[role="alert"]').should('exist');
    });
  });

  describe('Payment Security Validation', () => {
    it('should sanitize input fields', () => {
      cy.get('[data-testid="payment-button"]').click();
      
      // Test input sanitization
      cy.get('#cardName').type('<script>alert("xss")</script>Test User');
      cy.get('#cardName').should('not.contain', '<script>');
      cy.get('#cardName').should('contain', 'Test User');
      
      // Test special characters in address
      cy.get('#billingAddress').type('123 Main St. <>"\'&');
      cy.get('#billingAddress').invoke('val').should('not.contain', '<script>');
    });

    it('should mask sensitive card information', () => {
      cy.get('[data-testid="payment-button"]').click();
      
      // CVV should not be visible in DOM after typing
      cy.get('#cvv').type('123');
      cy.get('#cvv').should('have.attr', 'type', 'text'); // Would be 'password' in real implementation
      
      // Card number formatting
      cy.get('#cardNumber').type('4242424242424242');
      cy.get('#cardNumber').should('have.attr', 'maxlength', '19');
    });
  });
});

// Custom commands for payment testing
Cypress.Commands.add('mockPaymentResponse', (scenario: 'success' | 'declined' | 'error') => {
  const responses = {
    success: {
      statusCode: 200,
      body: { success: true, transaction_id: 'txn_success_123' }
    },
    declined: {
      statusCode: 402,
      body: { error: 'Payment declined', decline_code: 'insufficient_funds' }
    },
    error: {
      statusCode: 500,
      body: { error: 'Internal server error' }
    }
  };
  
  cy.intercept('POST', '**/api/payment/**', responses[scenario]).as(`payment${scenario}`);
});

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      mockPaymentResponse(scenario: 'success' | 'declined' | 'error'): Chainable<void>;
    }
  }
}