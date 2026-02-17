#!/bin/bash
# Mission Control Office Simulator
# Simulates agent interactions in the office environment

function office_scene() {
    local scene="$1"
    
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║           🏢 MISSION CONTROL HQ - OPEN OFFICE                   ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
    
    case "$scene" in
        delegation)
            echo "📍 SCENE: Command Center (You + Air1ck3ff)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "👤 EricF: \"I need a Twitter thread on AI trends by tomorrow.\""
            echo ""
            echo "◈ Air1ck3ff: \"Team, you heard the Commander.\""
            echo "            \"Glasses, get me the latest AI intel.\""
            echo "            \"Quill, prepare a thread.\""
            echo "            \"Gary, what's the angle?\""
            echo ""
            echo "🔍 Glasses: *typing furiously* \"Already on it. Pulling from 12 sources...\""
            echo ""
            echo "✍️ Quill: *sips coffee* \"Give me 20 minutes with Glasses' research.\""
            echo "          \"I'll make it punchy.\""
            echo ""
            echo "📢 Gary: *points at whiteboard* \"Angle it toward productivity gains.\""
            echo "         \"That's what's converting right now.\""
            echo ""
            echo "◈ Air1ck3ff: \"Larry, queue it for 9 AM tomorrow. Peak engagement.\""
            echo ""
            echo "📲 Larry: *on phone* \"Scheduled. I'll monitor the metrics.\""
            echo ""
            ;;
            
        collaboration)
            echo "📍 SCENE: Content Corner (Quill + Pixel)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "✍️ Quill: \"Pixel, I need a visual for this hook.\""
            echo "          \"Something that stops the scroll.\""
            echo ""
            echo "🎨 Pixel: *sketching on tablet* \"Working on three concepts...\""
            echo "          *shows screen*"
            echo "          \"This one uses contrast...\""
            echo "          \"This one uses curiosity gap...\""
            echo "          \"This one uses pattern interrupt.\""
            echo ""
            echo "✍️ Quill: \"Pattern interrupt. That's the one.\""
            echo "          \"Can you have it in an hour?\""
            echo ""
            echo "🎨 Pixel: *already drawing* \"45 minutes.\""
            echo ""
            ;;
            
        status)
            echo "📍 SCENE: Operations Center (Sentry + Audit + Cipher)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "⚙️ Sentry: *checking monitors* \"All systems green.\""
            echo "           \"CPU at 12%, memory healthy.\""
            echo "           \"No anomalies detected.\""
            echo ""
            echo "✅ Audit: *reviewing checklist* \"Quality checks complete.\""
            echo "         \"No issues flagged in today's outputs.\""
            echo ""
            echo "🔒 Cipher: *scanning security feeds* \"Perimeter secure.\""
            echo "          \"Zero unauthorized access attempts.\""
            echo "          \"Encryption protocols active.\""
            echo ""
            echo "◈ Air1ck3ff: \"EricF, your army is operational and standing by.\""
            echo ""
            ;;
            
        briefing)
            echo "📍 SCENE: Morning Briefing (All Hands)"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "◈ Air1ck3ff: \"Morning team. Glasses, what's the intel?\""
            echo ""
            echo "🔍 Glasses: *adjusts glasses* \"Crypto markets consolidating.\""
            echo "          \"BTC holding at 67K. ETH facing some pressure.\""
            echo "          \"Big news: OpenAI hired the OpenClaw founder.\""
            echo ""
            echo "📢 Gary: \"That's our angle for today. AI talent war is heating up.\""
            echo ""
            echo "✍️ Quill: \"I can spin that into a thread. 5 tweets?\""
            echo ""
            echo "📲 Larry: \"Post it at 2 PM. That's when engagement peaks.\""
            echo ""
            echo "👤 EricF: \"Make it happen. Air1ck3ff, coordinate.\""
            echo ""
            echo "◈ Air1ck3ff: \"Team, you have your orders. Execute.\""
            echo ""
            ;;
            
        *)
            echo "Available scenes: delegation, collaboration, status, briefing"
            ;;
    esac
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Main
case "${1:-briefing}" in
    delegation|collaboration|status|briefing)
        office_scene "$1"
        ;;
    *)
        echo "Usage: ./office-simulator.sh [delegation|collaboration|status|briefing]"
        exit 1
        ;;
esac
