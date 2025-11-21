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

  // Dodajemy font
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
        resolve(canvas.toDataURL("image/jpeg", 0.5));
      };
      img.onerror = reject;
    });

  // --- PYTANIA I ZDJĘCIA W 2 KOLUMNACH (blok pytanie + komentarz + zdjęcia) ---
  const columnWidth = (pageWidth - 2 * margin - 10) / 2;
  const imageSpacing = 5;
  const maxImgWidth = (columnWidth - imageSpacing) * 0.95;
  const maxImgHeight = 140;

  let colY = [y, y];

  for (const cat of categories) {
    doc.setFontSize(16);
    doc.setTextColor(20, 60, 120);

    const catQuestions = questions[cat] || initialQuestions.map(q => ({ ...q }));
    if (catQuestions.length === 0) continue;

    // --- Obliczamy wysokość pierwszego pytania ---
    const firstQ = catQuestions[0];
    const firstQLines = doc.splitTextToSize(`• ${firstQ.text}`, columnWidth);
    let firstBlockHeight = firstQLines.length * 7 + 2;
    if (firstQ.note && firstQ.note.trim() !== "") {
      const noteLines = doc.splitTextToSize(`Uwaga: ${firstQ.note}`, columnWidth);
      firstBlockHeight += noteLines.length * 7 + 2;
    }
    const firstImages = imagesState[cat]?.[firstQ.id] || [];
    let tempImgHeight = 0;
    for (let r = 0; r < Math.ceil(firstImages.length / 2); r++) {
      let rowH = 0;
      for (let c = 0; c < 2; c++) {
        const idx = r * 2 + c;
        if (idx >= firstImages.length) break;
        try {
          const img = await loadImage(await imageToBase64(firstImages[idx]));
          let imgW = img.width * 0.264583;
          let imgH = img.height * 0.264583;
          const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH, 1);
          rowH = Math.max(rowH, imgH * scale);
        } catch {}
      }
      tempImgHeight += rowH + imageSpacing;
    }
    firstBlockHeight += tempImgHeight + 5;
    const headerHeight = 10;

    // --- Sprawdzamy, czy zmieści się nagłówek + pierwsze pytanie ---
    const currentY = Math.max(colY[0], colY[1]);
    if (currentY + headerHeight + firstBlockHeight > pageHeight - margin) {
      doc.addPage();
      colY = [margin, margin];
    }

    // --- Rysujemy nagłówek ---
    doc.text(`Linia: ${cat}`, margin, colY[0]);
    colY[0] += headerHeight;
    colY[1] += headerHeight;

    // --- Wstawiamy wszystkie pytania ---
    let colIndex = 0;
    for (const q of catQuestions) {
      const currentCol = colIndex % 2;
      let yPos = colY[currentCol];

      // Obliczamy wysokość całego bloku
      let blockHeight = 0;
      const qLines = doc.splitTextToSize(`• ${q.text}`, columnWidth);
      blockHeight += qLines.length * 7 + 2;
      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, columnWidth);
        blockHeight += noteLines.length * 7 + 2;
      }

      const qImages = imagesState[cat]?.[q.id] || [];
      let tempImgHeight = 0;
      for (let r = 0; r < Math.ceil(qImages.length / 2); r++) {
        let rowH = 0;
        for (let c = 0; c < 2; c++) {
          const idx = r * 2 + c;
          if (idx >= qImages.length) break;
          try {
            const img = await loadImage(await imageToBase64(qImages[idx]));
            let imgW = img.width * 0.264583;
            let imgH = img.height * 0.264583;
            const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH, 1);
            rowH = Math.max(rowH, imgH * scale);
          } catch {}
        }
        tempImgHeight += rowH + imageSpacing;
      }
      blockHeight += tempImgHeight + 5;

      // --- Jeśli nie mieści się na stronie, przenosimy cały blok ---
      if (yPos + blockHeight > pageHeight - margin) {
        doc.addPage();
        colY = [margin, margin];
        yPos = colY[currentCol];

        // Ponownie rysujemy nagłówek, jeśli pierwszy blok na nowej stronie
        if (colIndex === 0) {
          doc.text(`Linia: ${cat}`, margin, yPos);
          yPos += headerHeight;
          colY[currentCol] = yPos;
        }
      }

      // --- Rysujemy pytanie ---
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(qLines, margin + currentCol * (columnWidth + 10), yPos);
      yPos += qLines.length * 7 + 2;

      // --- Rysujemy komentarz ---
      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, columnWidth);
        doc.setTextColor(100, 100, 100);
        doc.text(noteLines, margin + currentCol * (columnWidth + 10), yPos);
        yPos += noteLines.length * 7 + 2;
        doc.setTextColor(0, 0, 0);
      }

      // --- Wstawiamy zdjęcia ---
      let imgY = yPos;
      for (let r = 0; r < Math.ceil(qImages.length / 2); r++) {
        let rowHeight = 0;
        for (let c = 0; c < 2; c++) {
          const idx = r * 2 + c;
          if (idx >= qImages.length) break;
          try {
            const base64 = await imageToBase64(qImages[idx]);
            const img = await loadImage(base64);
            let imgW = img.width * 0.264583;
            let imgH = img.height * 0.264583;
            const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH, 1);
            imgW *= scale;
            imgH *= scale;

            const imgX = margin + currentCol * (columnWidth + 10) + c * (maxImgWidth + imageSpacing);
            doc.addImage(base64, "JPEG", imgX, imgY, imgW, imgH);
            rowHeight = Math.max(rowHeight, imgH);
          } catch {}
        }
        imgY += rowHeight + imageSpacing;
      }

      colY[currentCol] = imgY + 5;
      colIndex++;
    }

    // odstęp po kategorii
    colY[0] += 10;
    colY[1] += 10;
  }

  const fileName = `Raport-Audytu-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
