// Date/time helpers and slot-selection logic for the booking modal's calendar step.
export const STUDIO_TIME_ZONE = "Atlantic/Reykjavik";

export function getStudioDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${part.year}-${part.month}-${part.day}`;
}

export function dateKeyFromParts(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function shiftMonth(monthCursor, amount) {
  const next = new Date(Date.UTC(monthCursor.year, monthCursor.month + amount, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
}

export function formatStudioDate(dateKey, options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function formatStudioTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDIO_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

export function getMonthCells(year, month) {
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const mondayOffset = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  return [
    ...Array(mondayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      dateKey: dateKeyFromParts(year, month + 1, index + 1),
    })),
  ];
}

// Picks up to `max` representative slots spread evenly across the day so a day with many
// 15-minute increments still shows a short, easy-to-scan list (2-5 options) instead of dozens.
export function pickTimeOptions(slots, { max = 5 } = {}) {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  const sorted = [...slots].sort((left, right) => new Date(left.start_time) - new Date(right.start_time));
  if (sorted.length <= max) return sorted;

  const step = (sorted.length - 1) / (max - 1);
  const picked = [];
  const seenIndexes = new Set();
  for (let index = 0; index < max; index += 1) {
    const slotIndex = Math.round(index * step);
    if (!seenIndexes.has(slotIndex)) {
      seenIndexes.add(slotIndex);
      picked.push(sorted[slotIndex]);
    }
  }
  return picked;
}
