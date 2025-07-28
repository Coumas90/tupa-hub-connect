#!/bin/bash
# ===============================================
# PRE-TENANT AUDIT MASTER SCRIPT - TUPÁ Hub
# ===============================================
# Comprehensive 7-phase audit system with auto-fix integration
# Version: 1.0.0
# Author: TUPÁ Hub Security Team

set -euo pipefail

# ===============================================
# CONFIGURATION & GLOBAL VARIABLES
# ===============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AUDIT_LOG_DIR="$PROJECT_ROOT/audit-logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
AUDIT_SESSION_ID="AUDIT_${TIMESTAMP}"

# Create audit logs directory
mkdir -p "$AUDIT_LOG_DIR"

# Audit phases in execution order
PHASES=(
  "SECURITY_SCAN"
  "ARCHITECTURE_VALIDATION" 
  "CODE_PURIFICATION"
  "DEPENDENCY_FORTRESS"
  "PERFORMANCE_STRESS_TEST"
  "DOCS_COMPLETENESS"
  "ROLLBACK_SAFETY_NET"
)

# Global state tracking
declare -A PHASE_STATUS
declare -A PHASE_RETRIES
declare -A PHASE_ERRORS
CRITICAL_FAILURES=0
MAX_RETRIES=3
TOTAL_PHASES=${#PHASES[@]}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ===============================================
# UTILITY FUNCTIONS
# ===============================================
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$AUDIT_LOG_DIR/master-audit.log"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$AUDIT_LOG_DIR/master-audit.log"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$AUDIT_LOG_DIR/master-audit.log"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1" | tee -a "$AUDIT_LOG_DIR/master-audit.log"
}

log_critical() {
  echo -e "${RED}[CRITICAL]${NC} $1" | tee -a "$AUDIT_LOG_DIR/master-audit.log"
}

print_banner() {
  echo -e "${PURPLE}"
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║                    TUPÁ HUB AUDIT SYSTEM                  ║"
  echo "║                 Pre-Tenant Security Audit                 ║"
  echo "║                     Session: $AUDIT_SESSION_ID                ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_phase_banner() {
  local phase=$1
  local phase_num=$2
  echo -e "${CYAN}"
  echo "┌────────────────────────────────────────────────────────────┐"
  echo "│  PHASE $phase_num/$TOTAL_PHASES: $phase"
  echo "└────────────────────────────────────────────────────────────┘"
  echo -e "${NC}"
}

# ===============================================
# ERROR HANDLING & RECOVERY
# ===============================================
source "$SCRIPT_DIR/utils/error-handler.sh"
source "$SCRIPT_DIR/utils/rollback-manager.sh"

handle_phase_error() {
  local phase=$1
  local exit_code=$2
  local retry_count=${PHASE_RETRIES[$phase]:-0}
  
  log_error "Phase $phase failed with exit code $exit_code"
  PHASE_ERRORS[$phase]="Exit code: $exit_code, Retry: $((retry_count + 1))"
  
  if [[ $retry_count -lt $MAX_RETRIES ]]; then
    PHASE_RETRIES[$phase]=$((retry_count + 1))
    log_warning "Retrying phase $phase (attempt $((retry_count + 2))/$((MAX_RETRIES + 1)))"
    
    # Attempt auto-fix if available
    if [[ -f "$SCRIPT_DIR/auto-fix/${phase,,}-fixes.sh" ]]; then
      log_info "Attempting auto-fix for $phase"
      if bash "$SCRIPT_DIR/auto-fix/${phase,,}-fixes.sh"; then
        log_success "Auto-fix successful for $phase"
        return 0
      else
        log_error "Auto-fix failed for $phase"
      fi
    fi
    
    return 1  # Retry the phase
  else
    log_critical "Phase $phase failed after $MAX_RETRIES retries"
    PHASE_STATUS[$phase]="FAILED"
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
    
    # Create Jira ticket for unresolved issues
    if command -v node &> /dev/null && [[ -f "$SCRIPT_DIR/utils/jira-integration.sh" ]]; then
      log_info "Creating Jira ticket for failed phase: $phase"
      bash "$SCRIPT_DIR/utils/jira-integration.sh" create_ticket \
        "Audit Phase Failure: $phase" \
        "Phase $phase failed after $MAX_RETRIES retries. Exit code: $exit_code" \
        "Critical" \
        "$AUDIT_SESSION_ID"
    fi
    
    return 2  # Critical failure
  fi
}

