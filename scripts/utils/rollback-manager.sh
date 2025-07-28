#!/bin/bash
# ===============================================
# TUPÁ HUB ROLLBACK MANAGER
# ===============================================
# Safe rollback and recovery system for audit failures
# Version: 1.0.0

# ===============================================
# CONFIGURATION
# ===============================================
ROLLBACK_DIR="$PROJECT_ROOT/.audit-rollback"
BACKUP_DIR="$ROLLBACK_DIR/backups"
CHECKPOINT_DIR="$ROLLBACK_DIR/checkpoints"
ROLLBACK_LOG="$ROLLBACK_DIR/rollback.log"

# Create rollback directories
mkdir -p "$BACKUP_DIR" "$CHECKPOINT_DIR"

# ===============================================
# CHECKPOINT MANAGEMENT
# ===============================================
create_safety_checkpoint() {
  local checkpoint_name=${1:-"pre-audit-$(date +%Y%m%d_%H%M%S)"}
  local checkpoint_file="$CHECKPOINT_DIR/$checkpoint_name.checkpoint"
  
  log_info "Creating safety checkpoint: $checkpoint_name"
  
  # Ensure we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not in a git repository. Cannot create checkpoint."
    return 1
  fi
  
  # Get current git state
  local current_commit=$(git rev-parse HEAD)
  local current_branch=$(git branch --show-current)
  local has_uncommitted=$(git status --porcelain | wc -l)
  
  # Create stash if there are uncommitted changes
  local stash_ref=""
  if [[ $has_uncommitted -gt 0 ]]; then
    log_warning "Uncommitted changes detected. Creating stash..."
    stash_ref=$(git stash create "Audit checkpoint: $checkpoint_name")
    if [[ -n "$stash_ref" ]]; then
      git stash store -m "Audit checkpoint: $checkpoint_name" "$stash_ref"
      log_info "Uncommitted changes stashed: $stash_ref"
    fi
  fi
  
  # Create checkpoint metadata
  cat > "$checkpoint_file" << EOF
{
  "checkpoint_name": "$checkpoint_name",
  "created_at": "$(date -Iseconds)",
  "commit_hash": "$current_commit",
  "branch": "$current_branch",
  "stash_ref": "$stash_ref",
  "has_uncommitted": $has_uncommitted,
  "project_root": "$PROJECT_ROOT",
  "audit_session": "${AUDIT_SESSION_ID:-}",
  "git_status": $(git status --porcelain | jq -Rs .),
  "system_info": {
    "node_version": "$(node --version 2>/dev/null || echo 'not installed')",
    "npm_version": "$(npm --version 2>/dev/null || echo 'not installed')",
    "git_version": "$(git --version)"
  }
}
EOF
  
  # Create file backups of critical files
  backup_critical_files "$checkpoint_name"
  
  # Log checkpoint creation
  echo "$(date -Iseconds) CHECKPOINT_CREATED $checkpoint_name $current_commit" >> "$ROLLBACK_LOG"
  
  log_success "Safety checkpoint created: $checkpoint_name"
  echo "$checkpoint_file"
}

backup_critical_files() {
  local checkpoint_name=$1
  local backup_subdir="$BACKUP_DIR/$checkpoint_name"
  
  mkdir -p "$backup_subdir"
  
  # List of critical files to backup
  local critical_files=(
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "vite.config.ts"
    "tailwind.config.ts"
    "supabase/config.toml"
    ".env"
    ".env.local"
    "src/integrations/supabase/types.ts"
  )
  
  for file in "${critical_files[@]}"; do
    if [[ -f "$PROJECT_ROOT/$file" ]]; then
      local backup_path="$backup_subdir/$(dirname "$file")"
      mkdir -p "$backup_path"
      cp "$PROJECT_ROOT/$file" "$backup_path/"
      log_info "Backed up: $file"
    fi
  done
  
  # Backup database migrations
  if [[ -d "$PROJECT_ROOT/supabase/migrations" ]]; then
    cp -r "$PROJECT_ROOT/supabase/migrations" "$backup_subdir/"
    log_info "Backed up: supabase/migrations/"
  fi
  
  # Create backup manifest
  find "$backup_subdir" -type f > "$backup_subdir/manifest.txt"
}

