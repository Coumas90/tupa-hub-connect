#!/bin/bash
# ===============================================
# TUPÁ HUB ERROR HANDLING UTILITIES
# ===============================================
# Centralized error handling and recovery system
# Version: 1.0.0

# ===============================================
# ERROR CLASSIFICATION
# ===============================================
declare -A ERROR_CATEGORIES=(
  ["NETWORK"]="Connection timeouts, DNS failures, API unreachable"
  ["PERMISSION"]="File permissions, sudo access, authentication"
  ["DEPENDENCY"]="Missing packages, version conflicts, installation failures"
  ["SYNTAX"]="Code syntax errors, configuration format issues"
  ["RESOURCE"]="Disk space, memory, CPU limitations"
  ["SECURITY"]="Vulnerability scans, certificate issues, access violations"
  ["BUILD"]="Compilation errors, bundling failures, test failures"
  ["RUNTIME"]="Application crashes, service failures, timeout errors"
)

# ===============================================
# ERROR SEVERITY LEVELS
# ===============================================
SEVERITY_CRITICAL=5
SEVERITY_HIGH=4
SEVERITY_MEDIUM=3
SEVERITY_LOW=2
SEVERITY_INFO=1

# ===============================================
# UTILITY FUNCTIONS
# ===============================================
log_error_context() {
  local error_code=$1
  local error_message=$2
  local phase=$3
  local timestamp=$(date -Iseconds)
  
  cat >> "$AUDIT_LOG_DIR/error-context.log" << EOF
---
Timestamp: $timestamp
Phase: $phase
Exit Code: $error_code
Error Message: $error_message
Working Directory: $(pwd)
User: $(whoami)
System: $(uname -a)
Memory: $(free -h | head -2)
Disk: $(df -h . | tail -1)
---
EOF
}

# ===============================================
# ERROR CLASSIFICATION ENGINE
# ===============================================
classify_error() {
  local exit_code=$1
  local error_output=$2
  local phase=$3
  
  local category="UNKNOWN"
  local severity=$SEVERITY_MEDIUM
  local suggestions=()
  
  # Network-related errors
  if echo "$error_output" | grep -qi "connection\|timeout\|unreachable\|dns\|network"; then
    category="NETWORK"
    severity=$SEVERITY_HIGH
    suggestions=(
      "Check internet connectivity"
      "Verify DNS resolution"
      "Check firewall settings"
      "Retry with increased timeout"
    )
  
  # Permission errors
  elif echo "$error_output" | grep -qi "permission\|access denied\|unauthorized\|sudo"; then
    category="PERMISSION"
    severity=$SEVERITY_HIGH
    suggestions=(
      "Check file/directory permissions"
      "Run with appropriate user privileges"
      "Verify sudo access"
      "Check SELinux/AppArmor policies"
    )
  
  # Dependency errors
  elif echo "$error_output" | grep -qi "not found\|missing\|dependency\|package\|module"; then
    category="DEPENDENCY"
    severity=$SEVERITY_HIGH
    suggestions=(
      "Install missing dependencies"
      "Update package manager"
      "Check version compatibility"
      "Clear package cache"
    )
  
  # Syntax/configuration errors
  elif echo "$error_output" | grep -qi "syntax\|parse\|invalid\|malformed\|config"; then
    category="SYNTAX"
    severity=$SEVERITY_MEDIUM
    suggestions=(
      "Validate configuration syntax"
      "Check for typos"
      "Verify file format"
      "Use linting tools"
    )
  
  # Resource errors
  elif echo "$error_output" | grep -qi "space\|memory\|disk\|resource\|quota"; then
    category="RESOURCE"
    severity=$SEVERITY_CRITICAL
    suggestions=(
      "Free up disk space"
      "Increase memory allocation"
      "Check resource quotas"
      "Optimize resource usage"
    )
  
  # Security errors
  elif echo "$error_output" | grep -qi "security\|certificate\|ssl\|tls\|vulnerability"; then
    category="SECURITY"
    severity=$SEVERITY_CRITICAL
    suggestions=(
      "Update security certificates"
      "Review security policies"
      "Apply security patches"
      "Check access controls"
    )
  
  # Build errors
  elif echo "$error_output" | grep -qi "build\|compile\|bundle\|test\|lint"; then
    category="BUILD"
    severity=$SEVERITY_MEDIUM
    suggestions=(
      "Check build configuration"
      "Resolve compilation errors"
      "Update build tools"
      "Clear build cache"
    )
  
  # Runtime errors
  elif echo "$error_output" | grep -qi "runtime\|crash\|exception\|service"; then
    category="RUNTIME"
    severity=$SEVERITY_HIGH
    suggestions=(
      "Check application logs"
      "Restart services"
      "Verify runtime environment"
      "Check system resources"
    )
  fi
  
  # Override severity based on exit code
  case $exit_code in
    1|2) severity=$SEVERITY_MEDIUM ;;
    125|126|127|128) severity=$SEVERITY_HIGH ;;
    130|137|143) severity=$SEVERITY_MEDIUM ;; # Signals
    *) 
      if [[ $exit_code -gt 128 ]]; then
        severity=$SEVERITY_HIGH
      fi
      ;;
  esac
  
  # Output classification
  cat << EOF
{
  "category": "$category",
  "severity": $severity,
  "exit_code": $exit_code,
  "phase": "$phase",
  "suggestions": [$(printf '"%s",' "${suggestions[@]}" | sed 's/,$//')]
}
EOF
}

