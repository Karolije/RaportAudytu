import ExcelJS, { CellHyperlinkValue } from "exceljs";
import { saveAs } from "file-saver";
import { categories, initialQuestions } from "../data/questions";
import { QuestionsState, ImagesState } from "../components/types";

export const exportToExcel = async (
  questions: QuestionsState,
  imagesState: ImagesState,
  auditId: number
) => {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Audyt");

  const maxImages = Math.max(
    ...categories.map(cat =>
      Math.max(...questions[cat].map(q => q.images?.length || 0))
    )
  );

  // --- Nagłówek ---
  const header: (string | CellHyperlinkValue)[] = ["Pytanie", ...categories];
  for (let i = 1; i <= maxImages; i++) header.push(`📷 ${i}`);
  const headerRow = ws.addRow(header);
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
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
    const row: (string | CellHyperlinkValue)[] = [q.text];

    categories.forEach(cat => {
      const qData = questions[cat][qi];
      const ans = qData.answer;
      row.push(ans === true ? "✔" : ans === false ? "✖" : "");
    });

    for (let imgIndex = 0; imgIndex < maxImages; imgIndex++) {
      const url = questions[categories[0]][qi].images?.[imgIndex] || "";
      if (url) {
        row.push({ text: "📷", hyperlink: url });
      } else {
        row.push("");
      }
    }

    const excelRow = ws.addRow(row);
    excelRow.height = 20;

    // Stylowanie odpowiedzi i zdjęć
    excelRow.eachCell((cell, colNumber) => {
      // ✔ i ✖
      if (cell.value === "✔") {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00B050" } };
      } else if (cell.value === "✖") {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
      }

      // Wycentrowanie
      cell.alignment = { horizontal: "center", vertical: "middle" };

      // Obramowanie
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };

      // Hiperłącza
      if (typeof cell.value === "object" && cell.value !== null && 'hyperlink' in cell.value) {
        cell.font = { color: { argb: "FF1464F4" }, underline: true };
      }

      // Pytanie
      if (colNumber === 1) {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  });

  // --- Szerokości kolumn ---
  ws.columns = [
    { width: 60 },                   // Pytanie
    ...categories.map(() => ({ width: 10 })), // ✔ / ✖
    ...Array(maxImages).fill({ width: 12 })   // Zdjęcia
  ];

  // --- Eksport w przeglądarce ---
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Raport-Audytu-${auditId}.xlsx`);
};
