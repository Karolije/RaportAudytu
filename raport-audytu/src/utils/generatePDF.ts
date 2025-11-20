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

  // dodaj font
  doc.addFileToVFS("Roboto-Regular.ttf", font);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  // nagłówek
  doc.setFontSize(18);
  doc.text("Raport Audytu", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(14);
  doc.text("Tabela zbiorcza", pageWidth / 2, y, { align: "center" });
  y += 10;

  // tabela odpowiedzi
  const startX = margin;
  const colWidth = 45;
  const baseRowHeight = 18;


 categories.forEach((cat, i) => {
  const centerX = startX + (i + 1) * colWidth + colWidth / 2;
  const centerY = y + baseRowHeight / 2 + 4; // +4 dla wizualnego dopasowania

  doc.setFont("Roboto", "bold");  // pogrubienie nagłówka
  doc.setFontSize(12);
  doc.setTextColor(20, 60, 120);
  doc.text(cat, centerX, centerY, { align: "center" });

  // przywracamy normalny font jeśli potrzebne
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

  // pionowe wyśrodkowanie
  const centerY = y + rowHeight / 2 + 3; // +3 dla wizualnego dopasowania

  // kolor
  if (ansSymbol === "V") doc.setTextColor(0, 150, 0);
  else if (ansSymbol === "X") doc.setTextColor(200, 0, 0);
  else doc.setTextColor(0, 0, 0);

  // zapisujemy poprzedni font i rozmiar
  const prevFont = doc.getFont().fontName;
  const prevFontStyle = doc.getFont().fontStyle;
  const prevFontSize = doc.getFontSize();

  // ustawiamy pogrubienie i rozmiar
  doc.setFont("Roboto", "bold");
  doc.setFontSize(16);
  doc.text(ansSymbol, centerX, centerY, { align: "center" });

  // przywracamy poprzednie ustawienia
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

  // funkcja do wczytania obrazka jako Promise
  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

  // sekcja pytań z obrazkami
  for (const cat of categories) {
    if (y + 20 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setFontSize(16);
    doc.setTextColor(20, 60, 120);
    doc.text(`Zakład: ${cat}`, margin, y);
    y += 10;

    const catQuestions = questions[cat] || initialQuestions.map(q => ({ ...q }));

    for (const q of catQuestions) {
      const qLines = doc.splitTextToSize(`• ${q.text}`, pageWidth - 2 * margin);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(qLines, margin, y);
      y += qLines.length * 7 + 2;

      if (q.note && q.note.trim() !== "") {
        const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, pageWidth - 2 * margin);
        doc.setTextColor(100, 100, 100);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 7 + 2;
        doc.setTextColor(0, 0, 0);
      }

      const qImages = imagesState[cat]?.[q.id] || [];
      if (qImages.length > 0) {
        for (const imgSrc of qImages) {
          try {
            const img = await loadImage(imgSrc);
            let imgWidthMm = img.width * 0.264583;
            let imgHeightMm = img.height * 0.264583;

            // skalowanie jeśli za duży obrazek
            if (imgWidthMm > pageWidth - 2 * margin) {
              const scale = (pageWidth - 2 * margin) / imgWidthMm;
              imgWidthMm *= scale;
              imgHeightMm *= scale;
            }

            if (y + imgHeightMm > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }

            const imgType = imgSrc.startsWith("data:image/png") ? "PNG" : "JPEG";
            doc.addImage(imgSrc, imgType, margin, y, imgWidthMm, imgHeightMm);
            y += imgHeightMm + 5;
          } catch (err) {
            console.error("Błąd ładowania obrazka:", err);
          }
        }
      } else {
        doc.text("(Brak zdjęcia)", margin, y);
        y += 12;
      }

      y += 5;
    }

    y += 10;
  }

  const fileName = `Raport-Audytu-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