# ===============================================
# AUTO-RECOVERY STRATEGIES
# ===============================================
attempt_auto_recovery() {
  local category=$1
  local phase=$2
  local error_output=$3
  
  log_info "Attempting auto-recovery for $category error in $phase"
  
  case $category in
    "NETWORK")
      attempt_network_recovery "$error_output"
      ;;
    "PERMISSION")
      attempt_permission_recovery "$error_output"
      ;;
    "DEPENDENCY")
      attempt_dependency_recovery "$error_output"
      ;;
    "RESOURCE")
      attempt_resource_recovery "$error_output"
      ;;
    "BUILD")
      attempt_build_recovery "$error_output"
      ;;
    *)
      log_warning "No auto-recovery strategy available for $category"
      return 1
      ;;
  esac
}

attempt_network_recovery() {
  local error_output=$1
  
  log_info "Attempting network recovery..."
  
  # Wait and retry
  sleep 5
  
  # Check basic connectivity
  if ping -c 1 8.8.8.8 &>/dev/null; then
    log_success "Network connectivity restored"
    return 0
  fi
  
  # Try flushing DNS
  if command -v systemd-resolve &>/dev/null; then
    sudo systemd-resolve --flush-caches
  elif command -v dscacheutil &>/dev/null; then
    sudo dscacheutil -flushcache
  fi
  
  # Wait again
  sleep 10
  
  if ping -c 1 8.8.8.8 &>/dev/null; then
    log_success "Network recovery successful"
    return 0
  fi
  
  log_error "Network recovery failed"
  return 1
}

attempt_permission_recovery() {
  local error_output=$1
  
  log_info "Attempting permission recovery..."
  
  # Extract file paths from error output
  local file_paths=$(echo "$error_output" | grep -oE '/[^[:space:]]+' | head -5)
  
  for file_path in $file_paths; do
    if [[ -e "$file_path" ]]; then
      log_info "Fixing permissions for $file_path"
      chmod 755 "$file_path" 2>/dev/null || true
    fi
  done
  
  # Try to fix common permission issues
  if [[ -d node_modules ]]; then
    find node_modules -type f -exec chmod 644 {} \; 2>/dev/null || true
    find node_modules -type d -exec chmod 755 {} \; 2>/dev/null || true
  fi
  
  return 0
}

attempt_dependency_recovery() {
  local error_output=$1
  
  log_info "Attempting dependency recovery..."
  
  # Try npm install
  if [[ -f package.json ]] && command -v npm &>/dev/null; then
    log_info "Running npm install..."
    npm install --no-audit --no-fund 2>/dev/null || true
  fi
  
  # Try updating package lists (Linux)
  if command -v apt-get &>/dev/null; then
    sudo apt-get update -qq 2>/dev/null || true
  elif command -v yum &>/dev/null; then
    sudo yum makecache fast 2>/dev/null || true
  fi
  
  return 0
}

attempt_resource_recovery() {
  local error_output=$1
  
  log_info "Attempting resource recovery..."
  
  # Clean up temporary files
  if [[ -d /tmp ]]; then
    find /tmp -type f -mtime +1 -delete 2>/dev/null || true
  fi
  
  # Clear npm cache
  if command -v npm &>/dev/null; then
    npm cache clean --force 2>/dev/null || true
  fi
  
  # Clear Docker resources if available
  if command -v docker &>/dev/null; then
    docker system prune -f 2>/dev/null || true
  fi
  
  # Clean up log files
  find . -name "*.log" -size +100M -delete 2>/dev/null || true
  
  return 0
}

