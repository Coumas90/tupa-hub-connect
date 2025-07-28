#!/usr/bin/env node
/**
 * ===============================================
 * TUPÁ HUB AUDIT REPORT GENERATOR
 * ===============================================
 * Converts terminal output to structured Markdown
 * with risk assessment and rollback instructions
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===============================================
// CONFIGURATION
// ===============================================
const RISK_THRESHOLDS = {
  CRITICAL: { min: 8, icon: '🔴', color: 'red' },
  HIGH: { min: 6, icon: '🟠', color: 'orange' },
  MEDIUM: { min: 4, icon: '🟡', color: 'yellow' },
  LOW: { min: 2, icon: '🟢', color: 'green' },
  MINIMAL: { min: 0, icon: '🔵', color: 'blue' }
};

const PHASE_WEIGHTS = {
  'SECURITY_SCAN': 10,
  'ARCHITECTURE_VALIDATION': 8,
  'CODE_PURIFICATION': 6,
  'DEPENDENCY_FORTRESS': 8,
  'PERFORMANCE_STRESS_TEST': 7,
  'DOCS_COMPLETENESS': 4,
  'ROLLBACK_SAFETY_NET': 9
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================
class AuditReportGenerator {
  constructor(options = {}) {
    this.sessionId = options.sessionId || 'UNKNOWN';
    this.logDir = options.logDir || './audit-logs';
    this.outputFile = options.outputFile || './audit-report.md';
    this.phases = options.phases || [];
    this.phaseStatus = options.phaseStatus || {};
    this.phaseErrors = options.phaseErrors || {};
    this.timestamp = new Date().toISOString();
    this.reportData = {
      summary: {},
      phases: [],
      risks: [],
      recommendations: [],
      rollbackInstructions: []
    };
  }

  // Parse command line arguments
  static parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].replace('--', '').replace(/-/g, '_');
      const value = args[i + 1];
      
      if (key === 'phases') {
        options[key] = value.split(' ');
      } else {
        options[key] = value;
      }
    }
    
    return options;
  }

  // Load and parse log files
  parseLogFiles() {
    console.log(`📊 Parsing log files from: ${this.logDir}`);
    
    if (!fs.existsSync(this.logDir)) {
      console.error(`❌ Log directory not found: ${this.logDir}`);
      return;
    }

    const logFiles = fs.readdirSync(this.logDir)
      .filter(file => file.endsWith('.log'))
      .sort();

    for (const logFile of logFiles) {
      const logPath = path.join(this.logDir, logFile);
      const logContent = fs.readFileSync(logPath, 'utf8');
      
      // Extract phase name from filename
      const phaseName = logFile.split('_')[0].toUpperCase();
      
      if (this.phases.includes(phaseName)) {
        this.parsePhaseLog(phaseName, logContent);
      }
    }
  }

  // Parse individual phase log
  parsePhaseLog(phaseName, logContent) {
    const lines = logContent.split('\n');
    const phaseData = {
      name: phaseName,
      status: this.getPhaseStatus(phaseName),
      weight: PHASE_WEIGHTS[phaseName] || 5,
      duration: this.extractDuration(lines),
      errors: this.extractErrors(lines),
      warnings: this.extractWarnings(lines),
      successes: this.extractSuccesses(lines),
      metrics: this.extractMetrics(lines),
      riskScore: 0
    };

    // Calculate risk score
    phaseData.riskScore = this.calculateRiskScore(phaseData);
    
    this.reportData.phases.push(phaseData);
    
    // Generate specific risks and recommendations
    this.generatePhaseRisks(phaseData);
  }

  // Extract duration from log lines
  extractDuration(lines) {
    const startTime = this.findTimestamp(lines, 'start');
    const endTime = this.findTimestamp(lines, 'end') || this.findTimestamp(lines, 'complet');
    
    if (startTime && endTime) {
      return Math.abs(new Date(endTime) - new Date(startTime)) / 1000;
    }
    
    return null;
  }

  // Find timestamp in log lines
  findTimestamp(lines, keyword) {
    for (const line of lines) {
      if (line.toLowerCase().includes(keyword)) {
        const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        if (timeMatch) {
          return timeMatch[1];
        }
      }
    }
    return null;
  }

  // Extract errors from log lines
  extractErrors(lines) {
    return lines.filter(line => 
      line.includes('[ERROR]') || 
      line.includes('[CRITICAL]') ||
      line.toLowerCase().includes('error:') ||
      line.toLowerCase().includes('failed')
    ).map(line => this.cleanLogLine(line));
  }

  // Extract warnings from log lines
  extractWarnings(lines) {
    return lines.filter(line => 
      line.includes('[WARNING]') || 
      line.includes('[WARN]') ||
      line.toLowerCase().includes('warning:')
    ).map(line => this.cleanLogLine(line));
  }

  // Extract successes from log lines
  extractSuccesses(lines) {
    return lines.filter(line => 
      line.includes('[SUCCESS]') || 
      line.includes('[PASS]') ||
      line.toLowerCase().includes('success') ||
      line.includes('✅')
    ).map(line => this.cleanLogLine(line));
  }

  // Extract metrics from log lines
  extractMetrics(lines) {
    const metrics = {};
    
    for (const line of lines) {
      // Look for common metric patterns
      const patterns = [
        /(\w+):\s*(\d+(?:\.\d+)?)\s*(ms|s|%|MB|KB|GB)?/g,
        /(\w+)\s*=\s*(\d+(?:\.\d+)?)/g,
        /Found\s+(\d+)\s+(\w+)/g
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const key = match[1] || match[2];
          const value = match[2] || match[1];
          const unit = match[3] || '';
          
          metrics[key] = { value: parseFloat(value), unit };
        }
      }
    }
    
    return metrics;
  }

  // Clean log line for display
  cleanLogLine(line) {
    return line
      .replace(/\[[^\]]+\]/g, '') // Remove log level brackets
      .replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s]*\s*/, '') // Remove timestamps
      .replace(/\x1b\[[0-9;]*m/g, '') // Remove ANSI color codes
      .trim();
  }

  // Get phase status
  getPhaseStatus(phaseName) {
    // Parse status from passed data or determine from logs
    if (this.phaseStatus[phaseName]) {
      return this.phaseStatus[phaseName];
    }
    
    // Try to determine from log files
    const logFile = path.join(this.logDir, `${phaseName.toLowerCase()}_*.log`);
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      if (content.includes('[SUCCESS]') || content.includes('✅')) {
        return 'SUCCESS';
      } else if (content.includes('[ERROR]') || content.includes('[CRITICAL]')) {
        return 'FAILED';
      }
    }
    
    return 'UNKNOWN';
  }

  // Calculate risk score for a phase
  calculateRiskScore(phaseData) {
    let score = 0;
    
    // Base score from status
    switch (phaseData.status) {
      case 'FAILED': score += 8; break;
      case 'SUCCESS': score += 0; break;
      case 'UNKNOWN': score += 6; break;
      default: score += 4;
    }
    
    // Add points for errors and warnings
    score += phaseData.errors.length * 2;
    score += phaseData.warnings.length * 0.5;
    
    // Weight by phase importance
    score = (score * phaseData.weight) / 10;
    
    // Normalize to 0-10 scale
    return Math.min(Math.max(score, 0), 10);
  }

  // Generate phase-specific risks and recommendations
  generatePhaseRisks(phaseData) {
    const riskLevel = this.getRiskLevel(phaseData.riskScore);
    
    if (phaseData.riskScore >= RISK_THRESHOLDS.MEDIUM.min) {
      this.reportData.risks.push({
        phase: phaseData.name,
        level: riskLevel,
        score: phaseData.riskScore,
        description: this.generateRiskDescription(phaseData),
        impact: this.assessImpact(phaseData),
        mitigation: this.generateMitigation(phaseData)
      });
    }
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(phaseData);
    this.reportData.recommendations.push(...recommendations);
  }

  // Get risk level from score
  getRiskLevel(score) {
    for (const [level, threshold] of Object.entries(RISK_THRESHOLDS)) {
      if (score >= threshold.min) {
        return level;
      }
    }
    return 'MINIMAL';
  }

  // Generate risk description
  generateRiskDescription(phaseData) {
    const descriptions = {
      'SECURITY_SCAN': 'Security vulnerabilities detected that could expose the system to attacks',
      'ARCHITECTURE_VALIDATION': 'Architectural issues that may impact system scalability and maintainability',
      'CODE_PURIFICATION': 'Code quality issues that could lead to bugs and maintenance difficulties',
      'DEPENDENCY_FORTRESS': 'Dependency vulnerabilities or conflicts that pose security risks',
      'PERFORMANCE_STRESS_TEST': 'Performance bottlenecks that could impact user experience',
      'DOCS_COMPLETENESS': 'Documentation gaps that could hinder team productivity',
      'ROLLBACK_SAFETY_NET': 'Rollback mechanism failures that could prevent safe deployments'
    };
    
    return descriptions[phaseData.name] || 'Potential issues detected in this phase';
  }

  // Assess impact
  assessImpact(phaseData) {
    const impacts = {
      'SECURITY_SCAN': 'High - Could lead to data breaches or system compromise',
      'ARCHITECTURE_VALIDATION': 'Medium - May impact long-term maintainability',
      'CODE_PURIFICATION': 'Medium - Could introduce bugs in production',
      'DEPENDENCY_FORTRESS': 'High - Security vulnerabilities could be exploited',
      'PERFORMANCE_STRESS_TEST': 'Medium - May affect user experience under load',
      'DOCS_COMPLETENESS': 'Low - Primarily impacts team efficiency',
      'ROLLBACK_SAFETY_NET': 'Critical - Could prevent safe deployment rollbacks'
    };
    
    return impacts[phaseData.name] || 'Impact assessment needed';
  }

  // Generate mitigation strategies
  generateMitigation(phaseData) {
    const mitigations = {
      'SECURITY_SCAN': [
        'Review and fix identified security vulnerabilities',
        'Implement additional security headers',
        'Update dependencies with security patches',
        'Conduct penetration testing'
      ],
      'ARCHITECTURE_VALIDATION': [
        'Refactor components with high coupling',
        'Implement proper separation of concerns',
        'Add architectural documentation',
        'Review component dependencies'
      ],
      'CODE_PURIFICATION': [
        'Fix ESLint and TypeScript errors',
        'Improve test coverage',
        'Refactor complex functions',
        'Add proper error handling'
      ],
      'DEPENDENCY_FORTRESS': [
        'Update vulnerable dependencies',
        'Remove unused dependencies',
        'Audit dependency licenses',
        'Implement dependency pinning'
      ],
      'PERFORMANCE_STRESS_TEST': [
        'Optimize slow database queries',
        'Implement caching strategies',
        'Optimize bundle size',
        'Add performance monitoring'
      ],
      'DOCS_COMPLETENESS': [
        'Add missing API documentation',
        'Update deployment guides',
        'Document configuration options',
        'Add troubleshooting guides'
      ],
      'ROLLBACK_SAFETY_NET': [
        'Fix rollback script errors',
        'Test rollback procedures',
        'Add rollback validation',
        'Document emergency procedures'
      ]
    };
    
    return mitigations[phaseData.name] || ['Review phase logs for specific issues'];
  }

  // Generate recommendations
  generateRecommendations(phaseData) {
    const recommendations = [];
    
    if (phaseData.errors.length > 0) {
      recommendations.push({
        type: 'ERROR_RESOLUTION',
        priority: 'High',
        description: `Resolve ${phaseData.errors.length} error(s) in ${phaseData.name}`,
        action: `Review logs and fix identified issues in the ${phaseData.name.toLowerCase()} phase`
      });
    }
    
    if (phaseData.warnings.length > 5) {
      recommendations.push({
        type: 'WARNING_CLEANUP',
        priority: 'Medium',
        description: `Address ${phaseData.warnings.length} warning(s) in ${phaseData.name}`,
        action: `Review and resolve warnings to improve code quality`
      });
    }
    
    if (phaseData.duration && phaseData.duration > 300) { // 5 minutes
      recommendations.push({
        type: 'PERFORMANCE_OPTIMIZATION',
        priority: 'Medium',
        description: `${phaseData.name} took ${Math.round(phaseData.duration)}s to complete`,
        action: `Optimize ${phaseData.name.toLowerCase()} performance to reduce execution time`
      });
    }
    
    return recommendations;
  }

  // Generate rollback instructions
  generateRollbackInstructions() {
    const safetyCheckpointFile = path.join(this.logDir, 'safety-checkpoint.txt');
    let checkpointCommit = 'HEAD~1'; // Default fallback
    
    if (fs.existsSync(safetyCheckpointFile)) {
      checkpointCommit = fs.readFileSync(safetyCheckpointFile, 'utf8').trim();
    }
    
    this.reportData.rollbackInstructions = [
      {
        scenario: 'Emergency Rollback',
        description: 'Complete rollback to pre-audit state',
        commands: [
          `cd ${process.cwd()}`,
          `git reset --hard ${checkpointCommit}`,
          `npm ci`,
          `npm run build`
        ]
      },
      {
        scenario: 'Partial Rollback',
        description: 'Rollback specific files only',
        commands: [
          `git checkout ${checkpointCommit} -- <file-path>`,
          `git commit -m "Partial rollback from audit"`
        ]
      },
      {
        scenario: 'Database Rollback',
        description: 'Rollback database migrations',
        commands: [
          `npm run migration:rollback`,
          `npm run seed:reset`
        ]
      }
    ];
  }

  // Generate summary statistics
  generateSummary() {
    const totalPhases = this.reportData.phases.length;
    const successfulPhases = this.reportData.phases.filter(p => p.status === 'SUCCESS').length;
    const failedPhases = this.reportData.phases.filter(p => p.status === 'FAILED').length;
    const totalErrors = this.reportData.phases.reduce((sum, p) => sum + p.errors.length, 0);
    const totalWarnings = this.reportData.phases.reduce((sum, p) => sum + p.warnings.length, 0);
    const averageRiskScore = this.reportData.phases.reduce((sum, p) => sum + p.riskScore, 0) / totalPhases;
    
    this.reportData.summary = {
      sessionId: this.sessionId,
      timestamp: this.timestamp,
      totalPhases,
      successfulPhases,
      failedPhases,
      totalErrors,
      totalWarnings,
      averageRiskScore,
      overallRiskLevel: this.getRiskLevel(averageRiskScore),
      completionRate: Math.round((successfulPhases / totalPhases) * 100)
    };
  }

  // Generate the complete markdown report
  generateMarkdownReport() {
    this.parseLogFiles();
    this.generateRollbackInstructions();
    this.generateSummary();
    
    const report = this.buildMarkdownContent();
    
    // Ensure output directory exists
    const outputDir = path.dirname(this.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(this.outputFile, report, 'utf8');
    console.log(`✅ Audit report generated: ${this.outputFile}`);
    
    return this.outputFile;
  }

  // Build the complete markdown content
  buildMarkdownContent() {
    const summary = this.reportData.summary;
    const riskIcon = RISK_THRESHOLDS[summary.overallRiskLevel]?.icon || '❓';
    
    return `# 🛡️ TUPÁ Hub Pre-Tenant Audit Report

## 📋 Executive Summary

| Metric | Value |
|--------|-------|
| **Session ID** | \`${summary.sessionId}\` |
| **Generated** | ${new Date(summary.timestamp).toLocaleString()} |
| **Overall Risk Level** | ${riskIcon} **${summary.overallRiskLevel}** (${summary.averageRiskScore.toFixed(1)}/10) |
| **Completion Rate** | ${summary.completionRate}% (${summary.successfulPhases}/${summary.totalPhases} phases) |
| **Total Issues** | ${summary.totalErrors} errors, ${summary.totalWarnings} warnings |

## 🎯 Phase Results

${this.generatePhaseResultsTable()}

## 🚨 Risk Hotspots

${this.generateRiskHotspots()}

## 📊 Detailed Phase Analysis

${this.generateDetailedPhaseAnalysis()}

## 💡 Recommendations

${this.generateRecommendationsSection()}

## 🔄 Rollback Instructions

${this.generateRollbackSection()}

## 📈 Metrics Dashboard

${this.generateMetricsDashboard()}

## 🔍 Log Analysis

${this.generateLogAnalysis()}

---

**Report generated by TUPÁ Hub Audit System v1.0.0**  
*For technical support, contact the DevOps team*
`;
  }

  // Generate phase results table
  generatePhaseResultsTable() {
    let table = '| Phase | Status | Risk | Duration | Issues |\n';
    table += '|-------|--------|------|----------|--------|\n';
    
    for (const phase of this.reportData.phases) {
      const riskLevel = this.getRiskLevel(phase.riskScore);
      const riskIcon = RISK_THRESHOLDS[riskLevel]?.icon || '❓';
      const statusIcon = phase.status === 'SUCCESS' ? '✅' : phase.status === 'FAILED' ? '❌' : '⚠️';
      const duration = phase.duration ? `${Math.round(phase.duration)}s` : 'N/A';
      const issues = `${phase.errors.length}E, ${phase.warnings.length}W`;
      
      table += `| **${phase.name}** | ${statusIcon} ${phase.status} | ${riskIcon} ${riskLevel} | ${duration} | ${issues} |\n`;
    }
    
    return table;
  }

  // Generate risk hotspots section
  generateRiskHotspots() {
    if (this.reportData.risks.length === 0) {
      return '🟢 **No significant risks detected!** All phases completed within acceptable parameters.\n';
    }
    
    let content = '';
    const risksByLevel = {};
    
    // Group risks by level
    for (const risk of this.reportData.risks) {
      if (!risksByLevel[risk.level]) {
        risksByLevel[risk.level] = [];
      }
      risksByLevel[risk.level].push(risk);
    }
    
    // Display risks by severity
    for (const level of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      const risks = risksByLevel[level] || [];
      if (risks.length === 0) continue;
      
      const icon = RISK_THRESHOLDS[level]?.icon || '❓';
      content += `### ${icon} ${level} Risk (${risks.length} issue${risks.length > 1 ? 's' : ''})\n\n`;
      
      for (const risk of risks) {
        content += `#### ${risk.phase}\n`;
        content += `**Risk Score:** ${risk.score.toFixed(1)}/10  \n`;
        content += `**Description:** ${risk.description}  \n`;
        content += `**Impact:** ${risk.impact}  \n`;
        content += `**Mitigation:**\n`;
        for (const mitigation of risk.mitigation) {
          content += `- ${mitigation}\n`;
        }
        content += '\n';
      }
    }
    
    return content;
  }

  // Generate detailed phase analysis
  generateDetailedPhaseAnalysis() {
    let content = '';
    
    for (const phase of this.reportData.phases) {
      const riskLevel = this.getRiskLevel(phase.riskScore);
      const riskIcon = RISK_THRESHOLDS[riskLevel]?.icon || '❓';
      
      content += `### ${riskIcon} ${phase.name}\n\n`;
      content += `**Status:** ${phase.status}  \n`;
      content += `**Risk Score:** ${phase.riskScore.toFixed(1)}/10 (${riskLevel})  \n`;
      if (phase.duration) {
        content += `**Duration:** ${Math.round(phase.duration)} seconds  \n`;
      }
      content += `**Issues:** ${phase.errors.length} errors, ${phase.warnings.length} warnings  \n\n`;
      
      if (phase.errors.length > 0) {
        content += `#### ❌ Errors\n`;
        for (const error of phase.errors.slice(0, 5)) { // Limit to first 5
          content += `- ${error}\n`;
        }
        if (phase.errors.length > 5) {
          content += `- ... and ${phase.errors.length - 5} more errors\n`;
        }
        content += '\n';
      }
      
      if (phase.warnings.length > 0) {
        content += `#### ⚠️ Warnings\n`;
        for (const warning of phase.warnings.slice(0, 3)) { // Limit to first 3
          content += `- ${warning}\n`;
        }
        if (phase.warnings.length > 3) {
          content += `- ... and ${phase.warnings.length - 3} more warnings\n`;
        }
        content += '\n';
      }
      
      if (Object.keys(phase.metrics).length > 0) {
        content += `#### 📊 Metrics\n`;
        for (const [key, metric] of Object.entries(phase.metrics)) {
          content += `- **${key}:** ${metric.value}${metric.unit}\n`;
        }
        content += '\n';
      }
      
      content += '---\n\n';
    }
    
    return content;
  }

  // Generate recommendations section
  generateRecommendationsSection() {
    if (this.reportData.recommendations.length === 0) {
      return '🎉 **No specific recommendations!** All phases completed successfully.\n';
    }
    
    let content = '';
    const recsByPriority = { High: [], Medium: [], Low: [] };
    
    for (const rec of this.reportData.recommendations) {
      recsByPriority[rec.priority].push(rec);
    }
    
    for (const [priority, recs] of Object.entries(recsByPriority)) {
      if (recs.length === 0) continue;
      
      const icon = priority === 'High' ? '🔴' : priority === 'Medium' ? '🟠' : '🟡';
      content += `### ${icon} ${priority} Priority (${recs.length} item${recs.length > 1 ? 's' : ''})\n\n`;
      
      for (const rec of recs) {
        content += `#### ${rec.description}\n`;
        content += `**Action:** ${rec.action}  \n`;
        content += `**Type:** ${rec.type}  \n\n`;
      }
    }
    
    return content;
  }

  // Generate rollback section
  generateRollbackSection() {
    let content = '> 🚨 **Use these instructions only in case of critical failures**\n\n';
    
    for (const instruction of this.reportData.rollbackInstructions) {
      content += `### ${instruction.scenario}\n`;
      content += `${instruction.description}\n\n`;
      content += '```bash\n';
      for (const command of instruction.commands) {
        content += `${command}\n`;
      }
      content += '```\n\n';
    }
    
    return content;
  }

  // Generate metrics dashboard
  generateMetricsDashboard() {
    const allMetrics = {};
    
    // Aggregate metrics from all phases
    for (const phase of this.reportData.phases) {
      for (const [key, metric] of Object.entries(phase.metrics)) {
        if (!allMetrics[key]) {
          allMetrics[key] = [];
        }
        allMetrics[key].push({ phase: phase.name, ...metric });
      }
    }
    
    if (Object.keys(allMetrics).length === 0) {
      return '*No metrics collected during this audit session.*\n';
    }
    
    let content = '';
    for (const [metricName, values] of Object.entries(allMetrics)) {
      content += `#### ${metricName}\n`;
      for (const value of values) {
        content += `- **${value.phase}:** ${value.value}${value.unit}\n`;
      }
      content += '\n';
    }
    
    return content;
  }

  // Generate log analysis
  generateLogAnalysis() {
    const logFiles = fs.readdirSync(this.logDir)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        size: fs.statSync(path.join(this.logDir, file)).size,
        modified: fs.statSync(path.join(this.logDir, file)).mtime
      }))
      .sort((a, b) => b.modified - a.modified);
    
    let content = '### 📋 Log Files\n\n';
    content += '| File | Size | Modified |\n';
    content += '|------|------|----------|\n';
    
    for (const log of logFiles) {
      const size = log.size > 1024 ? `${Math.round(log.size/1024)}KB` : `${log.size}B`;
      const modified = log.modified.toLocaleString();
      content += `| \`${log.name}\` | ${size} | ${modified} |\n`;
    }
    
    content += '\n### 🔍 Quick Access\n\n';
    content += `**Log Directory:** \`${this.logDir}\`  \n`;
    content += `**Session Files:** \`*${this.sessionId.split('_')[1]}*\`  \n`;
    
    return content;
  }
}

// ===============================================
// MAIN EXECUTION
// ===============================================
function main() {
  try {
    console.log('🚀 Starting TUPÁ Hub Audit Report Generation...');
    
    const options = AuditReportGenerator.parseArgs();
    const generator = new AuditReportGenerator(options);
    
    const reportFile = generator.generateMarkdownReport();
    
    console.log('📊 Report Statistics:');
    console.log(`   Phases Analyzed: ${generator.reportData.phases.length}`);
    console.log(`   Risk Issues: ${generator.reportData.risks.length}`);
    console.log(`   Recommendations: ${generator.reportData.recommendations.length}`);
    console.log(`   Overall Risk: ${generator.reportData.summary.overallRiskLevel}`);
    
    console.log('✅ Audit report generation completed successfully!');
    
    return reportFile;
    
  } catch (error) {
    console.error('❌ Failed to generate audit report:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Execute if script is run directly
if (require.main === module) {
  main();
}

module.exports = AuditReportGenerator;