list_checkpoints() {
  log_info "Available safety checkpoints:"
  
  if [[ ! -d "$CHECKPOINT_DIR" ]] || [[ -z "$(ls -A "$CHECKPOINT_DIR" 2>/dev/null)" ]]; then
    log_warning "No checkpoints found"
    return 1
  fi
  
  echo "| Name | Created | Commit | Branch | Status |"
  echo "|------|---------|--------|--------|--------|"
  
  for checkpoint_file in "$CHECKPOINT_DIR"/*.checkpoint; do
    if [[ -f "$checkpoint_file" ]]; then
      local name=$(jq -r '.checkpoint_name' "$checkpoint_file")
      local created=$(jq -r '.created_at' "$checkpoint_file")
      local commit=$(jq -r '.commit_hash[:8]' "$checkpoint_file")
      local branch=$(jq -r '.branch' "$checkpoint_file")
      
      # Check if commit still exists
      local status="✅ Valid"
      if ! git cat-file -e "$(jq -r '.commit_hash' "$checkpoint_file")" 2>/dev/null; then
        status="❌ Commit not found"
      fi
      
      echo "| $name | $created | $commit | $branch | $status |"
    fi
  done
}

# ===============================================
# ROLLBACK OPERATIONS
# ===============================================
rollback_to_checkpoint() {
  local checkpoint_name=$1
  local checkpoint_file="$CHECKPOINT_DIR/$checkpoint_name.checkpoint"
  
  if [[ ! -f "$checkpoint_file" ]]; then
    log_error "Checkpoint not found: $checkpoint_name"
    return 1
  fi
  
  log_warning "🚨 INITIATING ROLLBACK TO CHECKPOINT: $checkpoint_name"
  log_warning "This will reset your repository to a previous state."
  
  # Parse checkpoint metadata
  local commit_hash=$(jq -r '.commit_hash' "$checkpoint_file")
  local branch=$(jq -r '.branch' "$checkpoint_file")
  local stash_ref=$(jq -r '.stash_ref' "$checkpoint_file")
  local has_uncommitted=$(jq -r '.has_uncommitted' "$checkpoint_file")
  
  # Verify commit exists
  if ! git cat-file -e "$commit_hash" 2>/dev/null; then
    log_error "Commit $commit_hash no longer exists in repository"
    return 1
  fi
  
  # Create pre-rollback checkpoint
  log_info "Creating pre-rollback checkpoint..."
  create_safety_checkpoint "pre-rollback-$(date +%Y%m%d_%H%M%S)"
  
  # Perform rollback
  log_info "Resetting to commit: $commit_hash"
  
  # Stash any current uncommitted changes
  if [[ $(git status --porcelain | wc -l) -gt 0 ]]; then
    git stash push -m "Pre-rollback stash $(date)"
  fi
  
  # Reset to checkpoint commit
  if ! git reset --hard "$commit_hash"; then
    log_error "Failed to reset to checkpoint commit"
    return 1
  fi
  
  # Restore stashed changes if they existed at checkpoint
  if [[ "$stash_ref" != "null" && "$stash_ref" != "" ]]; then
    log_info "Restoring stashed changes: $stash_ref"
    if git stash list | grep -q "$stash_ref"; then
      git stash pop || log_warning "Could not restore stashed changes"
    fi
  fi
  
  # Restore critical files from backup
  restore_critical_files "$checkpoint_name"
  
  # Reinstall dependencies if package.json changed
  if [[ -f "package.json" ]] && command -v npm &>/dev/null; then
    log_info "Reinstalling dependencies..."
    npm ci --no-audit --no-fund || log_warning "Failed to reinstall dependencies"
  fi
  
  # Log rollback
  echo "$(date -Iseconds) ROLLBACK_EXECUTED $checkpoint_name $commit_hash" >> "$ROLLBACK_LOG"
  
  log_success "✅ Rollback to checkpoint '$checkpoint_name' completed"
  log_info "Current commit: $(git rev-parse HEAD)"
}

restore_critical_files() {
  local checkpoint_name=$1
  local backup_subdir="$BACKUP_DIR/$checkpoint_name"
  
  if [[ ! -d "$backup_subdir" ]]; then
    log_warning "No file backups found for checkpoint: $checkpoint_name"
    return 1
  fi
  
  log_info "Restoring critical files from backup..."
  
  # Restore files from backup
  if [[ -f "$backup_subdir/manifest.txt" ]]; then
    while IFS= read -r backed_up_file; do
      local relative_path="${backed_up_file#$backup_subdir/}"
      local target_path="$PROJECT_ROOT/$relative_path"
      
      # Skip manifest and hidden files
      if [[ "$relative_path" == "manifest.txt" ]] || [[ "$relative_path" == .* ]]; then
        continue
      fi
      
      # Ensure target directory exists
      mkdir -p "$(dirname "$target_path")"
      
      # Restore file
      cp "$backed_up_file" "$target_path"
      log_info "Restored: $relative_path"
      
    done < "$backup_subdir/manifest.txt"
  else
    log_warning "No manifest found, performing directory restore..."
    cp -r "$backup_subdir"/* "$PROJECT_ROOT/" 2>/dev/null || true
  fi
}

# ===============================================
# EMERGENCY PROCEDURES
# ===============================================
emergency_rollback() {
  local reason=${1:-"Emergency rollback triggered"}
  
  log_critical "🚨 EMERGENCY ROLLBACK INITIATED: $reason"
  
  # Find the most recent valid checkpoint
  local latest_checkpoint=""
  local latest_time=""
  
  for checkpoint_file in "$CHECKPOINT_DIR"/*.checkpoint; do
    if [[ -f "$checkpoint_file" ]]; then
      local commit_hash=$(jq -r '.commit_hash' "$checkpoint_file")
      local created_at=$(jq -r '.created_at' "$checkpoint_file")
      
      # Check if commit is valid
      if git cat-file -e "$commit_hash" 2>/dev/null; then
        if [[ -z "$latest_time" ]] || [[ "$created_at" > "$latest_time" ]]; then
          latest_checkpoint=$(jq -r '.checkpoint_name' "$checkpoint_file")
          latest_time="$created_at"
        fi
      fi
    fi
  done
  
  if [[ -n "$latest_checkpoint" ]]; then
    log_info "Rolling back to latest valid checkpoint: $latest_checkpoint"
    rollback_to_checkpoint "$latest_checkpoint"
  else
    log_error "No valid checkpoints found. Attempting HEAD~1 reset..."
    
    # Last resort: reset to previous commit
    if git rev-parse HEAD~1 > /dev/null 2>&1; then
      git reset --hard HEAD~1
      log_warning "Reset to HEAD~1. Manual intervention may be required."
    else
      log_critical "Cannot perform automatic recovery. Manual intervention required."
      return 1
    fi
  fi
  
  # Log emergency rollback
  echo "$(date -Iseconds) EMERGENCY_ROLLBACK $reason" >> "$ROLLBACK_LOG"
}

quick_rollback() {
  local steps=${1:-1}
  
  log_warning "Performing quick rollback: $steps commit(s)"
  
  # Verify we can go back the requested number of steps
  if ! git rev-parse "HEAD~$steps" > /dev/null 2>&1; then
    log_error "Cannot rollback $steps commits - not enough history"
    return 1
  fi
  
  # Create emergency checkpoint first
  create_safety_checkpoint "quick-rollback-$(date +%Y%m%d_%H%M%S)"
  
  # Perform the rollback
  git reset --hard "HEAD~$steps"
  
  log_success "Quick rollback completed: $(git rev-parse HEAD)"
  echo "$(date -Iseconds) QUICK_ROLLBACK $steps $(git rev-parse HEAD)" >> "$ROLLBACK_LOG"
}

# ===============================================
# VALIDATION AND RECOVERY
# ===============================================
validate_rollback_integrity() {
  local checkpoint_name=$1
  
  log_info "Validating rollback integrity for: $checkpoint_name"
  
  local issues=()
  
  # Check git repository state
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    issues+=("Git repository corrupted")
  fi
  
  # Check critical files exist
  local critical_files=("package.json" "src/main.tsx" "index.html")
  for file in "${critical_files[@]}"; do
    if [[ ! -f "$PROJECT_ROOT/$file" ]]; then
      issues+=("Critical file missing: $file")
    fi
  done
  
  # Check if npm dependencies are intact
  if [[ -f "package.json" ]] && [[ ! -d "node_modules" ]]; then
    issues+=("Node modules missing - run 'npm install'")
  fi
  
  # Check TypeScript compilation
  if command -v npx &>/dev/null && [[ -f "tsconfig.json" ]]; then
    if ! npx tsc --noEmit --skipLibCheck &>/dev/null; then
      issues+=("TypeScript compilation errors detected")
    fi
  fi
  
  # Report validation results
  if [[ ${#issues[@]} -eq 0 ]]; then
    log_success "✅ Rollback integrity validation passed"
    return 0
  else
    log_error "❌ Rollback integrity validation failed:"
    for issue in "${issues[@]}"; do
      log_error "  - $issue"
    done
    return 1
  fi
}

# ===============================================
# CLEANUP AND MAINTENANCE
# ===============================================
cleanup_old_checkpoints() {
  local max_age_days=${1:-30}
  
  log_info "Cleaning up checkpoints older than $max_age_days days"
  
  local deleted_count=0
  
  for checkpoint_file in "$CHECKPOINT_DIR"/*.checkpoint; do
    if [[ -f "$checkpoint_file" ]]; then
      local created_at=$(jq -r '.created_at' "$checkpoint_file")
      local checkpoint_name=$(jq -r '.checkpoint_name' "$checkpoint_file")
      
      # Calculate age in days
      local created_timestamp=$(date -d "$created_at" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${created_at%.*}" +%s 2>/dev/null)
      local current_timestamp=$(date +%s)
      local age_days=$(( (current_timestamp - created_timestamp) / 86400 ))
      
      if [[ $age_days -gt $max_age_days ]]; then
        log_info "Deleting old checkpoint: $checkpoint_name (${age_days} days old)"
        
        # Remove checkpoint file
        rm "$checkpoint_file"
        
        # Remove associated backup
        if [[ -d "$BACKUP_DIR/$checkpoint_name" ]]; then
          rm -rf "$BACKUP_DIR/$checkpoint_name"
        fi
        
        deleted_count=$((deleted_count + 1))
      fi
    fi
  done
  
  log_success "Cleanup completed. Deleted $deleted_count old checkpoints."
}

# ===============================================
# REPORTING
# ===============================================
generate_rollback_report() {
  local output_file="${1:-rollback-report-$(date +%Y%m%d).md}"
  
  log_info "Generating rollback report: $output_file"
  
  cat > "$output_file" << EOF
# TUPÁ Hub Rollback System Report
**Generated:** $(date -Iseconds)  
**System:** $(uname -s) $(uname -r)  

## Available Checkpoints
$(list_checkpoints)

## Rollback History
EOF
  
  if [[ -f "$ROLLBACK_LOG" ]]; then
    echo "| Timestamp | Action | Details |" >> "$output_file"
    echo "|-----------|---------|---------|" >> "$output_file"
    
    while IFS= read -r log_line; do
      local timestamp=$(echo "$log_line" | cut -d' ' -f1)
      local action=$(echo "$log_line" | cut -d' ' -f2)
      local details=$(echo "$log_line" | cut -d' ' -f3-)
      
      echo "| $timestamp | $action | $details |" >> "$output_file"
    done < <(tail -20 "$ROLLBACK_LOG")
  else
    echo "*No rollback history available*" >> "$output_file"
  fi
  
  cat >> "$output_file" << EOF

## System Status
- **Git Repository:** $(git rev-parse --git-dir > /dev/null 2>&1 && echo "✅ Valid" || echo "❌ Invalid")
- **Current Commit:** $(git rev-parse HEAD 2>/dev/null || echo "Unknown")
- **Current Branch:** $(git branch --show-current 2>/dev/null || echo "Unknown")
- **Uncommitted Changes:** $(git status --porcelain 2>/dev/null | wc -l || echo "Unknown")

## Emergency Commands
\`\`\`bash
# Quick rollback (1 commit)
bash scripts/utils/rollback-manager.sh quick_rollback 1

# Emergency rollback to latest checkpoint
bash scripts/utils/rollback-manager.sh emergency_rollback

# List all checkpoints
bash scripts/utils/rollback-manager.sh list_checkpoints
\`\`\`
EOF
  
  log_success "Rollback report generated: $output_file"
  echo "$output_file"
}

# ===============================================
# MAIN COMMAND HANDLER
# ===============================================
main() {
  local command=${1:-"help"}
  
  case $command in
    "create_checkpoint")
      create_safety_checkpoint "$2"
      ;;
    "list_checkpoints")
      list_checkpoints
      ;;
    "rollback")
      rollback_to_checkpoint "$2"
      ;;
    "emergency_rollback")
      emergency_rollback "$2"
      ;;
    "quick_rollback")
      quick_rollback "${2:-1}"
      ;;
    "validate")
      validate_rollback_integrity "$2"
      ;;
    "cleanup")
      cleanup_old_checkpoints "${2:-30}"
      ;;
    "report")
      generate_rollback_report "$2"
      ;;
    "help"|*)
      cat << EOF
TUPÁ Hub Rollback Manager

USAGE:
  $0 COMMAND [ARGUMENTS]

COMMANDS:
  create_checkpoint [NAME]
    Create a new safety checkpoint
    
  list_checkpoints
    List all available checkpoints
    
  rollback CHECKPOINT_NAME
    Rollback to a specific checkpoint
    
  emergency_rollback [REASON]
    Emergency rollback to latest valid checkpoint
    
  quick_rollback [STEPS]
    Quick rollback N commits (default: 1)
    
  validate CHECKPOINT_NAME
    Validate rollback integrity
    
  cleanup [MAX_AGE_DAYS]
    Clean up old checkpoints (default: 30 days)
    
  report [OUTPUT_FILE]
    Generate rollback system report
    
  help
    Show this help message

EXAMPLES:
  $0 create_checkpoint "before-security-update"
  $0 rollback "before-security-update"
  $0 emergency_rollback "Critical audit failure"
  $0 quick_rollback 2
EOF
      ;;
  esac
}

# Execute if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi