import { HOURS, SITE } from '../data/site';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Current wall-clock time at the shop (South Africa), independent of the visitor's timezone. */
export function shopNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SITE.timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return {
    day: WEEKDAY_INDEX[get('weekday')],
    h: Number(get('hour')),
    m: Number(get('minute')),
    s: Number(get('second')),
  };
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const hoursForDay = (day) => HOURS.find((r) => r.days.includes(day));

/**
 * { open, label, detail, todayIndex }
 * e.g. { open: true, label: 'Open now', detail: 'Closes 19:00' }
 */
export function openStatus(now = shopNow()) {
  const minutes = now.h * 60 + now.m;
  const today = hoursForDay(now.day);

  if (today && !today.closed) {
    const o = toMin(today.open);
    const c = toMin(today.close);
    if (minutes >= o && minutes < c) {
      const left = c - minutes;
      return {
        open: true,
        label: left <= 45 ? 'Closing soon' : 'Open now',
        detail: `Until ${today.close} today`,
        rowIndex: HOURS.indexOf(today),
      };
    }
    if (minutes < o) {
      return { open: false, label: 'Opening soon', detail: `Opens today at ${today.open}`, rowIndex: HOURS.indexOf(today) };
    }
  }

  // find next opening day
  for (let i = 1; i <= 7; i++) {
    const d = (now.day + i) % 7;
    const row = hoursForDay(d);
    if (row && !row.closed) {
      const when = i === 1 ? 'tomorrow' : DAY_NAMES[d];
      return {
        open: false,
        label: 'Closed now',
        detail: `Opens ${when} at ${row.open}`,
        rowIndex: today ? HOURS.indexOf(today) : -1,
      };
    }
  }
  return { open: false, label: 'Closed', detail: '', rowIndex: -1 };
}

/** Blue Monday helper. */
export function blueMondayStatus(now = shopNow()) {
  if (now.day === 1) {
    const close = toMin(hoursForDay(1).close);
    const minutes = now.h * 60 + now.m;
    if (minutes < close) return { today: true, text: "It's Monday — the deal is on today!" };
    return { today: false, text: 'Next Blue Monday is in 7 days' };
  }
  const days = (8 - now.day) % 7 || 7;
  return {
    today: false,
    text: days === 1 ? 'Blue Monday is tomorrow — get ready!' : `Next Blue Monday is in ${days} days`,
  };
}

export { DAY_NAMES };
