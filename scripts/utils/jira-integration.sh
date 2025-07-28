#!/bin/bash
# ===============================================
# TUPÁ HUB JIRA INTEGRATION UTILITIES
# ===============================================
# Automated ticket creation and management for audit issues
# Version: 1.0.0

# ===============================================
# CONFIGURATION
# ===============================================
JIRA_BASE_URL="${JIRA_BASE_URL:-https://tupahub.atlassian.net}"
JIRA_USERNAME="${JIRA_USERNAME:-audit-bot@tupahub.com}"
JIRA_API_TOKEN="${JIRA_API_TOKEN:-}"
JIRA_PROJECT_KEY="${JIRA_PROJECT_KEY:-AUDIT}"

# Ticket types
TICKET_TYPE_BUG="Bug"
TICKET_TYPE_TASK="Task"
TICKET_TYPE_STORY="Story"

# Priority mapping
declare -A PRIORITY_MAP=(
  ["Critical"]="Highest"
  ["High"]="High"
  ["Medium"]="Medium"
  ["Low"]="Low"
  ["Minimal"]="Lowest"
)

# ===============================================
# UTILITY FUNCTIONS
# ===============================================
check_jira_config() {
  local missing_config=()
  
  if [[ -z "$JIRA_API_TOKEN" ]]; then
    missing_config+=("JIRA_API_TOKEN")
  fi
  
  if [[ -z "$JIRA_USERNAME" ]]; then
    missing_config+=("JIRA_USERNAME")
  fi
  
  if [[ -z "$JIRA_PROJECT_KEY" ]]; then
    missing_config+=("JIRA_PROJECT_KEY")
  fi
  
  if [[ ${#missing_config[@]} -gt 0 ]]; then
    log_warning "Missing Jira configuration: ${missing_config[*]}"
    log_info "To enable Jira integration, set the following environment variables:"
    for config in "${missing_config[@]}"; do
      log_info "  export $config='your_value'"
    done
    return 1
  fi
  
  return 0
}

jira_api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  
  if ! check_jira_config; then
    return 1
  fi
  
  local auth_header="Authorization: Basic $(echo -n "$JIRA_USERNAME:$JIRA_API_TOKEN" | base64)"
  local url="$JIRA_BASE_URL/rest/api/3$endpoint"
  
  if [[ "$method" == "GET" ]]; then
    curl -s -X GET \
      -H "$auth_header" \
      -H "Accept: application/json" \
      "$url"
  elif [[ "$method" == "POST" ]]; then
    curl -s -X POST \
      -H "$auth_header" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$url"
  elif [[ "$method" == "PUT" ]]; then
    curl -s -X PUT \
      -H "$auth_header" \
      -H "Accept: application/json" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$url"
  fi
}

# ===============================================
# TICKET MANAGEMENT
# ===============================================
create_ticket() {
  local summary=$1
  local description=$2
  local priority=${3:-"Medium"}
  local session_id=${4:-""}
  local attachment_path=${5:-""}
  
  if ! check_jira_config; then
    log_error "Cannot create Jira ticket: missing configuration"
    return 1
  fi
  
  log_info "Creating Jira ticket: $summary"
  
  # Map priority
  local jira_priority=${PRIORITY_MAP[$priority]:-"Medium"}
  
  # Generate ticket description with context
  local full_description="$description

## Audit Context
- **Session ID:** $session_id
- **Timestamp:** $(date -Iseconds)
- **Environment:** $(uname -s) $(uname -r)
- **Project:** TUPÁ Hub Pre-Tenant Audit

## Reproduction Steps
1. Run audit command: \`bash scripts/pre-tenant-audit.sh\`
2. Monitor logs in: \`audit-logs/\`
3. Review error details in phase logs

## Additional Information
- Log files available in audit session directory
- Error classification and recovery attempts logged
- System metrics captured at time of failure"

  if [[ -n "$attachment_path" && -f "$attachment_path" ]]; then
    full_description+="\n\n**Error Report:** See attached JSON file for detailed technical information"
  fi
  
  # Create ticket payload
  local ticket_payload=$(cat << EOF
{
  "fields": {
    "project": {
      "key": "$JIRA_PROJECT_KEY"
    },
    "summary": "$summary",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "text": $(echo "$full_description" | jq -Rs .),
              "type": "text"
            }
          ]
        }
      ]
    },
    "issuetype": {
      "name": "$TICKET_TYPE_BUG"
    },
    "priority": {
      "name": "$jira_priority"
    },
    "labels": [
      "audit",
      "automated",
      "pre-tenant",
      "security"
    ],
    "components": [
      {
        "name": "Audit System"
      }
    ]
  }
}
EOF
)
  
  # Create the ticket
  local response=$(jira_api_call "POST" "/issue" "$ticket_payload")
  
  if [[ $? -eq 0 ]]; then
    local ticket_id=$(echo "$response" | jq -r '.key // empty')
    
    if [[ -n "$ticket_id" ]]; then
      log_success "Jira ticket created: $ticket_id"
      log_info "Ticket URL: $JIRA_BASE_URL/browse/$ticket_id"
      
      # Attach error report if provided
      if [[ -n "$attachment_path" && -f "$attachment_path" ]]; then
        attach_file_to_ticket "$ticket_id" "$attachment_path"
      fi
      
      echo "$ticket_id"
      return 0
    else
      local error_msg=$(echo "$response" | jq -r '.errorMessages[]? // .errors? // "Unknown error"')
      log_error "Failed to create Jira ticket: $error_msg"
      return 1
    fi
  else
    log_error "Failed to communicate with Jira API"
    return 1
  fi
}

attach_file_to_ticket() {
  local ticket_id=$1
  local file_path=$2
  
  if [[ ! -f "$file_path" ]]; then
    log_error "Attachment file not found: $file_path"
    return 1
  fi
  
  log_info "Attaching file to ticket $ticket_id: $(basename "$file_path")"
  
  local auth_header="Authorization: Basic $(echo -n "$JIRA_USERNAME:$JIRA_API_TOKEN" | base64)"
  local url="$JIRA_BASE_URL/rest/api/3/issue/$ticket_id/attachments"
  
  local response=$(curl -s -X POST \
    -H "$auth_header" \
    -H "X-Atlassian-Token: no-check" \
    -F "file=@$file_path" \
    "$url")
  
  if [[ $? -eq 0 ]]; then
    local attachment_id=$(echo "$response" | jq -r '.[0].id // empty')
    if [[ -n "$attachment_id" ]]; then
      log_success "File attached successfully: $attachment_id"
    else
      log_error "Failed to attach file: $(echo "$response" | jq -r '.errorMessages[]? // "Unknown error"')"
    fi
  else
    log_error "Failed to upload attachment"
  fi
}

update_ticket() {
  local ticket_id=$1
  local comment=$2
  local status=${3:-""}
  
  if ! check_jira_config; then
    log_error "Cannot update Jira ticket: missing configuration"
    return 1
  fi
  
  log_info "Updating Jira ticket: $ticket_id"
  
  # Add comment
  if [[ -n "$comment" ]]; then
    local comment_payload=$(cat << EOF
{
  "body": {
    "type": "doc",
    "version": 1,
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "text": "$comment",
            "type": "text"
          }
        ]
      }
    ]
  }
}
EOF
)
    
    jira_api_call "POST" "/issue/$ticket_id/comment" "$comment_payload" > /dev/null
  fi
  
  # Update status if provided
  if [[ -n "$status" ]]; then
    # Get available transitions
    local transitions=$(jira_api_call "GET" "/issue/$ticket_id/transitions")
    local transition_id=$(echo "$transitions" | jq -r ".transitions[] | select(.name == \"$status\") | .id")
    
    if [[ -n "$transition_id" ]]; then
      local transition_payload=$(cat << EOF
{
  "transition": {
    "id": "$transition_id"
  }
}
EOF
)
      jira_api_call "POST" "/issue/$ticket_id/transitions" "$transition_payload" > /dev/null
      log_success "Ticket status updated to: $status"
    else
      log_warning "Status transition '$status' not available for ticket $ticket_id"
    fi
  fi
}

get_ticket_status() {
  local ticket_id=$1
  
  if ! check_jira_config; then
    return 1
  fi
  
  local response=$(jira_api_call "GET" "/issue/$ticket_id?fields=status,summary")
  
  if [[ $? -eq 0 ]]; then
    local status=$(echo "$response" | jq -r '.fields.status.name // "Unknown"')
    local summary=$(echo "$response" | jq -r '.fields.summary // "Unknown"')
    
    echo "Status: $status"
    echo "Summary: $summary"
    return 0
  else
    log_error "Failed to get ticket status for $ticket_id"
    return 1
  fi
}

# ===============================================
# BULK OPERATIONS
# ===============================================
create_audit_epic() {
  local session_id=$1
  local summary="Pre-Tenant Audit Session: $session_id"
  local description="Epic for tracking all issues found during audit session $session_id"
  
  if ! check_jira_config; then
    return 1
  fi
  
  local epic_payload=$(cat << EOF
{
  "fields": {
    "project": {
      "key": "$JIRA_PROJECT_KEY"
    },
    "summary": "$summary",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "text": "$description",
              "type": "text"
            }
          ]
        }
      ]
    },
    "issuetype": {
      "name": "Epic"
    },
    "priority": {
      "name": "Medium"
    },
    "labels": [
      "audit",
      "session-$session_id",
      "pre-tenant"
    ]
  }
}
EOF
)
  
  local response=$(jira_api_call "POST" "/issue" "$epic_payload")
  
  if [[ $? -eq 0 ]]; then
    local epic_id=$(echo "$response" | jq -r '.key // empty')
    if [[ -n "$epic_id" ]]; then
      log_success "Audit epic created: $epic_id"
      echo "$epic_id"
      return 0
    fi
  fi
  
  log_error "Failed to create audit epic"
  return 1
}

close_session_tickets() {
  local session_id=$1
  local comment="Audit session completed. Issues may have been resolved during subsequent audit runs."
  
  if ! check_jira_config; then
    return 1
  fi
  
  # Search for tickets with session label
  local search_jql="project = $JIRA_PROJECT_KEY AND labels = session-$session_id AND status != Done"
  local encoded_jql=$(echo "$search_jql" | jq -sRr @uri)
  
  local search_response=$(jira_api_call "GET" "/search?jql=$encoded_jql&fields=key")
  
  if [[ $? -eq 0 ]]; then
    local tickets=$(echo "$search_response" | jq -r '.issues[].key')
    
    for ticket_id in $tickets; do
      log_info "Closing session ticket: $ticket_id"
      update_ticket "$ticket_id" "$comment" "Done"
    done
  fi
}

# ===============================================
# REPORTING
# ===============================================
generate_jira_report() {
  local session_id=$1
  local output_file="${2:-jira-tickets-$session_id.md}"
  
  if ! check_jira_config; then
    log_error "Cannot generate Jira report: missing configuration"
    return 1
  fi
  
  log_info "Generating Jira tickets report for session: $session_id"
  
  # Search for tickets
  local search_jql="project = $JIRA_PROJECT_KEY AND labels = session-$session_id"
  local encoded_jql=$(echo "$search_jql" | jq -sRr @uri)
  
  local search_response=$(jira_api_call "GET" "/search?jql=$encoded_jql&fields=key,summary,status,priority,created")
  
  if [[ $? -eq 0 ]]; then
    cat > "$output_file" << EOF
# Jira Tickets Report
**Session ID:** $session_id  
**Generated:** $(date -Iseconds)  

## Created Tickets

| Ticket | Summary | Status | Priority | Created |
|--------|---------|--------|----------|---------|
EOF
    
    echo "$search_response" | jq -r '.issues[] | 
      "| [" + .key + "]('$JIRA_BASE_URL'/browse/" + .key + ") | " + 
      .fields.summary + " | " + 
      .fields.status.name + " | " + 
      .fields.priority.name + " | " + 
      .fields.created + " |"' >> "$output_file"
    
    echo "" >> "$output_file"
    echo "**Total Tickets:** $(echo "$search_response" | jq '.total')" >> "$output_file"
    
    log_success "Jira report generated: $output_file"
    echo "$output_file"
  else
    log_error "Failed to generate Jira report"
    return 1
  fi
}

# ===============================================
# MAIN COMMAND HANDLER
# ===============================================
main() {
  local command=${1:-"help"}
  
  case $command in
    "create_ticket")
      create_ticket "$2" "$3" "$4" "$5" "$6"
      ;;
    "update_ticket")
      update_ticket "$2" "$3" "$4"
      ;;
    "get_status")
      get_ticket_status "$2"
      ;;
    "create_epic")
      create_audit_epic "$2"
      ;;
    "close_session")
      close_session_tickets "$2"
      ;;
    "generate_report")
      generate_jira_report "$2" "$3"
      ;;
    "test_config")
      if check_jira_config; then
        echo "✅ Jira configuration is valid"
        # Test API connectivity
        local response=$(jira_api_call "GET" "/myself")
        if [[ $? -eq 0 ]]; then
          local user=$(echo "$response" | jq -r '.displayName // .name')
          echo "✅ API connection successful. Authenticated as: $user"
        else
          echo "❌ API connection failed"
          exit 1
        fi
      else
        echo "❌ Jira configuration is incomplete"
        exit 1
      fi
      ;;
    "help"|*)
      cat << EOF
TUPÁ Hub Jira Integration Utilities

USAGE:
  $0 COMMAND [ARGUMENTS]

COMMANDS:
  create_ticket SUMMARY DESCRIPTION [PRIORITY] [SESSION_ID] [ATTACHMENT]
    Create a new Jira ticket for audit issues
    
  update_ticket TICKET_ID COMMENT [STATUS]
    Add comment and optionally change status
    
  get_status TICKET_ID
    Get current status and summary of a ticket
    
  create_epic SESSION_ID
    Create an epic for tracking audit session issues
    
  close_session SESSION_ID
    Close all tickets associated with a session
    
  generate_report SESSION_ID [OUTPUT_FILE]
    Generate markdown report of session tickets
    
  test_config
    Test Jira configuration and connectivity
    
  help
    Show this help message

CONFIGURATION:
  Set these environment variables:
  - JIRA_BASE_URL (default: https://tupahub.atlassian.net)
  - JIRA_USERNAME (required)
  - JIRA_API_TOKEN (required)
  - JIRA_PROJECT_KEY (default: AUDIT)

EXAMPLES:
  $0 create_ticket "Security scan failed" "Multiple vulnerabilities found" "High" "AUDIT_20240728_143022"
  $0 update_ticket "AUDIT-123" "Issue resolved in latest run" "Done"
  $0 generate_report "AUDIT_20240728_143022"
EOF
      ;;
  esac
}

# Execute if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi