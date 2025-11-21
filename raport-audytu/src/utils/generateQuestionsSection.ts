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
  const columnWidth = pageWidth - 2 * margin;
  const imageSpacing = 5;
  const maxImgWidth = columnWidth * 0.95;
  const maxImgHeight = 80;
  const headerHeight = 16;

  let yPos = startY;

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
    if (yPos + headerHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
    doc.text(`Linia: ${cat}`, margin, yPos);
    yPos += headerHeight;

    for (const q of catQuestions) {
      const qImages = imagesState[cat]?.[q.id] || [];

      // --- Obliczamy wysokość całego bloku pytania + komentarza + zdjęć ---
      const qLines = doc.splitTextToSize(`• ${q.text}`, columnWidth);
      let blockHeight = qLines.length * 7 + 2;

      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, columnWidth);
        blockHeight += noteLines.length * 7 + 2;
      }

      // Dodajemy wysokość wszystkich zdjęć
      for (const imgSrc of qImages) {
        try {
          const img = await loadImage(await imageToBase64(imgSrc));
          let imgW = img.width * 0.264583;
          let imgH = img.height * 0.264583;
          const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH, 1);
          blockHeight += imgH * scale + imageSpacing;
        } catch {}
      }
      blockHeight += 5; // mała przerwa pod pytaniem

      // --- Sprawdzamy czy blok mieści się na stronie ---
      if (yPos + blockHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
      }

      // --- Rysujemy pytanie ---
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(qLines, margin, yPos);
      yPos += qLines.length * 7 + 2;

      // --- Rysujemy komentarz ---
      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, columnWidth);
        doc.setTextColor(100, 100, 100);
        doc.text(noteLines, margin, yPos);
        yPos += noteLines.length * 7 + 2;
        doc.setTextColor(0, 0, 0);
      }

      // --- Rysujemy wszystkie zdjęcia ---
      for (const imgSrc of qImages) {
        try {
          const base64 = await imageToBase64(imgSrc);
          const img = await loadImage(base64);
          let imgW = img.width * 0.264583;
          let imgH = img.height * 0.264583;
          const scale = Math.min(maxImgWidth / imgW, maxImgHeight / imgH, 1);
          imgW *= scale;
          imgH *= scale;

          if (yPos + imgH > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
          }
          doc.addImage(base64, "JPEG", margin, yPos, imgW, imgH);
          yPos += imgH + imageSpacing;
        } catch {}
      }

      // --- Mała przerwa między pytaniami ---
      yPos += 5;
    }

    // --- Przerwa po kategorii ---
    yPos += 10;
  }
};
