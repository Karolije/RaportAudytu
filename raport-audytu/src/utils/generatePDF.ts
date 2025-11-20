// generatePDF.ts
import jsPDF from "jspdf";
import font from "../fonts/Roboto-Regular-normal";
import { categories, initialQuestions } from "../data/questions";

export const generatePDF = async (questions: any, imagesState: any) => {
  const doc = new jsPDF("l", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let y = 20;

  doc.addFileToVFS("Roboto-Regular.ttf", font);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  // --- NAGŁÓWEK ---
  doc.setFontSize(18);
  doc.text("Raport Audytu", pageWidth / 2, y, { align: "center" });
  y += 10;
  doc.setFontSize(14);
  doc.text("Tabela zbiorcza", pageWidth / 2, y, { align: "center" });
  y += 10;

  // --- TABELA ZBIORCZA ---
  const startX = margin;
  const colWidth = 45;
  const baseRowHeight = 18;

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
      if (qData?.answer === true) ansSymbol = "✔";
      else if (qData?.answer === false) ansSymbol = "✖";

      const centerX = startX + (categories.indexOf(cat) + 1) * colWidth + colWidth / 2;
      const centerY = y + rowHeight / 2 + 3;

      if (ansSymbol === "✔") doc.setTextColor(0, 150, 0);
      else if (ansSymbol === "✖") doc.setTextColor(200, 0, 0);
      else doc.setTextColor(0, 0, 0);

      const prevFont = doc.getFont().fontName;
      const prevFontStyle = doc.getFont().fontStyle;
      const prevFontSize = doc.getFontSize();

      doc.setFont("Roboto", "bold");
      doc.setFontSize(16);
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

  y += 15;

  // --- FUNKCJE POMOCNICZE ---
  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

  const imageToBase64 = async (url: string) =>
    new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Brak kontekstu canvas");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
    });

  // --- 2 KOLUMNY Z POMIAROWĄ WYSOKOŚCIĄ ---
  const fixedHeight = 90; // wysokość na każde pytanie + zdjęcia
  const colWidth2 = (pageWidth - 2 * margin) / 2;
  let yLeft = y;
  let yRight = y;

  for (const cat of categories) {
    doc.setFontSize(16);
    doc.setTextColor(20, 60, 120);
    if (yLeft + fixedHeight > pageHeight - margin && yRight + fixedHeight > pageHeight - margin) {
      doc.addPage();
      yLeft = margin;
      yRight = margin;
    }
    doc.text(`Zakład: ${cat}`, margin, yLeft);
    yLeft += 10;

    const catQuestions = questions[cat] || initialQuestions.map(q => ({ ...q }));
    let colIndex = 0;

    for (const q of catQuestions) {
      const xPos = margin + colIndex * colWidth2;
      const yPos = colIndex === 0 ? yLeft : yRight;
      let usedHeight = 0;

      const qLines = doc.splitTextToSize(`• ${q.text}`, colWidth2 - 5);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(qLines, xPos, yPos);
      usedHeight += qLines.length * 7 + 2;

      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, colWidth2 - 5);
        doc.setTextColor(100, 100, 100);
        doc.text(noteLines, xPos, yPos + usedHeight);
        usedHeight += noteLines.length * 7 + 2;
        doc.setTextColor(0, 0, 0);
      }

      const qImages = imagesState[cat]?.[q.id] || [];
      let remainingHeight = fixedHeight - usedHeight;
      for (const imgSrc of qImages) {
        try {
          const base64 = await imageToBase64(imgSrc);
          if (!base64) continue;
          const img = await loadImage(base64);
          let imgWidthMm = img.width * 0.264583;
          let imgHeightMm = img.height * 0.264583;

          const maxWidth = colWidth2 - 5;
          const maxHeight = remainingHeight - 5;
          const scale = Math.min(maxWidth / imgWidthMm, maxHeight / imgHeightMm, 1);
          imgWidthMm *= scale;
          imgHeightMm *= scale;

          if (yPos + imgHeightMm > pageHeight - margin) {
            doc.addPage();
            usedHeight = 0;
          }

          doc.addImage(base64, "JPEG", xPos, yPos + usedHeight, imgWidthMm, imgHeightMm);
          usedHeight += imgHeightMm + 3;
          remainingHeight = fixedHeight - usedHeight;
        } catch {}
      }

      if (qImages.length === 0) usedHeight += 12;

      if (colIndex === 0) yLeft += fixedHeight;
      else yRight += fixedHeight;

      colIndex = colIndex === 0 ? 1 : 0;
    }

    y = Math.max(yLeft, yRight) + 10;
  }

  const fileName = `Raport-Audytu-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
