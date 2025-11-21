import jsPDF from "jspdf";
import { categories, initialQuestions } from "../data/questions";

export const generateSummaryTable = (doc: jsPDF, questions: any) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = 20;
  const baseRowHeight = 18;
  const startX = margin;
  const colWidth = 45;

  // --- NAGŁÓWEK ---
  doc.setFontSize(18);
  doc.text("Raport Audytu", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(14);
  doc.text("Tabela zbiorcza", pageWidth / 2, y, { align: "center" });
  y += 10;

  // --- TABELA ZBIORCZA ---
  categories.forEach((cat, i) => {
    const centerX = startX + (i + 1) * colWidth + colWidth / 2;
    const centerY = y + baseRowHeight / 2 + 4;
    doc.setFont("Roboto", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 60, 120);
    doc.text(cat, centerX, centerY, { align: "center" });
    doc.setFont("Roboto", "normal");
    doc.setTextColor(0, 0, 0);
  });

  y += baseRowHeight;
  doc.line(startX, y, startX + (categories.length + 1) * colWidth, y);

  initialQuestions.forEach((q, qi) => {
    const wrappedQText = doc.splitTextToSize(q.text, colWidth - 4);
    const rowHeight = Math.max(baseRowHeight, wrappedQText.length * 7 + 4);
    doc.text(wrappedQText, startX + 2, y + 7);

    categories.forEach(cat => {
      const qData = questions[cat]?.[qi];
      let ansSymbol = "";
      if (qData?.answer === true) ansSymbol = "V";
      else if (qData?.answer === false) ansSymbol = "X";

      const centerX = startX + (categories.indexOf(cat) + 1) * colWidth + colWidth / 2;
      const centerY = y + rowHeight / 2 + 3;

      if (ansSymbol === "V") doc.setTextColor(0, 150, 0);
      else if (ansSymbol === "X") doc.setTextColor(200, 0, 0);
      else doc.setTextColor(0, 0, 0);

      const prevFont = doc.getFont().fontName;
      const prevFontStyle = doc.getFont().fontStyle;
      const prevFontSize = doc.getFontSize();

      doc.setFont("Roboto", "bold");
      doc.setFontSize(20);
      doc.text(ansSymbol, centerX, centerY, { align: "center" });

      doc.setFont(prevFont, prevFontStyle);
      doc.setFontSize(prevFontSize);
    });

    doc.setTextColor(0, 0, 0);
    y += rowHeight;
    doc.line(startX, y, startX + (categories.length + 1) * colWidth, y);
  });

  for (let i = 0; i <= categories.length + 1; i++) {
    const xPos = startX + i * colWidth;
    doc.line(xPos, 20 + baseRowHeight, xPos, y);
  }

  return y + 15; // zwraca pozycję Y po tabeli
};
