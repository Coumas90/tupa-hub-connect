#!/bin/bash
# Documentation Completeness Phase - TUPÁ Hub Audit
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOG_FILE="$PROJECT_ROOT/audit-logs/DOCS_COMPLETENESS.log"

# Create audit-logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Redirect all output to log file
exec > >(tee -a "$LOG_FILE") 2>&1

echo "📚 Starting Documentation Completeness Phase - $(date)"
echo "===================================================="

# Configuration
declare -A REQUIRED_DOCS=(
    ["MULTI_TENANT_MIGRATION.md"]="docs/MULTI_TENANT_MIGRATION.md"
    ["TENANT_ISOLATION_GUIDE.pdf"]="docs/TENANT_ISOLATION_GUIDE.pdf"
    ["ER_DIAGRAM.puml"]="docs/ER_DIAGRAM.puml"
    ["API_CONTRACTS.yaml"]="docs/API_CONTRACTS.yaml"
    ["SECURITY_INCIDENT_RESPONSE.md"]="docs/SECURITY_INCIDENT_RESPONSE.md"
)

DOCS_PER_SCORE=20  # 20% per document
TOTAL_DOCS=${#REQUIRED_DOCS[@]}
MISSING_DOCS=()
EXISTING_DOCS=()
DOCS_SCORE=0

echo "📋 Required documentation analysis:"
echo "Total required documents: $TOTAL_DOCS"
echo "Scoring: $DOCS_PER_SCORE% per document (max 100%)"

# Phase 1: Check documentation structure
echo ""
echo "📁 Phase 1: Verifying documentation structure..."

# Ensure docs directory exists
if [[ ! -d "$PROJECT_ROOT/docs" ]]; then
    echo "⚠️  Documentation directory not found: creating docs/"
    mkdir -p "$PROJECT_ROOT/docs"
else
    echo "✅ Documentation directory exists"
fi

# Count total documentation files
TOTAL_DOC_FILES=$(find "$PROJECT_ROOT/docs" -type f \( -name "*.md" -o -name "*.pdf" -o -name "*.yaml" -o -name "*.yml" -o -name "*.puml" \) 2>/dev/null | wc -l)
echo "📄 Total documentation files in docs/: $TOTAL_DOC_FILES"

# Phase 2: Check for required documents
echo ""
echo "🔍 Phase 2: Checking for required documents..."

for doc_name in "${!REQUIRED_DOCS[@]}"; do
    doc_path="${REQUIRED_DOCS[$doc_name]}"
    full_path="$PROJECT_ROOT/$doc_path"
    
    echo ""
    echo "Checking: $doc_name"
    echo "  Expected path: $doc_path"
    
    if [[ -f "$full_path" ]]; then
        echo "  ✅ FOUND"
        EXISTING_DOCS+=("$doc_name")
        DOCS_SCORE=$((DOCS_SCORE + DOCS_PER_SCORE))
        
        # Additional validation for the document
        file_size=$(stat -f%z "$full_path" 2>/dev/null || stat -c%s "$full_path" 2>/dev/null || echo "0")
        if [[ $file_size -gt 100 ]]; then
            echo "  📏 Size: ${file_size} bytes (substantial content)"
        else
            echo "  ⚠️  Size: ${file_size} bytes (may be a placeholder)"
            DOCS_SCORE=$((DOCS_SCORE - 5))  # Penalty for placeholder docs
        fi
        
        # Check last modification
        if command -v stat &> /dev/null; then
            last_modified=$(stat -f%Sm "$full_path" 2>/dev/null || stat -c%y "$full_path" 2>/dev/null || echo "unknown")
            echo "  🕒 Last modified: $last_modified"
        fi
        
    else
        echo "  ❌ MISSING"
        MISSING_DOCS+=("$doc_name")
        
        # Check if document exists in alternative locations
        alt_locations=$(find "$PROJECT_ROOT" -name "$doc_name" -type f 2>/dev/null | head -5)
        if [[ -n "$alt_locations" ]]; then
            echo "  📍 Found in alternative locations:"
            echo "$alt_locations" | sed 's/^/    /'
        fi
    fi
done

# Phase 3: Document quality assessment
echo ""
echo "📊 Phase 3: Document quality assessment..."

QUALITY_ISSUES=0

for doc_name in "${EXISTING_DOCS[@]}"; do
    doc_path="${REQUIRED_DOCS[$doc_name]}"
    full_path="$PROJECT_ROOT/$doc_path"
    
    echo ""
    echo "Analyzing quality: $doc_name"
    
    case "$doc_name" in
        "MULTI_TENANT_MIGRATION.md")
            # Check for key sections in migration doc
            if grep -q "## Migration Steps\|# Migration Process\|## Database Changes" "$full_path" 2>/dev/null; then
                echo "  ✅ Contains migration process sections"
            else
                echo "  ⚠️  Missing migration process details"
                QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
            fi
            ;;
            
        "API_CONTRACTS.yaml")
            # Validate YAML syntax
            if command -v python3 &> /dev/null; then
                if python3 -c "import yaml; yaml.safe_load(open('$full_path'))" 2>/dev/null; then
                    echo "  ✅ Valid YAML syntax"
                else
                    echo "  ❌ Invalid YAML syntax"
                    QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
                fi
            elif command -v yq &> /dev/null; then
                if yq eval . "$full_path" >/dev/null 2>&1; then
                    echo "  ✅ Valid YAML syntax"
                else
                    echo "  ❌ Invalid YAML syntax"
                    QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
                fi
            else
                echo "  ⚠️  Cannot validate YAML syntax (no parser available)"
            fi
            ;;
            
        "ER_DIAGRAM.puml")
            # Check PlantUML syntax basics
            if grep -q "@startuml\|@enduml" "$full_path" 2>/dev/null; then
                echo "  ✅ Contains PlantUML syntax"
            else
                echo "  ⚠️  Missing PlantUML syntax markers"
                QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
            fi
            ;;
            
        "SECURITY_INCIDENT_RESPONSE.md")
            # Check for incident response sections
            if grep -q "## Incident Classification\|## Response Team\|## Escalation" "$full_path" 2>/dev/null; then
                echo "  ✅ Contains incident response structure"
            else
                echo "  ⚠️  Missing incident response structure"
                QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
            fi
            ;;
            
        "TENANT_ISOLATION_GUIDE.pdf")
            # Basic PDF validation
            if file "$full_path" | grep -q "PDF"; then
                echo "  ✅ Valid PDF format"
            else
                echo "  ❌ Not a valid PDF file"
                QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
            fi
            ;;
    esac
    
    # Check for placeholder content
    if grep -qi "TODO\|PLACEHOLDER\|TBD\|FIXME" "$full_path" 2>/dev/null; then
        placeholder_count=$(grep -ci "TODO\|PLACEHOLDER\|TBD\|FIXME" "$full_path" 2>/dev/null || echo "0")
        echo "  ⚠️  Contains $placeholder_count placeholder(s)"
        QUALITY_ISSUES=$((QUALITY_ISSUES + 1))
    fi
