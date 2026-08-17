import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export function formatDate(date: Date | string): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy");
}

const PK_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function pkFormatter(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(opts);
  let f = PK_FORMATTER_CACHE.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", ...opts });
    PK_FORMATTER_CACHE.set(key, f);
  }
  return f;
}

export function formatDateTimePK(date: Date | string): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return pkFormatter({
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(d)
    .replace(" am", " AM")
    .replace(" pm", " PM");
}

export function formatDatePK(date: Date | string): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return pkFormatter({
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1, 1);
  return format(d, "MMM yyyy");
}

export function calculateAge(dob: Date | string): number {
  const birth = typeof dob === "string" ? parseISO(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function nextStudentId(lastId: string | null): string {
  const num = lastId ? parseInt(lastId.replace(/^YFA-/, ""), 10) : 0;
  return `YFA-${String(num + 1).padStart(5, "0")}`;
}

export function generateQrToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `RCP-${y}${m}-${rand}`;
}

export function generateResetToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function dateOnlyUTC(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export function todayUTC(): Date {
  const now = new Date();
  return dateOnlyUTC(now);
}

export function toUTCDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const shown = user.slice(0, 2);
  return `${shown}${"*".repeat(Math.max(2, user.length - 2))}@${domain}`;
}

export function waLink(phone: string, message: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function phoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "—";
  return phone;
}

export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("92")) digits = digits.slice(2);
  if (!digits.startsWith("0")) digits = `0${digits}`;
  return digits;
}

export function normalizeStudentId(raw: string): string {
  const trimmed = raw.trim().replace(/^yfa[-_ ]?/i, "");
  const num = parseInt(trimmed, 10);
  return Number.isFinite(num) && num > 0
    ? `YFA-${String(num).padStart(5, "0")}`
    : trimmed.toUpperCase();
}
