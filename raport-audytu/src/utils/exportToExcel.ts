import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { categories, initialQuestions } from "../data/questions";
import { QuestionsState } from "../components/types";

export const exportToExcel = async (
  questions: QuestionsState,
  auditId: number
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Audyt");

  // --- Nagłówek ---
  const header: string[] = ["Pytanie", ...categories];
  const headerRow = ws.addRow(header);
  headerRow.height = 25;
  headerRow.eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1464F4" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // --- Wiersze pytań ---
  initialQuestions.forEach((q, qi) => {
    const row: string[] = [q.text];

    categories.forEach(cat => {
      const qData = questions[cat][qi];
      const ans = qData.answer;
      row.push(ans === true ? "✔" : ans === false ? "✖" : "");
    });

    const excelRow = ws.addRow(row);
    excelRow.height = 20;

    excelRow.eachCell((cell, colNumber) => {
      // ✔ / ✖ kolory
      if (cell.value === "✔") {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } };
      } else if (cell.value === "✖") {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
      }

      // Wyśrodkowanie
      if (colNumber === 1) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }

      // Obramowanie
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });
  });

  // --- Szerokości kolumn ---
  ws.columns = [
    { width: 60 },                   // Pytanie
    ...categories.map(() => ({ width: 10 })) // ✔ / ✖
  ];

  // --- Eksport w przeglądarce ---
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Zagadnienia-krytyczne-${auditId}.xlsx`);
};
