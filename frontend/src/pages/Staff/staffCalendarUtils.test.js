import { getCalendarBlocks } from "./staffCalendarUtils";

describe("getCalendarBlocks", () => {
  test("splits working hours around unavailable time and an appointment", () => {
    const blocks = getCalendarBlocks(
      "2026-09-30",
      [{ id: 4, availability_date: "2026-09-30", start_time: "08:00:00", end_time: "17:00:00", is_active: true }],
      [{ id: 9, block_start: "2026-09-30T13:00:00.000Z", block_end: "2026-09-30T14:00:00.000Z" }],
      [{ id: 12, start_time: "2026-09-30T14:30:00.000Z", end_time: "2026-09-30T15:30:00.000Z" }]
    );

    expect(blocks.map(({ type, startLabel, endLabel }) => [type, startLabel, endLabel])).toEqual([
      ["available", "08:00", "13:00"],
      ["unavailable", "13:00", "14:00"],
      ["available", "14:00", "14:30"],
      ["appointment", "14:30", "15:30"],
      ["available", "15:30", "17:00"],
    ]);
  });

  test("does not carry one date's hours onto the same weekday next week", () => {
    const thursdayHours = [{
      id: 21,
      availability_date: "2026-10-01",
      start_time: "09:00:00",
      end_time: "10:00:00",
      is_active: true,
    }];

    expect(getCalendarBlocks("2026-10-01", thursdayHours, [], []).map(({ type }) => type))
      .toEqual(["available"]);
    expect(getCalendarBlocks("2026-10-08", thursdayHours, [], [])).toEqual([]);
  });
});