import { describe, expect, it } from "vitest";
import {
  calculateAge,
  currentMonth,
  dateOnlyUTC,
  formatDate,
  formatMoney,
  formatMonth,
  generateReceiptNumber,
  initials,
  maskEmail,
  nextStudentId,
  phoneDisplay,
  toUTCDateKey,
  waLink,
} from "@/lib/utils";

describe("formatMoney", () => {
  it("formats with Rs. prefix and locale separators", () => {
    expect(formatMoney(0)).toBe("Rs. 0");
    expect(formatMoney(8000)).toBe("Rs. 8,000");
    expect(formatMoney(1250000)).toBe("Rs. 1,250,000");
  });
});

describe("formatDate", () => {
  it("formats Date objects", () => {
    expect(formatDate(new Date(2026, 7, 13))).toBe("13 Aug 2026");
  });
  it("formats ISO strings", () => {
    expect(formatDate("2026-01-05")).toContain("Jan");
  });
  it("handles empty input", () => {
    expect(formatDate("")).toBe("—");
  });
});

describe("formatMonth", () => {
  it("formats yyyy-MM keys", () => {
    expect(formatMonth("2026-08")).toBe("Aug 2026");
    expect(formatMonth("2025-12")).toBe("Dec 2025");
    expect(formatMonth("2026-01")).toBe("Jan 2026");
  });
});

describe("calculateAge", () => {
  it("computes age correctly across birthdays", () => {
    const now = new Date();
    expect(calculateAge(new Date(now.getFullYear() - 10, now.getMonth(), now.getDate()))).toBe(10);
    expect(
      calculateAge(new Date(now.getFullYear() - 10, now.getMonth() - 1, now.getDate()))
    ).toBe(10);
    expect(
      calculateAge(new Date(now.getFullYear() - 10, now.getMonth() + 1, now.getDate()))
    ).toBe(9);
  });
});

describe("nextStudentId", () => {
  it("increments and zero-pads", () => {
    expect(nextStudentId(null)).toBe("YFA-00001");
    expect(nextStudentId("YFA-00001")).toBe("YFA-00002");
    expect(nextStudentId("YFA-01000")).toBe("YFA-01001");
  });
});

describe("currentMonth", () => {
  it("returns yyyy-MM for now", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    expect(currentMonth()).toBe(expected);
  });
});

describe("dateOnlyUTC / toUTCDateKey", () => {
  it("normalizes to midnight UTC and formats the date key", () => {
    const d = new Date(2026, 7, 13, 23, 59, 59);
    const utc = dateOnlyUTC(d);
    expect(utc.getUTCFullYear()).toBe(2026);
    expect(utc.getUTCMonth()).toBe(7);
    expect(utc.getUTCDate()).toBe(13);
    expect(toUTCDateKey(utc)).toBe("2026-08-13");
  });
});

describe("generateReceiptNumber", () => {
  it("follows RCP-yyyymm-xxxxxx pattern", () => {
    expect(generateReceiptNumber()).toMatch(/^RCP-\d{6}-\d{6}$/);
  });
  it("generates unique values", () => {
    const a = generateReceiptNumber();
    const b = generateReceiptNumber();
    expect(a).not.toBe(b);
  });
});

describe("initials", () => {
  it("takes first letters of up to two words", () => {
    expect(initials("Ali Hassan")).toBe("AH");
    expect(initials("ali hassan")).toBe("AH");
    expect(initials("Ali")).toBe("A");
    expect(initials("")).toBe("");
  });
});

describe("maskEmail", () => {
  it("masks middle of local part", () => {
    expect(maskEmail("admin@yfa.pk")).toBe("ad***@yfa.pk");
    expect(maskEmail("ab@x.com")).toBe("ab**@x.com");
  });
});

describe("waLink", () => {
  it("strips non-digits and URL-encodes the message", () => {
    const link = waLink("+92 300 1234567", "Fee reminder");
    expect(link).toBe("https://wa.me/923001234567?text=Fee%20reminder");
  });
});

describe("phoneDisplay", () => {
  it("shows phone or dash", () => {
    expect(phoneDisplay("+92 300 1234567")).toBe("+92 300 1234567");
    expect(phoneDisplay(null)).toBe("—");
    expect(phoneDisplay(undefined)).toBe("—");
  });
});
