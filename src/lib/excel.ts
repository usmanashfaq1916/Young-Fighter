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