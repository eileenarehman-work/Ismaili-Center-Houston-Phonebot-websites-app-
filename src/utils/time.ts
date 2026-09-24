/**
 * Central Time (America/Chicago) utilities for Ismaili Center Houston
 * Houston is located in US Central Time (CDT in summer UTC-5, CST in winter UTC-6).
 */

export interface CentralTimeInfo {
  hour: number;
  minute: number;
  second: number;
  weekday: string;
  isFriday: boolean;
  displayTime: string; // e.g. "12:15 PM CDT"
  shortTime: string;   // e.g. "12:15 PM CT"
  dateString: string;  // e.g. "Friday, September 11, 2026"
}

export interface PrayerCountdownInfo {
  name: string;
  diffMinutes: number;
  isActive: boolean;
  timeText: string;
  centralTimeStr: string;
}

export function getCentralTimeInfo(now: Date = new Date()): CentralTimeInfo {
  const timeZone = 'America/Chicago';

  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'short',
  });

  const parts = partsFormatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const hour = parseInt(partMap.hour || '0', 10);
  const minute = parseInt(partMap.minute || '0', 10);
  const second = parseInt(partMap.second || '0', 10);
  const weekday = partMap.weekday || 'Fri';
  const isFriday = weekday === 'Fri';

  const displayTime = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(now);

  const shortTime = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now) + ' CT';

  const dateString = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now);

  return {
    hour,
    minute,
    second,
    weekday,
    isFriday,
    displayTime,
    shortTime,
    dateString,
  };
}

export function calculateCentralPrayerCountdown(now: Date = new Date()): PrayerCountdownInfo {
  const info = getCentralTimeInfo(now);
  const currentMinutes = info.hour * 60 + info.minute;

  const bandagiStart = 4 * 60; // 4:00 AM CT
  const bandagiEnd = 5 * 60;   // 5:00 AM CT
  const morningStart = 5 * 60; // 5:00 AM CT
  const morningEnd = 5 * 60 + 30; // 5:30 AM CT
  const eveningStart = info.isFriday ? 19 * 60 + 30 : 19 * 60; // 7:30 PM on Fri, 7:00 PM Mon-Thu, Sat, Sun
  const eveningEnd = eveningStart + 45; // ~45 mins assembly

  let name = '';
  let diffMinutes = 0;
  let isActive = false;

  if (currentMinutes < bandagiStart) {
    name = 'Bandagi';
    diffMinutes = bandagiStart - currentMinutes;
  } else if (currentMinutes >= bandagiStart && currentMinutes < bandagiEnd) {
    name = 'Bandagi';
    diffMinutes = bandagiEnd - currentMinutes;
    isActive = true;
  } else if (currentMinutes < morningStart) {
    name = 'Morning Dua';
    diffMinutes = morningStart - currentMinutes;
  } else if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
    name = 'Morning Dua';
    diffMinutes = morningEnd - currentMinutes;
    isActive = true;
  } else if (currentMinutes < eveningStart) {
    name = 'Evening Prayer';
    diffMinutes = eveningStart - currentMinutes;
  } else if (currentMinutes >= eveningStart && currentMinutes < eveningEnd) {
    name = 'Evening Prayer';
    diffMinutes = eveningEnd - currentMinutes;
    isActive = true;
  } else {
    name = "Tomorrow's Bandagi";
    diffMinutes = 24 * 60 - currentMinutes + bandagiStart;
  }

  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  let text = isActive ? 'Active (Ends in ' : 'Starts in ';
  if (hrs > 0) text += `${hrs}h `;
  text += `${mins}m`;
  if (isActive) text += ')';

  return {
    name,
    diffMinutes,
    isActive,
    timeText: text,
    centralTimeStr: info.shortTime,
  };
}

export function formatCentralTimestamp(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date) + ' CT';
}

/**
 * Returns exact Central Time date, time, and full formatted string
 */
export function getCentralDateTime(date: Date = new Date()): {
  date: string;       // e.g. "Sep 24, 2026"
  time: string;       // e.g. "11:15 AM CT"
  weekday: string;    // e.g. "Thursday"
  full: string;       // e.g. "Thursday, Sep 24, 2026 at 11:15 AM CT"
  shortFull: string;  // e.g. "Sep 24, 2026, 11:15 AM CT"
  iso: string;
} {
  const timeZone = 'America/Chicago';
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(date);
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date) + ' CT';

  return {
    date: dateStr,
    time: timeStr,
    weekday,
    full: `${weekday}, ${dateStr} at ${timeStr}`,
    shortFull: `${dateStr}, ${timeStr}`,
    iso: date.toISOString(),
  };
}

/**
 * Formats any input (Date, string, number) into verified Date + Time in Central Time
 */
export function formatCentralDateAndTime(input?: string | Date | number): { date: string; time: string; full: string } {
  if (!input) {
    const current = getCentralDateTime();
    return { date: current.date, time: current.time, full: current.shortFull };
  }
  const d = typeof input === 'string' || typeof input === 'number' ? new Date(input) : input;
  if (isNaN(d.getTime())) {
    const fallback = getCentralDateTime();
    return { date: fallback.date, time: fallback.time, full: String(input) };
  }
  const dt = getCentralDateTime(d);
  return { date: dt.date, time: dt.time, full: dt.shortFull };
}

/**
 * Accurately formats a timestamp or date relative to current Central Time.
 * If the date occurred today -> "Today at [h:mm A] CT"
 * If the date occurred yesterday -> "Yesterday at [h:mm A] CT"
 * Otherwise -> "[MMM d] at [h:mm A] CT"
 */
export function formatRelativeCentralTimestamp(input?: string | Date | number): string {
  if (!input) return 'Just now';
  
  // If it's already an explicit string like "Yesterday at ...", return it cleanly
  if (typeof input === 'string' && input.startsWith('Yesterday at ')) {
    return input;
  }

  let date: Date;
  if (typeof input === 'string') {
    // If it's a legacy string like "Today at 09:30 AM CT" without isoDate, check if it's today
    if (input.startsWith('Today at ')) {
      return input;
    }
    date = new Date(input);
  } else if (typeof input === 'number') {
    date = new Date(input);
  } else {
    date = input;
  }

  if (isNaN(date.getTime())) {
    return String(input);
  }

  const timeZone = 'America/Chicago';

  // Format the time part in Central Time
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date) + ' CT';

  // Extract year, month, day in Central Time for "now" and "target"
  const now = new Date();
  const getDayKey = (d: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(d);
    let y = 0, m = 0, day = 0;
    for (const p of parts) {
      if (p.type === 'year') y = parseInt(p.value, 10);
      if (p.type === 'month') m = parseInt(p.value, 10);
      if (p.type === 'day') day = parseInt(p.value, 10);
    }
    return { y, m, day, epochDay: Math.floor(Date.UTC(y, m - 1, day) / 86400000) };
  };

  const nowKey = getDayKey(now);
  const targetKey = getDayKey(date);
  const dayDiff = nowKey.epochDay - targetKey.epochDay;

  if (dayDiff === 0) {
    return `Today at ${timeStr}`;
  } else if (dayDiff === 1) {
    return `Yesterday at ${timeStr}`;
  } else if (dayDiff > 1 && dayDiff < 7) {
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
    return `${weekday} at ${timeStr}`;
  } else {
    const monthDay = new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' }).format(date);
    return `${monthDay} at ${timeStr}`;
  }
}