# ===============================================
# PHASE EXECUTION ENGINE
# ===============================================
execute_phase() {
  local phase=$1
  local phase_num=$2
  local phase_script="$SCRIPT_DIR/audit-phases/${phase}.sh"
  local phase_log="$AUDIT_LOG_DIR/${phase}_${TIMESTAMP}.log"
  
  print_phase_banner "$phase" "$phase_num"
  
  # Initialize phase tracking
  PHASE_STATUS[$phase]="RUNNING"
  PHASE_RETRIES[$phase]=0
  
  # Check if phase script exists
  if [[ ! -f "$phase_script" ]]; then
    log_error "Phase script not found: $phase_script"
    PHASE_STATUS[$phase]="MISSING"
    return 1
  fi
  
  # Make script executable
  chmod +x "$phase_script"
  
  local retry_count=0
  while [[ $retry_count -le $MAX_RETRIES ]]; do
    log_info "Executing phase: $phase (attempt $((retry_count + 1)))"
    
    # Execute phase with timeout and logging
    if timeout 1800 bash "$phase_script" > "$phase_log" 2>&1; then
      log_success "Phase $phase completed successfully"
      PHASE_STATUS[$phase]="SUCCESS"
      return 0
    else
      local exit_code=$?
      log_error "Phase $phase failed (attempt $((retry_count + 1)))"
      
      # Handle the error and determine next action
      handle_phase_error "$phase" "$exit_code"
      local error_action=$?
      
      if [[ $error_action -eq 0 ]]; then
        # Auto-fix succeeded, retry immediately
        continue
      elif [[ $error_action -eq 1 ]]; then
        # Standard retry
        retry_count=$((retry_count + 1))
        sleep 5  # Brief pause before retry
        continue
      else
        # Critical failure, stop retrying
        return $exit_code
      fi
    fi
  done
}

# ===============================================
# PRE-AUDIT SETUP
# ===============================================
setup_audit_environment() {
  log_info "Setting up audit environment..."
  
  # Create necessary directories
  mkdir -p "$AUDIT_LOG_DIR"
  mkdir -p "$PROJECT_ROOT/audit-reports"
  
  # Initialize git safety checkpoint
  if git rev-parse --git-dir > /dev/null 2>&1; then
    local current_commit=$(git rev-parse HEAD)
    echo "$current_commit" > "$AUDIT_LOG_DIR/safety-checkpoint.txt"
    log_info "Git safety checkpoint created: $current_commit"
  fi
  
  # Check system requirements
  local missing_deps=()
  
  for cmd in node npm git curl jq; do
    if ! command -v "$cmd" &> /dev/null; then
      missing_deps+=("$cmd")
    fi
  done
  
  if [[ ${#missing_deps[@]} -gt 0 ]]; then
    log_warning "Missing dependencies: ${missing_deps[*]}"
    log_info "Installing missing dependencies..."
    
    # Attempt to install missing dependencies
    if command -v apt-get &> /dev/null; then
      sudo apt-get update && sudo apt-get install -y "${missing_deps[@]}"
    elif command -v brew &> /dev/null; then
      brew install "${missing_deps[@]}"
    else
      log_error "Cannot auto-install dependencies. Please install manually: ${missing_deps[*]}"
      return 1
    fi
  fi
  
  log_success "Audit environment setup complete"
}

# ===============================================
# MAIN AUDIT EXECUTION
# ===============================================
run_audit_phases() {
  local phase_num=1
  
  for phase in "${PHASES[@]}"; do
    log_info "Starting phase $phase_num/$TOTAL_PHASES: $phase"
    
    if execute_phase "$phase" "$phase_num"; then
      log_success "✅ Phase $phase completed"
    else
      log_error "❌ Phase $phase failed"
      
      # Check if this is a critical phase that should halt execution
      if [[ "$phase" == "SECURITY_SCAN" || "$phase" == "ROLLBACK_SAFETY_NET" ]]; then
        log_critical "Critical phase $phase failed. Aborting audit."
        emergency_rollback
        exit 1
      fi
    fi
    
    phase_num=$((phase_num + 1))
    
    # Brief pause between phases
    sleep 2
  done
}

# ===============================================
# REPORT GENERATION
# ===============================================
generate_audit_report() {
  log_info "Generating comprehensive audit report..."
  
  local report_file="$PROJECT_ROOT/audit-reports/AUDIT_REPORT_${TIMESTAMP}.md"
  
  # Execute the report generator
  if command -v node &> /dev/null && [[ -f "$SCRIPT_DIR/audit-report.js" ]]; then
    node "$SCRIPT_DIR/audit-report.js" \
      --session-id "$AUDIT_SESSION_ID" \
      --log-dir "$AUDIT_LOG_DIR" \
      --output "$report_file" \
      --phases "${PHASES[*]}" \
      --status "$(declare -p PHASE_STATUS)" \
      --errors "$(declare -p PHASE_ERRORS)"
    
    log_success "Audit report generated: $report_file"
    
    # Display report summary
    if [[ -f "$report_file" ]]; then
      echo -e "\n${PURPLE}=== AUDIT SUMMARY ===${NC}"
      head -20 "$report_file"
      echo -e "\n${BLUE}Full report: $report_file${NC}"
    fi
  else
    log_error "Node.js or audit-report.js not found. Generating basic report..."
    generate_basic_report "$report_file"
  fi
}

generate_basic_report() {
  local report_file=$1
  
  cat > "$report_file" << EOF
# TUPÁ Hub Pre-Tenant Audit Report
**Session ID:** $AUDIT_SESSION_ID  
**Generated:** $(date)  
**Critical Failures:** $CRITICAL_FAILURES

## Phase Results
EOF

  for phase in "${PHASES[@]}"; do
    local status=${PHASE_STATUS[$phase]:-"NOT_RUN"}
    local icon="❓"
    
    case $status in
      "SUCCESS") icon="✅" ;;
      "FAILED") icon="❌" ;;
      "RUNNING") icon="🔄" ;;
      "MISSING") icon="⚠️" ;;
    esac
    
    echo "- $icon **$phase**: $status" >> "$report_file"
    
    if [[ -n "${PHASE_ERRORS[$phase]:-}" ]]; then
      echo "  - Error: ${PHASE_ERRORS[$phase]}" >> "$report_file"
    fi
  done
  
  cat >> "$report_file" << EOF

