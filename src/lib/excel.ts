"use client";
import * as XLSX from "xlsx";

export type ExcelColumn<T> = {
  header: string;
  key: string;
  accessor: (row: T) => string | number | null | undefined;
};

export function exportToExcel<T>(
  rows: T[],
  columns: ExcelColumn<T>[],
  filename: string
) {
  const data = rows.map((row) => {
    const obj: Record<string, string | number> = {};
    for (const col of columns) {
      const value = col.accessor(row);
      obj[col.header] = value === null || value === undefined ? "" : value;
    }
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToCsv<T>(rows: T[], columns: ExcelColumn<T>[], filename: string) {
  const escape = (v: string | number | null | undefined): string => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    columns.map((c) => escape(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escape(c.accessor(row))).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}