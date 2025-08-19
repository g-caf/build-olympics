/**
 * Calendar invite generator for Amp Arena tickets
 */

/**
 * Generate .ics (iCalendar) file content for the event
 */
function generateICSFile(ticketData) {
    const {
        email,
        ticketCode,
        eventDate = 'October 29th, 2025',
        venue = 'The Midway SF',
        venueAddress = '900 Marin St, San Francisco, CA 94124'
    } = ticketData;

    // Convert event date to proper datetime format
    // Assuming 6:00 PM start time, 4 hour duration
    const eventStart = '20251029T180000Z'; // 6:00 PM UTC (adjust timezone as needed)
    const eventEnd = '20251029T220000Z';   // 10:00 PM UTC
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Amp Arena//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:amp-arena-${ticketCode}@build-olympics.com
DTSTAMP:${now}
DTSTART:${eventStart}
DTEND:${eventEnd}
SUMMARY:Amp Arena - Build Olympics Final Battle
DESCRIPTION:The ultimate coding competition final battle!\\n\\nYour ticket: ${ticketCode}\\n\\nWitness history as 16 finalists compete for $1,000,000 in the most intense coding battle ever staged.\\n\\nEvent Details:\\n- Four qualifying rounds leading to this moment\\n- Live coding challenges\\n- $1,000,000 winner-takes-all prize\\n\\nBring this email or show your ticket QR code at the door.
LOCATION:${venue}, ${venueAddress}
ORGANIZER;CN=Amp Arena:MAILTO:info@ampcode.com
ATTENDEE;CN=${email};RSVP=TRUE:MAILTO:${email}
STATUS:CONFIRMED
CLASS:PUBLIC
PRIORITY:5
BEGIN:VALARM
TRIGGER:-PT24H
ACTION:DISPLAY
DESCRIPTION:Reminder: Amp Arena tomorrow!
END:VALARM
BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:Amp Arena starts in 2 hours!
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return icsContent;
}

/**
 * Generate calendar links for popular calendar services
 */
function generateCalendarLinks(ticketData) {
    const {
        ticketCode,
        eventDate = 'October 29th, 2025',
        venue = 'The Midway SF',
        venueAddress = '900 Marin St, San Francisco, CA 94124'
    } = ticketData;

    const eventTitle = 'Amp Arena - Build Olympics Final Battle';
    const eventDescription = `The ultimate coding competition! Your ticket: ${ticketCode}. $1,000,000 winner-takes-all prize.`;
    const startDate = '20251029T180000Z';
    const endDate = '20251029T220000Z';

    // Google Calendar link
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(`${venue}, ${venueAddress}`)}`;

    // Outlook link
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventTitle)}&startdt=${startDate}&enddt=${endDate}&body=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(`${venue}, ${venueAddress}`)}`;

    // Yahoo Calendar link
    const yahooUrl = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${encodeURIComponent(eventTitle)}&st=${startDate}&et=${endDate}&desc=${encodeURIComponent(eventDescription)}&in_loc=${encodeURIComponent(`${venue}, ${venueAddress}`)}`;

    return {
        google: googleCalendarUrl,
        outlook: outlookUrl,
        yahoo: yahooUrl
    };
}

/**
 * Generate calendar invite HTML section for email
 */
function generateCalendarInviteHTML(calendarLinks) {
    return `
    <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #333;">
        <h3 style="color: #00ff88; margin-bottom: 15px; font-size: 18px;">📅 Add to Calendar</h3>
        <p style="margin-bottom: 15px; color: #cccccc;">Don't miss the event! Add it to your calendar:</p>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="${calendarLinks.google}" 
               style="background: #4285f4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; display: inline-block;"
               target="_blank">+ Google Calendar</a>
            
            <a href="${calendarLinks.outlook}" 
               style="background: #0078d4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; display: inline-block;"
               target="_blank">+ Outlook</a>
            
            <a href="${calendarLinks.yahoo}" 
               style="background: #6001d2; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; display: inline-block;"
               target="_blank">+ Yahoo Calendar</a>
        </div>
        
        <p style="margin-top: 10px; font-size: 12px; color: #888;">
            Or use the attached .ics file to import into any calendar app
        </p>
    </div>`;
}

module.exports = {
    generateICSFile,
    generateCalendarLinks,
    generateCalendarInviteHTML
};
