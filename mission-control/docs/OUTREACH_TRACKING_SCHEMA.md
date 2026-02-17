# Outreach Tracking Schema Documentation

## Overview

This document defines the tracking schema for the ColdCall Outreach Performance system. It specifies how email outreach data should be logged, stored, and analyzed to optimize cold outreach campaigns.

## Data Storage

**Primary Data File:** `/mission-control/data/outreach-metrics.json`

This file contains aggregated analytics data and serves as the data source for the Outreach Analytics Dashboard.

## Tracking Schema

### Individual Email Log Schema

Each email sent through the ColdCall system should generate a log entry with the following fields:

```json
{
  "emailId": "uuid-string",
  "timestamp": "2026-02-18T10:30:00Z",
  "templateId": "initial-cold-outreach",
  "recipientEmail": "john.doe@example.com",
  "recipientName": "John Doe",
  "companyId": "company-uuid",
  "companyName": "Acme Corp",
  "industry": "DeFi Protocols",
  "region": "North America",
  "companySize": "50-200",
  "seniority": "VP",
  "status": "meeting_booked",
  "sentAt": "2026-02-18T10:30:00Z",
  "deliveredAt": "2026-02-18T10:30:05Z",
  "openedAt": "2026-02-18T14:45:00Z",
  "clickedAt": "2026-02-18T14:47:00Z",
  "repliedAt": "2026-02-19T09:15:00Z",
  "meetingBookedAt": "2026-02-19T11:00:00Z",
  "bounceReason": null,
  "unsubscribed": false,
  "subjectLine": "Partnership opportunity: Philippines' $107B crypto market",
  "personalizationScore": 8.5,
  "followUpSequence": 1,
  "source": "deal-flow",
  "notes": "Positive response, meeting scheduled for next week"
}
```

### Field Definitions

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `emailId` | UUID | Unique identifier for this email |
| `timestamp` | ISO 8601 | When the email was sent |
| `templateId` | String | Which template was used (see Template IDs) |
| `recipientEmail` | String | Recipient's email address |
| `companyId` | UUID | Reference to the company/lead record |
| `status` | Enum | Current status of the email |

#### Status Values

- `sent` - Email has been sent
- `delivered` - Email was successfully delivered
- `opened` - Recipient opened the email
- `clicked` - Recipient clicked a link
- `replied` - Recipient replied to the email
- `bounced` - Email bounced (see `bounceReason`)
- `unsubscribed` - Recipient unsubscribed
- `meeting_booked` - Meeting was booked as a result

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `recipientName` | String | Recipient's full name |
| `companyName` | String | Company name |
| `industry` | String | Target industry category |
| `region` | String | Geographic region |
| `companySize` | String | Employee count range |
| `seniority` | String | Job seniority level |
| `deliveredAt` | ISO 8601 | Delivery timestamp |
| `openedAt` | ISO 8601 | First open timestamp |
| `clickedAt` | ISO 8601 | Link click timestamp |
| `repliedAt` | ISO 8601 | Reply received timestamp |
| `meetingBookedAt` | ISO 8601 | Meeting booking timestamp |
| `bounceReason` | String | Reason for bounce (if applicable) |
| `unsubscribed` | Boolean | Whether recipient unsubscribed |
| `subjectLine` | String | Actual subject line used |
| `personalizationScore` | Number | 0-10 score of personalization quality |
| `followUpSequence` | Number | Position in follow-up sequence (1-5) |
| `source` | String | Lead source (deal-flow, manual, etc.) |
| `notes` | String | Additional notes |

### Template IDs

The following template IDs are used in the tracking system:

| Template ID | Name | Sequence Position |
|-------------|------|-------------------|
| `initial-cold-outreach` | Initial Cold Outreach | 1 |
| `followup-1` | Follow-up #1 (No Response) | 2 |
| `followup-2` | Follow-up #2 (Still No Response) | 3 |
| `value-add-followup` | Value-Add Follow-up | 4 |
| `breakup-email` | Breakup Email (Final Attempt) | 5 |

### Industry Categories

- `Exchanges`
- `DeFi Protocols`
- `GameFi/NFT`
- `Payment Processors`
- `Infrastructure`
- `Wallets`
- `Lending/Borrowing`
- `DAO`
- `Other`

### Regions

- `North America`
- `Europe`
- `Asia Pacific`
- `Latin America`
- `Middle East/Africa`

### Company Size Ranges

- `1-10`
- `11-50`
- `50-200`
- `200-1000`
- `1000+`

### Seniority Levels

- `C-Level` (CEO, CTO, CMO, etc.)
- `VP` (Vice President)
- `Director`
- `Manager`
- `Individual Contributor`

## Aggregated Metrics Structure

The `outreach-metrics.json` file contains pre-aggregated data for dashboard display:

### Summary Object

```json
{
  "summary": {
    "totalEmailsSent": 2847,
    "totalDelivered": 2712,
    "totalOpened": 1189,
    "totalClicked": 342,
    "totalReplied": 186,
    "totalMeetingsBooked": 47,
    "overallOpenRate": 43.8,
    "overallReplyRate": 6.9,
    "overallMeetingRate": 1.7,
    "period": "Last 30 Days"
  }
}
```

### Template Performance Object

```json
{
  "byTemplate": {
    "template-id": {
      "templateName": "Human-readable name",
      "emailsSent": 100,
      "delivered": 95,
      "opened": 45,
      "clicked": 15,
      "replied": 8,
      "meetingsBooked": 2,
      "openRate": 47.4,
      "replyRate": 8.4,
      "meetingRate": 2.1,
      "avgTimeToOpen": "4.2 hours",
      "avgTimeToReply": "1.8 days"
    }
  }
}
```