done

# Phase 4: Additional documentation assessment
echo ""
echo "📖 Phase 4: Additional documentation assessment..."

BONUS_DOCS=()
BONUS_SCORE=0

# Check for additional valuable documentation
ADDITIONAL_DOCS=(
    "README.md:Root README file"
    "docs/ARCHITECTURE.md:Architecture documentation"
    "docs/DEPLOYMENT.md:Deployment guide"
    "docs/CONTRIBUTING.md:Contribution guidelines"
    "docs/CHANGELOG.md:Change log"
    "docs/TESTING.md:Testing documentation"
    ".github/PULL_REQUEST_TEMPLATE.md:PR template"
    ".github/ISSUE_TEMPLATE.md:Issue template"
)

for doc_entry in "${ADDITIONAL_DOCS[@]}"; do
    IFS=':' read -r doc_path doc_desc <<< "$doc_entry"
    full_path="$PROJECT_ROOT/$doc_path"
    
    if [[ -f "$full_path" ]]; then
        echo "  ✅ Found: $doc_desc"
        BONUS_DOCS+=("$doc_path")
        BONUS_SCORE=$((BONUS_SCORE + 5))  # 5% bonus per additional doc
    fi
done

# Phase 5: Documentation links and references
echo ""
echo "🔗 Phase 5: Checking documentation cross-references..."

BROKEN_LINKS=0

for doc_name in "${EXISTING_DOCS[@]}"; do
    doc_path="${REQUIRED_DOCS[$doc_name]}"
    full_path="$PROJECT_ROOT/$doc_path"
    
    # Check for internal links in markdown files
    if [[ "$doc_name" == *.md ]]; then
        # Find markdown links
        link_count=$(grep -o '\[.*\](.*\.md)' "$full_path" 2>/dev/null | wc -l || echo "0")
        if [[ $link_count -gt 0 ]]; then
            echo "  🔗 $doc_name contains $link_count internal links"
            
            # Check if linked files exist (basic check)
            while IFS= read -r link; do
                if [[ -n "$link" ]]; then
                    linked_file=$(echo "$link" | sed 's/.*](\(.*\))/\1/')
                    if [[ ! -f "$PROJECT_ROOT/docs/$linked_file" ]] && [[ ! -f "$PROJECT_ROOT/$linked_file" ]]; then
                        echo "    ⚠️  Broken link: $linked_file"
                        BROKEN_LINKS=$((BROKEN_LINKS + 1))
                    fi
                fi
            done < <(grep -o '\[.*\](.*\.md)' "$full_path" 2>/dev/null || true)
        fi
    fi
done

# Phase 6: Calculate final score and generate summary
echo ""
echo "📊 Phase 6: Documentation completeness summary..."

# Apply quality penalties
QUALITY_PENALTY=$((QUALITY_ISSUES * 5))
LINK_PENALTY=$((BROKEN_LINKS * 2))

FINAL_SCORE=$((DOCS_SCORE + BONUS_SCORE - QUALITY_PENALTY - LINK_PENALTY))

# Ensure score doesn't go below 0 or above 100
if [[ $FINAL_SCORE -lt 0 ]]; then
    FINAL_SCORE=0
elif [[ $FINAL_SCORE -gt 100 ]]; then
    FINAL_SCORE=100
fi

echo ""
echo "📋 Documentation Completeness Report:"
echo "====================================="
echo "Required documents found: ${#EXISTING_DOCS[@]}/$TOTAL_DOCS"
echo "Missing documents: ${#MISSING_DOCS[@]}"
echo "Base score: $DOCS_SCORE%"
echo "Bonus score: +$BONUS_SCORE%"
echo "Quality issues: -$QUALITY_PENALTY% ($QUALITY_ISSUES issues)"
echo "Broken links: -$LINK_PENALTY% ($BROKEN_LINKS links)"
echo "FINAL SCORE: $FINAL_SCORE%"

echo ""
echo "📄 Document Status:"
echo "==================="

for doc_name in "${!REQUIRED_DOCS[@]}"; do
    if [[ " ${EXISTING_DOCS[*]} " =~ " $doc_name " ]]; then
        echo "  ✅ $doc_name"
    else
        echo "  ❌ $doc_name"
    fi
done

if [[ ${#MISSING_DOCS[@]} -gt 0 ]]; then
    echo ""
    echo "📝 Missing Documents:"
    echo "===================="
    for doc in "${MISSING_DOCS[@]}"; do
        echo "  • $doc"
    done
fi

if [[ ${#BONUS_DOCS[@]} -gt 0 ]]; then
    echo ""
    echo "🌟 Bonus Documentation Found:"
    echo "============================="
    for doc in "${BONUS_DOCS[@]}"; do
        echo "  • $doc"
    done
fi

# Determine phase success based on score
PHASE_SUCCESS=true
MINIMUM_SCORE=60  # 60% minimum to pass

if [[ $FINAL_SCORE -lt $MINIMUM_SCORE ]]; then
    echo ""
    echo "❌ Documentation Completeness Phase: FAILED"
    echo "Score $FINAL_SCORE% is below minimum threshold of $MINIMUM_SCORE%"
    echo ""
    echo "Critical issues:"
    [[ ${#MISSING_DOCS[@]} -gt 2 ]] && echo "  - Too many missing documents (${#MISSING_DOCS[@]}/$TOTAL_DOCS)"
    [[ $QUALITY_ISSUES -gt 3 ]] && echo "  - Too many quality issues ($QUALITY_ISSUES)"
    [[ $BROKEN_LINKS -gt 5 ]] && echo "  - Too many broken links ($BROKEN_LINKS)"
    PHASE_SUCCESS=false
else
    echo ""
    echo "✅ Documentation Completeness Phase: PASSED"
    echo "Score: $FINAL_SCORE%"
    
    if [[ $FINAL_SCORE -lt 80 ]]; then
        echo ""
        echo "⚠️  Recommendations for improvement:"
        [[ ${#MISSING_DOCS[@]} -gt 0 ]] && echo "  - Generate missing documents: ${MISSING_DOCS[*]}"
        [[ $QUALITY_ISSUES -gt 0 ]] && echo "  - Address $QUALITY_ISSUES quality issues"
        [[ $BROKEN_LINKS -gt 0 ]] && echo "  - Fix $BROKEN_LINKS broken links"
    fi
fi

echo ""
echo "📚 Documentation Completeness Phase completed - $(date)"
echo "Log file: $LOG_FILE"

# Exit with appropriate code
if [ "$PHASE_SUCCESS" = true ]; then
    exit 0
else
    exit 1
fi