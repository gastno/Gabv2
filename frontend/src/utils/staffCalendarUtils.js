export const STUDIO_TIME_ZONE = "Atlantic/Reykjavik";

export const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export const STATUS_TRANSITIONS = {
  pending: ["confirmed"],
  confirmed: ["completed", "no_show"],
};

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

export function dateKeyWeekday(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function shiftDateKey(dateKey, amount) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return dateKeyFromParts(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
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

function localMinutes(value) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDIO_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return Number(values.hour) * 60 + Number(values.minute);
}

function clockMinutes(value) {
  const [hour, minute] = String(value).split(":").map(Number);
  return hour * 60 + minute;
}

function intervalForPeriod(startValue, endValue, dateKey) {
  const startDate = getStudioDateKey(startValue);
  const endDate = getStudioDateKey(endValue);
  if (!startDate || !endDate || startDate > dateKey || endDate < dateKey) return null;
  const start = startDate < dateKey ? 0 : localMinutes(startValue);
  const end = endDate > dateKey ? 1440 : localMinutes(endValue);
  return end > start ? { start, end } : null;
}

export function getCalendarBlocks(dateKey, availability, unavailabilities, appointments) {
  const shifts = availability
    .filter((shift) => (!shift.availability_date || shift.availability_date.slice(0, 10) === dateKey)
      && shift.is_active !== false)
    .map((shift) => ({
      ...shift,
      start: clockMinutes(shift.start_time),
      end: clockMinutes(shift.end_time),
    }))
    .filter((shift) => shift.end > shift.start);
  const unavailable = unavailabilities
    .map((period) => ({ ...intervalForPeriod(period.block_start, period.block_end, dateKey), period }))
    .filter((period) => period.start !== undefined);
  const booked = appointments
    .map((appointment) => ({
      ...intervalForPeriod(appointment.start_time, appointment.end_time, dateKey),
      appointment,
    }))
    .filter((appointment) => appointment.start !== undefined);

  const boundaries = [...shifts, ...unavailable, ...booked]
    .flatMap(({ start, end }) => [start, end])
    .sort((left, right) => left - right)
    .filter((boundary, index, values) => index === 0 || boundary !== values[index - 1]);
  const blocks = [];

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    if (end <= start) continue;
    const middle = start + (end - start) / 2;
    const appointment = booked.find((item) => item.start <= middle && item.end >= middle);
    const unavailablePeriod = unavailable.find((item) => item.start <= middle && item.end >= middle);
    const shift = shifts.find((item) => item.start <= middle && item.end >= middle);
    const nextBlock = appointment
      ? { type: "appointment", start, end, appointment: appointment.appointment }
      : unavailablePeriod
        ? { type: "unavailable", start, end, period: unavailablePeriod.period }
        : shift
          ? { type: "available", start, end, availability: shift }
          : null;
    if (!nextBlock) continue;

    const previous = blocks[blocks.length - 1];
    const entityId = nextBlock.appointment?.id || nextBlock.period?.id || nextBlock.availability?.id;
    const previousEntityId = previous?.appointment?.id || previous?.period?.id || previous?.availability?.id;
    if (previous && previous.type === nextBlock.type && previous.end === start && entityId === previousEntityId) {
      previous.end = end;
    } else {
      blocks.push(nextBlock);
    }
  }

  return blocks.map((block) => ({
    ...block,
    startLabel: formatClock(block.start),
    endLabel: formatClock(block.end),
  }));
}

function formatClock(minutes) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function formatPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "N/A";
  return `${new Intl.NumberFormat("is-IS", { maximumFractionDigits: 2 }).format(amount)} kr`;
}

export function normalizeAppointment(appointment) {
  return {
    ...appointment,
    dateKey: getStudioDateKey(appointment.start_time),
    displayTime: formatStudioTime(appointment.start_time),
    displayEndTime: formatStudioTime(appointment.end_time),
    clientName: appointment.customer_name || "Customer",
    phone: appointment.customer_phone || "Not provided",
    email: appointment.customer_email || appointment.email || appointment.customer?.email || "",
    kennitala: appointment.customer_kennitala || appointment.kennitala || appointment.customer?.kennitala || "",
    service: appointment.service_name || "Service",
    price: formatPrice(appointment.price_snapshot_isk),
    status: String(appointment.status || "pending").toLowerCase(),
  };
}

export function makeAvailabilityDrafts(shifts = []) {
  return shifts.map((shift, index) => ({
    key: `${shift.id || index}-${index}`,
    id: shift.id,
    start_time: String(shift.start_time || "09:00").slice(0, 5),
    end_time: String(shift.end_time || "17:00").slice(0, 5),
  }));
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