### Industry/Region Breakdown

```json
{
  "byIndustry": {
    "Industry Name": {
      "emailsSent": 100,
      "opened": 50,
      "replied": 10,
      "meetingsBooked": 2,
      "openRate": 50.0,
      "replyRate": 10.0,
      "meetingRate": 2.0
    }
  }
}
```

### Timing Analytics

```json
{
  "bySendTime": {
    "bestHours": [
      { "hour": 9, "openRate": 52.3, "replyRate": 8.7 },
      { "hour": 10, "openRate": 54.1, "replyRate": 9.2 }
    ],
    "worstHours": [
      { "hour": 6, "openRate": 18.2, "replyRate": 1.2 }
    ]
  },
  "byDayOfWeek": {
    "Monday": { "openRate": 42.1, "replyRate": 6.2, "meetingRate": 1.4 },
    "Tuesday": { "openRate": 48.5, "replyRate": 7.8, "meetingRate": 2.1 }
  }
}
```

### Funnel Data

```json
{
  "funnel": {
    "stages": [
      { "stage": "Emails Sent", "count": 2847, "percentage": 100.0 },
      { "stage": "Delivered", "count": 2712, "percentage": 95.3 },
      { "stage": "Opened", "count": 1189, "percentage": 43.8 },
      { "stage": "Clicked", "count": 342, "percentage": 12.6 },
      { "stage": "Replied", "count": 186, "percentage": 6.9 },
      { "stage": "Meeting Booked", "count": 47, "percentage": 1.7 }
    ]
  }
}
```

### Recommendations

```json
{
  "recommendations": [
    {
      "id": "rec-001",
      "priority": "high",
      "category": "template",
      "title": "Recommendation title",
      "description": "Detailed description of the insight",
      "action": "Specific action to take",
      "impact": "Expected impact (e.g., +35% meeting rate)"
    }
  ]
}
```

## Integration with ColdCall Agent

### Logging Requirements

The ColdCall agent should log each email event to:

1. **Individual Log File:** `/mission-control/logs/outreach-emails.jsonl`
   - Append-only JSON Lines format
   - One line per email event

2. **Aggregated Metrics:** `/mission-control/data/outreach-metrics.json`
   - Updated periodically (e.g., daily)
   - Pre-calculated for dashboard performance

### Log File Format

```jsonl
{"emailId": "uuid-1", "timestamp": "2026-02-18T10:30:00Z", "templateId": "initial-cold-outreach", ...}
{"emailId": "uuid-2", "timestamp": "2026-02-18T10:35:00Z", "templateId": "initial-cold-outreach", ...}
```

### Webhook/Event Integration

For real-time tracking, implement webhooks for:

- Email delivery confirmation
- Open tracking pixel
- Link click tracking
- Reply detection (via email parsing)
- Calendar integration for meeting bookings

### Sample ColdCall Integration Code

```python
import json
import uuid
from datetime import datetime

class OutreachTracker:
    def __init__(self):
        self.log_file = "/mission-control/logs/outreach-emails.jsonl"
        self.metrics_file = "/mission-control/data/outreach-metrics.json"
    
    def log_email_sent(self, template_id, recipient, company, **kwargs):
        """Log when an email is sent"""
        log_entry = {
            "emailId": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "templateId": template_id,
            "recipientEmail": recipient["email"],
            "recipientName": recipient.get("name"),
            "companyId": company["id"],
            "companyName": company["name"],
            "industry": company.get("industry"),
            "region": company.get("region"),
            "status": "sent",
            **kwargs
        }
        
        with open(self.log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
        
        return log_entry["emailId"]
    
    def update_status(self, email_id, status, **kwargs):
        """Update email status (opened, clicked, replied, etc.)"""
        # Implementation depends on storage backend
        pass
    
    def aggregate_metrics(self):
        """Recalculate aggregated metrics from log file"""
        # Read all logs and calculate aggregates
        # Update outreach-metrics.json
        pass
```

## Dashboard Integration

The Outreach Analytics Dashboard (`/mission-control/dashboard/outreach-analytics.html`) reads from `outreach-metrics.json` and displays:

1. **Overview:** KPI cards with summary metrics
2. **Templates:** Performance comparison across templates
3. **Industries:** Response rates by target industry
4. **Timing:** Best send times and day-of-week analysis
5. **Funnel:** Conversion funnel visualization
6. **Recommendations:** AI-generated optimization suggestions

## Data Retention

- **Individual Logs:** Keep for 12 months, then archive
- **Aggregated Metrics:** Keep indefinitely for trend analysis
- **Dashboard Data:** Refreshed daily from aggregated metrics

## Privacy & Compliance

- Store only necessary data for analytics
- Hash email addresses in logs if not needed for follow-up
- Respect unsubscribe requests immediately
- Comply with CAN-SPAM, GDPR, and other regulations
- Include unsubscribe links in all emails

## Future Enhancements

1. **A/B Testing:** Track subject line and content variants
2. **Sentiment Analysis:** Analyze reply sentiment (positive/negative)
3. **Predictive Scoring:** ML model to predict likelihood of reply
4. **Multi-touch Attribution:** Track multiple touchpoints before meeting
5. **Integration:** Connect with CRM (HubSpot, Salesforce) for full pipeline tracking
