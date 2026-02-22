/**
 * Send Scheduler Module
 * 
 * Determines optimal send times for outreach emails based on:
 * - Historical performance data
 * - Recipient timezone
 * - Day of week patterns
 * - Hour of day patterns
 * 
 * @module SendScheduler
 * @version 1.0.0
 */

class SendScheduler {
  constructor() {
    // Best performing days (from analytics)
    this.dayPerformance = {
      'Monday': { openRate: 42.1, replyRate: 6.2, score: 70 },
      'Tuesday': { openRate: 48.5, replyRate: 7.8, score: 85 },
      'Wednesday': { openRate: 51.2, replyRate: 8.4, score: 95 },
      'Thursday': { openRate: 47.8, replyRate: 7.1, score: 80 },
      'Friday': { openRate: 38.6, replyRate: 5.2, score: 60 },
      'Saturday': { openRate: 15.2, replyRate: 1.8, score: 20 },
      'Sunday': { openRate: 18.4, replyRate: 2.1, score: 25 }
    };
    
    // Best performing hours (from analytics)
    this.hourPerformance = {
      6: { openRate: 18.2, score: 25 },
      7: { openRate: 22.4, score: 30 },
      8: { openRate: 35.6, score: 55 },
      9: { openRate: 52.3, score: 90 },
      10: { openRate: 54.1, score: 100 },
      11: { openRate: 51.8, score: 95 },
      12: { openRate: 42.3, score: 70 },
      13: { openRate: 38.9, score: 65 },
      14: { openRate: 48.6, score: 85 },
      15: { openRate: 46.2, score: 80 },
      16: { openRate: 41.2, score: 70 },
      17: { openRate: 35.8, score: 55 },
      18: { openRate: 28.6, score: 45 },
      19: { openRate: 24.3, score: 35 },
      20: { openRate: 19.8, score: 30 }
    };
    
    // Timezone mapping for common regions
    this.timezones = {
      'Philippines': 'Asia/Manila',
      'Singapore': 'Asia/Singapore',
      'Hong Kong': 'Asia/Hong_Kong',
      'Japan': 'Asia/Tokyo',
      'Australia': 'Australia/Sydney',
      'UK': 'Europe/London',
      'Germany': 'Europe/Berlin',
      'France': 'Europe/Paris',
      'US-East': 'America/New_York',
      'US-West': 'America/Los_Angeles',
      'Brazil': 'America/Sao_Paulo',
      'Nigeria': 'Africa/Lagos'
    };
  }

