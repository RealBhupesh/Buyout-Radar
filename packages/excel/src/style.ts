import type ExcelJS from "exceljs";
export function styleWorkbook(workbook: ExcelJS.Workbook) {
  for (const sheet of workbook.worksheets) {
    sheet.views = [{ state: "frozen", ySplit: 2, xSplit: 1 }];
    sheet.getColumn(1).width = 34;
    for (let col = 2; col <= Math.max(7, sheet.columnCount); col++)
      sheet.getColumn(col).width = 18;
    sheet.eachRow((row, index) => {
      row.height = index === 1 ? 31 : 23;
      row.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 11, color: { argb: "FF234638" } };
        cell.alignment = { vertical: "middle" };
        if (typeof cell.value === "number" || cell.type === 6)
          cell.numFmt = '#,##0.00;[Red](#,##0.00);"-"';
      });
      if (index === 1)
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF234638" },
          };
          cell.font = {
            name: "Calibri",
            size: 15,
            bold: true,
            color: { argb: "FFFFFFFF" },
          };
        });
      else if (index % 2 === 0)
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0F5EB" },
          };
        });
    });
    sheet.pageSetup = {
      paperSize: 9,
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };
  }
}