attempt_build_recovery() {
  local error_output=$1
  
  log_info "Attempting build recovery..."
  
  # Clear build caches
  if [[ -d node_modules/.cache ]]; then
    rm -rf node_modules/.cache
  fi
  
  if [[ -d .next ]]; then
    rm -rf .next
  fi
  
  if [[ -d dist ]]; then
    rm -rf dist
  fi
  
  # Reinstall dependencies
  if [[ -f package.json ]] && command -v npm &>/dev/null; then
    rm -rf node_modules package-lock.json
    npm install --no-audit --no-fund
  fi
  
  return 0
}

# ===============================================
# ERROR REPORTING
# ===============================================
generate_error_report() {
  local phase=$1
  local exit_code=$2
  local error_output=$3
  local classification=$4
  
  local report_file="$AUDIT_LOG_DIR/error-report-$phase-$(date +%Y%m%d_%H%M%S).json"
  
  cat > "$report_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "session_id": "$AUDIT_SESSION_ID",
  "phase": "$phase",
  "exit_code": $exit_code,
  "classification": $classification,
  "error_output": $(echo "$error_output" | jq -Rs .),
  "system_info": {
    "os": "$(uname -s)",
    "version": "$(uname -r)",
    "architecture": "$(uname -m)",
    "user": "$(whoami)",
    "pwd": "$(pwd)",
    "memory": "$(free -h | head -2 | tail -1)",
    "disk": "$(df -h . | tail -1)"
  },
  "environment": {
    "node_version": "$(node --version 2>/dev/null || echo 'not installed')",
    "npm_version": "$(npm --version 2>/dev/null || echo 'not installed')",
    "git_version": "$(git --version 2>/dev/null || echo 'not installed')"
  }
}
EOF
  
  log_info "Error report generated: $report_file"
  echo "$report_file"
}

# ===============================================
# ESCALATION PROCEDURES
# ===============================================
escalate_error() {
  local phase=$1
  local severity=$2
  local classification=$3
  local error_report=$4
  
  log_warning "Escalating $severity severity error in $phase"
  
  # Generate escalation ticket
  if [[ -f "$SCRIPT_DIR/utils/jira-integration.sh" ]]; then
    local ticket_id=$(bash "$SCRIPT_DIR/utils/jira-integration.sh" create_ticket \
      "Audit Error: $phase" \
      "Classification: $classification, Severity: $severity" \
      "High" \
      "$AUDIT_SESSION_ID" \
      "$error_report")
    
    if [[ -n "$ticket_id" ]]; then
      log_info "Escalation ticket created: $ticket_id"
      echo "$ticket_id" >> "$AUDIT_LOG_DIR/escalation-tickets.txt"
    fi
  fi
  
  # Send notification (if configured)
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{
        \"text\": \"🚨 TUPÁ Hub Audit Error\",
        \"attachments\": [{
          \"color\": \"danger\",
          \"fields\": [
            {\"title\": \"Phase\", \"value\": \"$phase\", \"short\": true},
            {\"title\": \"Severity\", \"value\": \"$severity\", \"short\": true},
            {\"title\": \"Session\", \"value\": \"$AUDIT_SESSION_ID\", \"short\": false}
          ]
        }]
      }" \
      "$SLACK_WEBHOOK_URL" 2>/dev/null || true
  fi
}

# ===============================================
# MAIN ERROR HANDLER
# ===============================================
handle_error() {
  local phase=$1
  local exit_code=$2
  local error_output="${3:-No error output captured}"
  
  log_error "Handling error in phase: $phase (exit code: $exit_code)"
  
  # Log error context
  log_error_context "$exit_code" "$error_output" "$phase"
  
  # Classify the error
  local classification=$(classify_error "$exit_code" "$error_output" "$phase")
  local category=$(echo "$classification" | jq -r '.category')
  local severity=$(echo "$classification" | jq -r '.severity')
  
  log_info "Error classified as: $category (severity: $severity)"
  
  # Generate detailed error report
  local error_report=$(generate_error_report "$phase" "$exit_code" "$error_output" "$classification")
  
  # Attempt auto-recovery for certain error types
  if [[ $severity -le $SEVERITY_MEDIUM ]]; then
    if attempt_auto_recovery "$category" "$phase" "$error_output"; then
      log_success "Auto-recovery successful for $phase"
      return 0
    fi
  fi
  
  # Escalate high-severity errors
  if [[ $severity -ge $SEVERITY_HIGH ]]; then
    escalate_error "$phase" "$severity" "$category" "$error_report"
  fi
  
  # Return exit code for upstream handling
  return $exit_code
}

# ===============================================
# VALIDATION
# ===============================================
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "Error Handler Utilities - TUPÁ Hub Audit System"
  echo "This script should be sourced, not executed directly."
  exit 1
fi