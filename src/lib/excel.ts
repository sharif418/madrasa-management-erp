// Excel export helper — wraps ExcelJS to produce a multi-sheet .xlsx buffer
// with bold/emerald header row, auto-width columns, and frozen header.
import ExcelJS from "exceljs";

export type ExcelSheet = {
  name: string;
  headers: string[];
  rows: (string | number)[][];
};

const EMERALD_FILL: Partial<ExcelJS.Fill> = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF059669" }, // emerald-600
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: "FFFFFFFF" },
  size: 11,
};

export async function generateExcel(
  filename: string,
  sheets: ExcelSheet[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Madrasa Manager";
  wb.created = new Date();

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name.slice(0, 31) || "Sheet", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // Header row
    ws.addRow(sheet.headers);
    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = EMERALD_FILL;
      cell.font = HEADER_FONT;
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF047857" } },
      };
    });
    headerRow.height = 22;

    // Data rows
    for (const row of sheet.rows) ws.addRow(row);

    // Auto-width: scan max length per column (cap 60)
    const widths = new Array(sheet.headers.length).fill(10);
    ws.eachRow((row, rowNum) => {
      row.eachCell((cell, colNumber) => {
        const len = cell.value == null ? 0 : String(cell.value).length;
        if (len > widths[colNumber - 1]) widths[colNumber - 1] = len;
      });
      if (rowNum > 1) row.height = 18;
    });
    ws.columns.forEach((col, i) => {
      col.width = Math.min(60, Math.max(12, widths[i] + 2));
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// Convenience: build a Response with proper headers for an .xlsx download.
export function excelResponse(buf: Buffer, filename: string): Response {
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
