import jsPDF from "jspdf";
import { categories, initialQuestions } from "../data/questions";

export const generateQuestionsSection = async (
  doc: jsPDF,
  questions: any,
  imagesState: any,
  startY: number
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const columnWidth = (pageWidth - 2 * margin - 10) / 2;
  const imageSpacing = 5;
  const maxImgWidth = (columnWidth - imageSpacing) * 0.95;
  const maxImgHeight = 140;
  const headerHeight = 10;

  let colY = [startY, startY];
  let forcePageBreakNext = false;

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

  for (const cat of categories) {
    doc.setFontSize(16);
    doc.setTextColor(20, 60, 120);

    const catQuestions = questions[cat] || initialQuestions.map(q => ({ ...q }));
    if (catQuestions.length === 0) continue;

    // --- Nagłówek kategorii ---
    const currentY = Math.max(colY[0], colY[1]);
    if (currentY + headerHeight > pageHeight - margin) {
      doc.addPage();
      colY = [margin, margin];
    }
    doc.text(`Linia: ${cat}`, margin, colY[0]);
    colY[0] += headerHeight;
    colY[1] += headerHeight;

    let colIndex = 0;

    for (const q of catQuestions) {
      const qImages = imagesState[cat]?.[q.id] || [];

      // --- Jeśli poprzednie pytanie wymusiło nową stronę ---
      if (forcePageBreakNext) {
        doc.addPage();
        colY = [margin, margin]; // reset wysokości kolumn
        colIndex = 0; // zawsze lewa kolumna
        const yPosHeader = colY[0];
        doc.text(`Linia: ${cat}`, margin, yPosHeader);
        colY[0] += headerHeight;
        colY[1] += headerHeight;
        forcePageBreakNext = false;
      }

      const currentCol = colIndex % 2;
      let yPos = colY[currentCol];

      // --- Obliczamy wysokość bloku pytania + komentarza + zdjęć ---
      let blockHeight = 0;
      const qLines = doc.splitTextToSize(`• ${q.text}`, columnWidth);
      blockHeight += qLines.length * 7 + 2;

      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, columnWidth);
        blockHeight += noteLines.length * 7 + 2;
      }

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

      // --- Przenosimy blok na nową stronę jeśli nie mieści się ---
      if (yPos + blockHeight > pageHeight - margin) {
        doc.addPage();
        colY = [margin, margin];
        colIndex = 0;
        yPos = colY[0];
        doc.text(`Linia: ${cat}`, margin, yPos);
        yPos += headerHeight;
        colY[0] = yPos;
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

      // --- Jeśli pytanie ma >1 zdjęcia, następne pytanie zaczyna się od nowej strony i lewej kolumny ---
      if (qImages.length > 1) {
        forcePageBreakNext = true;
        colIndex = 0; // upewniamy się, że następne pytanie zaczyna się od lewej kolumny
      } else {
        colIndex++;
      }
    }

    colY[0] += 10;
    colY[1] += 10;
  }
};