  /**
   * Calculate optimal send time for a lead
   * @param {Object} lead - Lead object with region/timezone info
   * @param {Object} options - Scheduling options
   * @returns {Object} Optimal send time recommendation
   */
  calculateOptimalTime(lead, options = {}) {
    const {
      startDate = new Date(),
      maxDays = 14,
      preferredDays = ['Tuesday', 'Wednesday', 'Thursday'],
      preferredHours = [9, 10, 11, 14, 15],
      respectBusinessHours = true
    } = options;
    
    // Determine timezone
    const timezone = this.getTimezone(lead);
    
    // Generate candidate times
    const candidates = [];
    const currentDate = new Date(startDate);
    
    for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
      const candidateDate = new Date(currentDate);
      candidateDate.setDate(candidateDate.getDate() + dayOffset);
      
      const dayName = this.getDayName(candidateDate);
      
      // Skip if not preferred day
      if (!preferredDays.includes(dayName)) {
        continue;
      }
      
      for (const hour of preferredHours) {
        const candidateTime = new Date(candidateDate);
        candidateTime.setHours(hour, 0, 0, 0);
        
        // Skip if in the past
        if (candidateTime <= new Date()) {
          continue;
        }
        
        const score = this.calculateTimeScore(candidateTime, dayName, hour);
        
        candidates.push({
          timestamp: candidateTime.toISOString(),
          localTime: this.formatLocalTime(candidateTime, timezone),
          day: dayName,
          hour: hour,
          score: score,
          timezone: timezone,
          expectedOpenRate: this.dayPerformance[dayName].openRate,
          expectedReplyRate: this.dayPerformance[dayName].replyRate
        });
      }
    }
    
    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    
    return {
      leadId: lead.id,
      company: lead.company,
      timezone: timezone,
      recommendations: candidates.slice(0, 5),
      bestTime: candidates[0] || null,
      alternativeTimes: candidates.slice(1, 4)
    };
  }

  /**
   * Calculate score for a specific time slot
   * @param {Date} date - Date object
   * @param {string} dayName - Day name
   * @param {number} hour - Hour (0-23)
   * @returns {number} Score 0-100
   */
  calculateTimeScore(date, dayName, hour) {
    const dayScore = this.dayPerformance[dayName]?.score || 50;
    const hourScore = this.hourPerformance[hour]?.score || 50;
    
    // Weight day slightly more than hour
    return Math.round((dayScore * 0.6) + (hourScore * 0.4));
  }

  /**
   * Get timezone for a lead
   * @param {Object} lead - Lead object
   * @returns {string} Timezone string
   */
  getTimezone(lead) {
    // Check if lead has explicit timezone
    if (lead.timezone) {
      return lead.timezone;
    }
    
    // Infer from region/notes
    const notes = (lead.notes || '').toLowerCase();
    const company = (lead.company || '').toLowerCase();
    
    if (notes.includes('philippines') || notes.includes('philippine') || 
        company.includes('ph') || lead.region === 'Philippines') {
      return this.timezones['Philippines'];
    }
    
    if (notes.includes('singapore') || lead.region === 'Singapore') {
      return this.timezones['Singapore'];
    }
    
    if (notes.includes('hong kong') || notes.includes('hk') || lead.region === 'Hong Kong') {
      return this.timezones['Hong Kong'];
    }
    
    if (notes.includes('australia') || lead.region === 'Australia') {
      return this.timezones['Australia'];
    }
    
    if (notes.includes('japan') || notes.includes('tokyo') || lead.region === 'Japan') {
      return this.timezones['Japan'];
    }
    
    if (notes.includes('uk') || notes.includes('london') || notes.includes('british')) {
      return this.timezones['UK'];
    }
    
    if (notes.includes('germany') || notes.includes('berlin')) {
      return this.timezones['Germany'];
    }
    
    if (notes.includes('us') || notes.includes('america') || notes.includes('states')) {
      return this.timezones['US-East'];
    }
    
    if (notes.includes('brazil') || notes.includes('brasil')) {
      return this.timezones['Brazil'];
    }
    
    if (notes.includes('nigeria') || notes.includes('lagos')) {
      return this.timezones['Nigeria'];
    }
    
    // Default to Philippines timezone (primary market)
    return this.timezones['Philippines'];
  }

  /**
   * Get day name from date
   * @param {Date} date - Date object
   * @returns {string} Day name
   */
  getDayName(date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Format time in local timezone
   * @param {Date} date - Date object
   * @param {string} timezone - Timezone string
   * @returns {string} Formatted time
   */
  formatLocalTime(date, timezone) {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }

  /**
   * Generate weekly schedule for multiple leads
   * @param {Array} leads - Array of lead objects
   * @param {Object} options - Scheduling options
   * @returns {Object} Weekly schedule
   */
  generateWeeklySchedule(leads, options = {}) {
    const schedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };
    
    const usedSlots = new Set();
    
    for (const lead of leads) {
      const optimal = this.calculateOptimalTime(lead, options);
      
      if (optimal.bestTime) {
        // Check if slot is already used
        const slotKey = `${optimal.bestTime.day}-${optimal.bestTime.hour}`;
        
        if (!usedSlots.has(slotKey)) {
          schedule[optimal.bestTime.day].push({
            leadId: lead.id,
            company: lead.company,
            contact: lead.contact_name,
            time: optimal.bestTime.localTime,
            hour: optimal.bestTime.hour,
            timezone: optimal.bestTime.timezone,
            score: optimal.bestTime.score
          });
          
          usedSlots.add(slotKey);
        } else {
          // Find alternative slot
          for (const alt of optimal.alternativeTimes) {
            const altKey = `${alt.day}-${alt.hour}`;
            if (!usedSlots.has(altKey)) {
              schedule[alt.day].push({
                leadId: lead.id,
                company: lead.company,
                contact: lead.contact_name,
                time: alt.localTime,
                hour: alt.hour,
                timezone: alt.timezone,
                score: alt.score
              });
              
              usedSlots.add(altKey);
              break;
            }
          }
        }
      }
    }
    
    // Sort each day by hour
    for (const day of Object.keys(schedule)) {
      schedule[day].sort((a, b) => a.hour - b.hour);
    }
    
    return {
      weekOf: new Date().toISOString().split('T')[0],
      totalScheduled: leads.length,
      schedule: schedule,
      summary: this.generateScheduleSummary(schedule)
    };
  }

  /**
   * Generate summary of schedule
   * @param {Object} schedule - Weekly schedule
   * @returns {Object} Summary
   */
  generateScheduleSummary(schedule) {
    const summary = {
      byDay: {},
      byTimezone: {},
      total: 0,
      avgScore: 0
    };
    
    let totalScore = 0;
    let count = 0;
    
    for (const [day, slots] of Object.entries(schedule)) {
      summary.byDay[day] = slots.length;
      summary.total += slots.length;
      
      for (const slot of slots) {
        summary.byTimezone[slot.timezone] = (summary.byTimezone[slot.timezone] || 0) + 1;
        totalScore += slot.score;
        count++;
      }
    }
    
    summary.avgScore = count > 0 ? Math.round(totalScore / count) : 0;
    
    return summary;
  }

  /**
   * Get best send windows for planning
   * @returns {Object} Best windows by metric
   */
  getBestWindows() {
    return {
      byOpenRate: {
        days: ['Wednesday', 'Tuesday', 'Thursday'],
        hours: [10, 9, 11, 14]
      },
      byReplyRate: {
        days: ['Wednesday', 'Tuesday', 'Thursday'],
        hours: [10, 9, 11]
      },
      byMeetingRate: {
        days: ['Wednesday', 'Tuesday', 'Thursday'],
        hours: [10, 11]
      },
      avoid: {
        days: ['Friday', 'Saturday', 'Sunday', 'Monday'],
        hours: [6, 7, 18, 19, 20]
      }
    };
  }

  /**
   * Calculate expected performance for a scheduled send
   * @param {Object} scheduledSend - Scheduled send object
   * @returns {Object} Expected performance metrics
   */
  calculateExpectedPerformance(scheduledSend) {
    const dayPerf = this.dayPerformance[scheduledSend.day];
    const hourPerf = this.hourPerformance[scheduledSend.hour];
    
    if (!dayPerf || !hourPerf) {
      return null;
    }
    
    // Weight day performance more heavily
    const openRate = Math.round((dayPerf.openRate * 0.7) + (hourPerf.openRate * 0.3));
    const replyRate = Math.round(dayPerf.replyRate * 10) / 10;
    
    return {
      expectedOpenRate: openRate,
      expectedReplyRate: replyRate,
      expectedMeetingRate: Math.round((replyRate * 0.25) * 10) / 10,
      confidence: scheduledSend.score
    };
  }
}

