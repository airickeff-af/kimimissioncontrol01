#!/bin/bash
# Dynamic Office Position Updater
# Updates agent positions every hour based on schedule

HOUR=$(date +%H)
STATE_FILE="/root/.openclaw/workspace/mission-control/current_office_state.json"
LOG_FILE="/root/.openclaw/workspace/mission-control/logs/office_positions.log"

# Ensure log directory exists
mkdir -p $(dirname $LOG_FILE)

# Determine current state based on hour
case $HOUR in
    06|07)
        STATE="morning_briefing"
        ZONE="conference"
        DESCRIPTION="Daily briefing - All agents gathered"
        ;;
    09|10)
        STATE="deep_work_morning"
        ZONE="individual"
        DESCRIPTION="Deep work - Agents at individual desks"
        ;;
    11)
        STATE="collaboration_content"
        ZONE="content_corner"
        DESCRIPTION="Content collaboration - Glasses→Quill→Pixel"
        ;;
    12)
        STATE="lunch_break"
        ZONE="break_area"
        DESCRIPTION="Lunch break - Mixed groups"
        ;;
    13|14)
        STATE="deep_work_afternoon"
        ZONE="individual"
        DESCRIPTION="Afternoon deep work"
        ;;
    15)
        STATE="marketing_planning"
        ZONE="marketing_bay"
        DESCRIPTION="Marketing campaign planning"
        ;;
    16)
        STATE="review_qa"
        ZONE="qa_station"
        DESCRIPTION="Review and QA session"
        ;;
    17)
        STATE="strategy_planning"
        ZONE="command"
        DESCRIPTION="Strategic planning - EricF + Air1ck3ff"
        ;;
    18)
        STATE="wrap_up"
        ZONE="individual"
        DESCRIPTION="End of day wrap-up"
        ;;
    19|20)
        STATE="wind_down"
        ZONE="break_area"
        DESCRIPTION="Wind down - Casual conversations"
        ;;
    21|22|23|00|01|02|03|04|05)
        STATE="night_ops"
        ZONE="ops_center"
        DESCRIPTION="Night operations - Sentry/Cipher monitoring"
        ;;
    *)
        STATE="default"
        ZONE="individual"
        DESCRIPTION="Default positions"
        ;;
esac

# Create state JSON
cat > $STATE_FILE << EOF
{
    "timestamp": "$(date -Iseconds)",
    "hour": $HOUR,
    "state": "$STATE",
    "zone": "$ZONE",
    "description": "$DESCRIPTION",
    "positions": {
        "air1ck3ff": $(case $ZONE in
            conference|command|break_area) echo '"conference"' ;;
            *) echo '"command_center"' ;;
        esac),
        "glasses": $(case $STATE in
            morning_briefing) echo '"conference"' ;;
            collaboration_content) echo '"content_corner"' ;;
            deep_work*) echo '"content_desk"' ;;
            lunch_break|wind_down) echo '"break_area"' ;;
            *) echo '"content_desk"' ;;
        esac),
        "quill": $(case $STATE in
            morning_briefing) echo '"conference"' ;;
            collaboration_content) echo '"content_corner"' ;;
            deep_work*) echo '"content_desk"' ;;
            lunch_break|wind_down) echo '"break_area"' ;;
            *) echo '"content_desk"' ;;
        esac),
        "pixel": $(case $STATE in
            morning_briefing) echo '"conference"' ;;
            collaboration_content) echo '"content_corner"' ;;
            deep_work*) echo '"content_desk"' ;;
            lunch_break|wind_down) echo '"break_area"' ;;
            *) echo '"content_desk"' ;;
        esac),
        "gary": $(case $STATE in
            morning_briefing) echo '"conference"' ;;
            marketing_planning) echo '"marketing_bay"' ;;
            deep_work*) echo '"marketing_desk"' ;;
            lunch_break|wind_down) echo '"break_area"' ;;
            *) echo '"marketing_desk"' ;;
        esac),
        "larry": $(case $STATE in
            morning_briefing) echo '"conference"' ;;
            marketing_planning) echo '"marketing_bay"' ;;
            deep_work*) echo '"marketing_desk"' ;;
            lunch_break|wind_down) echo '"break_area"' ;;
            *) echo '"marketing_desk"' ;;
        esac),
        "sentry": $(case $STATE in
            morning_briefing) echo '"conference"' ;;
            night_ops) echo '"ops_center"' ;;
            *) echo '"ops_center"' ;;
        esac),
        "audit": $(case $STATE in
            morning_briefing) echo '"conference"' ;;
            review_qa) echo '"qa_station"' ;;
            deep_work*) echo '"qa_station"' ;;
            *) echo '"qa_station"' ;;
        esac),
        "cipher": $(case $STATE in
            morning_briefing) echo '"conference"' ;;
            night_ops) echo '"ops_center"' ;;
            *) echo '"ops_center"' ;;
        esac)
    }
}
EOF

# Log the update
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Position update: $STATE in $ZONE - $DESCRIPTION" >> $LOG_FILE

# Output for debugging
echo "Office state updated: $STATE"
echo "Zone: $ZONE"
echo "Description: $DESCRIPTION"
