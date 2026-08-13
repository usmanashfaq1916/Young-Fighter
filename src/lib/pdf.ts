"use client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ACADEMY_NAME } from "@/lib/constants";

export const ACADEMY_COLOR: [number, number, number] = [11, 31, 58];
export const GREEN_COLOR: [number, number, number] = [15, 90, 48];
export const GOLD_COLOR: [number, number, number] = [212, 160, 23];

export function headerBand(doc: jsPDF, subtitle: string) {
  doc.setFillColor(...ACADEMY_COLOR);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, "F");
  doc.setFillColor(...GREEN_COLOR);
  doc.rect(0, 30, doc.internal.pageSize.getWidth(), 2, "F");
  doc.setTextColor(245, 217, 130);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(ACADEMY_NAME.toUpperCase(), 14, 14);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(subtitle, 14, 22);
  const stamp = format(new Date(), "dd MMM yyyy");
  doc.text(stamp, doc.internal.pageSize.getWidth() - 14, 14, { align: "right" });
}

export function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `${ACADEMY_NAME} — Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }
}

export function makeDoc(title: string): jsPDF {
  const doc = new jsPDF();
  headerBand(doc, title);
  doc.text("", 14, 40);
  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function printPdf(doc: jsPDF) {
  const url = doc.output("bloburl");
  const win = window.open(url as unknown as string, "_blank");
  if (win) win.focus();
}

export { autoTable };
export type { jsPDF };