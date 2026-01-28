
export type Schedule = {
    [key: string]: string[];
};

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function isOpenNow(schedule: any, timeZone: string = 'Europe/Madrid'): boolean {
    if (!schedule) return false;

    try {
        const now = new Date();
        // Get time in target zone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone,
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(now);
        const dayStr = parts.find(p => p.type === 'weekday')?.value.toLowerCase(); // e.g., "monday"
        if (!dayStr) return false;

        // Parse current minutes (0-1439)
        const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
        const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
        const nowMin = h * 60 + m;

        // 1. Check Today
        if (checkDay(schedule, dayStr, nowMin)) return true;

        // 2. Check Yesterday (for spills)
        // We need "Yesterday's name" in the target timezone.
        const todayIdx = DAYS.indexOf(dayStr);
        const yestIdx = (todayIdx - 1 + 7) % 7;
        const yestStr = DAYS[yestIdx];

        // For yesterday check, our "current time" is effectively (24h + nowMin)
        // e.g. 01:00 am -> 25:00 relative to yesterday
        if (checkDay(schedule, yestStr, nowMin + 24 * 60)) return true;

        return false;

    } catch (e) {
        console.error("Error checking open status", e);
        return false;
    }
}

function checkDay(schedule: any, dayKey: string, minutesRef: number): boolean {
    const slots = schedule[dayKey];
    if (!Array.isArray(slots)) return false;

    for (const slot of slots) {
        // slot format "HH:MM-HH:MM"
        const [start, end] = slot.split('-');
        if (!start || !end) continue;

        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);

        const sMin = sH * 60 + sM;
        let eMin = eH * 60 + eM;

        // Handle closing next day (e.g. 20:00-02:00 -> 02:00 is 26:00)
        if (eMin < sMin) eMin += 24 * 60;

        if (minutesRef >= sMin && minutesRef < eMin) return true;
    }
    return false;
}
