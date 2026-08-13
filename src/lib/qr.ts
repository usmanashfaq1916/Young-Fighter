"use client";
import QRCode from "qrcode";

export async function generateQrDataUrl(text: string, size = 256): Promise<string> {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: "#0B1F3A", light: "#ffffff" },
  });
}

export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", margin: 1 });
}

export function studentQrContent(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/scan/${token}`;
}