// Export for use in other modules
module.exports = SendScheduler;

// CLI usage
if (require.main === module) {
  const scheduler = new SendScheduler();
  
  
  // Demo lead
  const demoLead = {
    id: 'lead_001',
    company: 'Coins.ph',
    contact_name: 'Wei Zhou',
    notes: 'Philippines crypto exchange CEO'
  };
  
  // Calculate optimal time
  const optimal = scheduler.calculateOptimalTime(demoLead);
  
  
  optimal.recommendations.forEach((rec, i) => {
  });
  
  // Best windows
  const windows = scheduler.getBestWindows();
  
  // Weekly schedule demo
  const demoLeads = [
    { id: '1', company: 'Coins.ph', contact_name: 'Wei Zhou', notes: 'Philippines' },
    { id: '2', company: 'Maya', contact_name: 'Shailesh Baidwan', notes: 'Philippines' },
    { id: '3', company: 'Xendit', contact_name: 'Moses Lo', notes: 'Singapore' },
    { id: '4', company: 'GCash', contact_name: 'Martha Sazon', notes: 'Philippines' },
    { id: '5', company: 'PDAX', contact_name: 'Nichel Gaba', notes: 'Philippines' },
    { id: '6', company: 'PayMongo', contact_name: 'Jojo Malolos', notes: 'Philippines' },
    { id: '7', company: 'GoTyme', contact_name: 'Albert Tinio', notes: 'Philippines' },
    { id: '8', company: 'Dragonpay', contact_name: 'Robertson Chiang', notes: 'Philippines' },
    { id: '9', company: 'Tala', contact_name: 'Shivani Siroya', notes: 'Philippines' }
  ];
  
  const weeklySchedule = scheduler.generateWeeklySchedule(demoLeads);
  
  for (const [day, slots] of Object.entries(weeklySchedule.schedule)) {
    if (slots.length > 0) {
      slots.forEach(slot => {
      });
    }
  }
  
}