## Rollback Instructions
\`\`\`bash
# Emergency rollback to safety checkpoint
cd $PROJECT_ROOT
git reset --hard \$(cat $AUDIT_LOG_DIR/safety-checkpoint.txt)
\`\`\`
EOF
}

# ===============================================
# EMERGENCY PROCEDURES
# ===============================================
emergency_rollback() {
  log_critical "Initiating emergency rollback procedure..."
  
  if [[ -f "$AUDIT_LOG_DIR/safety-checkpoint.txt" ]]; then
    local checkpoint=$(cat "$AUDIT_LOG_DIR/safety-checkpoint.txt")
    log_info "Rolling back to checkpoint: $checkpoint"
    
    cd "$PROJECT_ROOT"
    git reset --hard "$checkpoint"
    
    log_success "Emergency rollback completed"
  else
    log_error "No safety checkpoint found. Manual intervention required."
  fi
}

cleanup_audit_session() {
  log_info "Cleaning up audit session..."
  
  # Archive logs older than 30 days
  find "$AUDIT_LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
  
  # Compress current session logs
  if command -v gzip &> /dev/null; then
    find "$AUDIT_LOG_DIR" -name "*${TIMESTAMP}*.log" -exec gzip {} \; 2>/dev/null || true
  fi
  
  log_success "Cleanup completed"
}

# ===============================================
# SIGNAL HANDLERS
# ===============================================
cleanup_on_exit() {
  local exit_code=$?
  
  log_info "Audit session ending with exit code: $exit_code"
  
  if [[ $exit_code -ne 0 ]]; then
    log_error "Audit session terminated unexpectedly"
    generate_audit_report
  fi
  
  cleanup_audit_session
  exit $exit_code
}

trap cleanup_on_exit EXIT
trap 'log_warning "Received SIGINT. Gracefully shutting down..."; exit 130' INT
trap 'log_warning "Received SIGTERM. Gracefully shutting down..."; exit 143' TERM

# ===============================================
# MAIN EXECUTION
# ===============================================
main() {
  print_banner
  
  log_info "Starting TUPÁ Hub Pre-Tenant Audit"
  log_info "Session ID: $AUDIT_SESSION_ID"
  log_info "Project Root: $PROJECT_ROOT"
  log_info "Total Phases: $TOTAL_PHASES"
  
  # Pre-audit setup
  if ! setup_audit_environment; then
    log_critical "Failed to setup audit environment"
    exit 1
  fi
  
  # Execute audit phases
  local start_time=$(date +%s)
  run_audit_phases
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  # Generate comprehensive report
  generate_audit_report
  
  # Final status
  echo -e "\n${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${PURPLE}║                    AUDIT COMPLETED                        ║${NC}"
  echo -e "${PURPLE}║  Duration: ${duration}s | Critical Failures: $CRITICAL_FAILURES                 ║${NC}"
  echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
  
  if [[ $CRITICAL_FAILURES -eq 0 ]]; then
    log_success "🎉 All audit phases completed successfully!"
    exit 0
  else
    log_critical "⚠️  Audit completed with $CRITICAL_FAILURES critical failures"
    exit 1
  fi
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi