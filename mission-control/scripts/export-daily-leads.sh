#!/bin/bash
# export-daily-leads.sh
# Export leads to JSON and CSV daily
# STATUS: PENDING ERICF APPROVAL - DO NOT RUN

DATE=$(date +%Y-%m-%d)
BASE_DIR="/root/.openclaw/workspace/mission-control/data/leads"
OUTPUT_DIR="$BASE_DIR/$DATE"

# Create daily directory
mkdir -p "$OUTPUT_DIR"

# Source files
DEALFLOW_LEADS="/root/.openclaw/workspace/mission-control/agents/dealflow/leads.json"
ONHING_LEADS="/root/.openclaw/workspace/mission-control/data/onhing_metal_leads.json"

# Export DealFlow leads to JSON
echo "Exporting DealFlow leads..."
if [ -f "$DEALFLOW_LEADS" ]; then
    cp "$DEALFLOW_LEADS" "$OUTPUT_DIR/leads-dealflow.json"
    
    # Convert to CSV with headers
    echo "id,date_added,company,country,industry,company_size,contact_name,title,email,phone,linkedin,website,products,materials_needed,volume,priority,status,source,notes,assigned_to,contact_date" > "$OUTPUT_DIR/leads-dealflow.csv"
    
    jq -r '.[] | [
        .id,
        .date_added,
        .company,
        .country,
        .industry,
        .company_size,
        .contact_name,
        .title,
        .email,
        .phone,
        .linkedin,
        .website,
        .products,
        .materials_needed,
        .volume,
        .priority,
        .status,
        .source,
        .notes,
        .assigned_to,
        .contact_date
    ] | @csv' "$DEALFLOW_LEADS" >> "$OUTPUT_DIR/leads-dealflow.csv"
    
    echo "✓ DealFlow leads exported"
else
    echo "✗ DealFlow leads not found"
fi

# Export On Hing Metal leads to JSON
echo "Exporting On Hing Metal leads..."
if [ -f "$ONHING_LEADS" ]; then
    cp "$ONHING_LEADS" "$OUTPUT_DIR/leads-onhing.json"
    
    # Convert to CSV with headers
    echo "id,date_added,company,country,city,industry,company_size,contact_name,title,email,phone,linkedin,website,products,materials_needed,volume,china_friendly,notes,priority,status,source" > "$OUTPUT_DIR/leads-onhing.csv"
    
    jq -r '.[] | [
        .id,
        .date_added,
        .company,
        .country,
        .city,
        .industry,
        .company_size,
        .contact_name,
        .title,
        .email,
        .phone,
        .linkedin,
        .website,
        .products,
        .materials_needed,
        .volume,
        .china_friendly,
        .notes,
        .priority,
        .status,
        .source
    ] | @csv' "$ONHING_LEADS" >> "$OUTPUT_DIR/leads-onhing.csv"
    
    echo "✓ On Hing Metal leads exported"
else
    echo "✗ On Hing Metal leads not found"
fi

# Create combined master file
echo "Creating combined master file..."
jq -s 'add' "$OUTPUT_DIR/leads-dealflow.json" "$OUTPUT_DIR/leads-onhing.json" > "$OUTPUT_DIR/leads-all.json" 2>/dev/null || \
    cp "$OUTPUT_DIR/leads-dealflow.json" "$OUTPUT_DIR/leads-all.json"

echo "✓ Combined master file created"

# Create summary
echo ""
echo "=== EXPORT SUMMARY ==="
echo "Date: $DATE"
echo "DealFlow leads: $(jq 'length' $OUTPUT_DIR/leads-dealflow.json 2>/dev/null || echo '0')"
echo "On Hing leads: $(jq 'length' $OUTPUT_DIR/leads-onhing.json 2>/dev/null || echo '0')"
echo "Total leads: $(jq 'length' $OUTPUT_DIR/leads-all.json 2>/dev/null || echo '0')"
echo ""
echo "Files created:"
ls -la "$OUTPUT_DIR/"

echo ""
echo "✅ Daily export complete!"
