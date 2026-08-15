"use client";

import { makeDoc, autoTable, downloadPdf, printPdf, footer, type jsPDF } from "@/lib/pdf";
import { formatMonth } from "@/lib/utils";
import { ACADEMY_NAME } from "@/lib/constants";

type ReceiptData = {
  receiptNumber: string;
  studentName: string;
  studentId: string;
  guardianName: string;
  month: string;
  monthlyFee: number;
  discount: number;
  paidAmount: number;
  balance: number;
  paymentMethod?: string | null;
  paymentDate?: string | null;
  remarks?: string | null;
  footerText?: string | null;
};

function methodLabel(method?: string | null): string {
  const map: Record<string, string> = {
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
    JAZZCASH: "JazzCash",
    EASYPAISA: "EasyPaisa",
    CARD: "Card",
    OTHER: "Other",
  };
  return method ? map[method] ?? method : "—";
}

export function buildReceiptPdf(data: ReceiptData): jsPDF {
  const doc = makeDoc("FEE PAYMENT RECEIPT");

  doc.setFontSize(10);
  doc.setTextColor(11, 31, 58);
  doc.text(`Receipt No: ${data.receiptNumber}`, 14, 42, { align: "left" });
  doc.text(
    `Date: ${data.paymentDate ?? "—"}`,
    doc.internal.pageSize.getWidth() - 14,
    42,
    { align: "right" }
  );

  autoTable(doc, {
    startY: 50,
    head: [["Received from", "Student", "Month"]],
    body: [
      [
        data.guardianName || "—",
        `${data.studentName} (${data.studentId})`,
        formatMonth(data.month),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [11, 31, 58] },
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8,
    head: [["Description", "Amount (Rs.)"]],
    body: [
      [`Monthly fee — ${formatMonth(data.month)}`, data.monthlyFee.toLocaleString()],
      ["Discount", `- ${data.discount.toLocaleString()}`],
      ["Total due", (data.monthlyFee - data.discount).toLocaleString()],
      ["Amount paid", data.paidAmount.toLocaleString()],
      ["Balance remaining", data.balance.toLocaleString()],
      ["Payment method", methodLabel(data.paymentMethod)],
    ],
    theme: "striped",
    headStyles: { fillColor: [15, 90, 48] },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 55, halign: "right" },
    },
    foot: [["", ""]],
    didParseCell: (data_) => {
      if (data_.section === "body" && data_.row.index === 3) {
        data_.cell.styles.fontStyle = "bold";
        data_.cell.styles.fillColor = [232, 244, 236];
      }
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  if (data.remarks) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Remarks: ${data.remarks}`, 14, finalY + 8);
  }

  doc.setFontSize(9);
  doc.setTextColor(11, 31, 58);
  doc.text(
    data.footerText
      ? data.footerText
      : `Thank you for your payment. This is a computer-generated receipt from ${ACADEMY_NAME}.`,
    14,
    finalY + 20
  );
  doc.text(
    "Authorized signature: ______________________",
    doc.internal.pageSize.getWidth() - 14,
    doc.internal.pageSize.getHeight() - 20,
    { align: "right" }
  );

  footer(doc);
  return doc;
}

export function downloadReceipt(data: ReceiptData) {
  const doc = buildReceiptPdf(data);
  downloadPdf(doc, `receipt-${data.receiptNumber}.pdf`);
}

export function printReceipt(data: ReceiptData) {
  const doc = buildReceiptPdf(data);
  printPdf(doc);
}
