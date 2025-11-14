import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import font from "../fonts/Roboto-Regular-normal";

interface Question {
  id: number;
  text: string;
  answer?: boolean;
  note?: string;
}

interface QuestionWithImages extends Question {
  images?: string[];
}

const categories = ["CMG.2", "CMG.3", "LWN", "CMG.5", "CMG.6"];

const initialQuestions: Question[] = [
  { id: 1, text: "Zaleganie ścinek pod piłą" },
  { id: 2, text: "Zapylenie maszyn produkcja" },
  { id: 3, text: "Zapylenie maszyn UR" },
  { id: 4, text: "Nagromadzenie logów odpadowych w maszynie" },
  { id: 5, text: "Strefy p.poż produkcja" },
  { id: 6, text: "Strefy p.poż UR" },
  { id: 7, text: "Prowizorki na maszynie" },
  { id: 8, text: "Zalegający brud" },
];

const LOCAL_STORAGE_KEY = "auditFormData";

const loadQuestions = (): Record<string, Question[]> => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
      return parsed.questions;
    }
  }

  return Object.fromEntries(
    categories.map((cat) => [cat, initialQuestions.map((q) => ({ ...q }))])
  );
};

const saveQuestions = (questions: Record<string, Question[]>) => {
  const smallQuestions = Object.fromEntries(
    Object.entries(questions).map(([cat, qs]) => [
      cat,
      qs.map((q) => ({ id: q.id, answer: q.answer, note: q.note })),
    ])
  );

  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({ timestamp: Date.now(), questions: smallQuestions })
  );
};

const AuditForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("CMG.2");
  const [questions, setQuestions] = useState<Record<string, Question[]>>(loadQuestions());

  // 🔥 Poprawione — KAŻDA kategoria ma osobny obiekt zdjęć
  const [imagesState, setImagesState] = useState<
    Record<string, Record<number, string[]>>
  >(() =>
    categories.reduce((acc, cat) => {
      acc[cat] = {};
      return acc;
    }, {} as Record<string, Record<number, string[]>>)
  );

  useEffect(() => {
    saveQuestions(questions);
  }, [questions]);

  const setAnswer = (cat: string, id: number, value: boolean) => {
    setQuestions((prev) => ({
      ...prev,
      [cat]: prev[cat].map((q) => (q.id === id ? { ...q, answer: value } : q)),
    }));
  };

  const updateNote = (cat: string, id: number, text: string) => {
    setQuestions((prev) => ({
      ...prev,
      [cat]: prev[cat].map((q) => (q.id === id ? { ...q, note: text } : q)),
    }));
  };

  // 🔥 POPRAWIONE — żadnego dzielenia referencji, pełna izolacja zdjęć
  const addImageToQuestion = (cat: string, id: number, files: FileList) => {
    const newImages: string[] = [];

    const readFile = (index: number) => {
      if (index >= files.length) {
        setImagesState((prev) => {
          const categoryCopy = { ...prev[cat] };
          const oldImages = categoryCopy[id] ? [...categoryCopy[id]] : [];

          categoryCopy[id] = [...oldImages, ...newImages];

          return {
            ...prev,
            [cat]: categoryCopy,
          };
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        newImages.push(reader.result as string);
        readFile(index + 1);
      };
      reader.readAsDataURL(files[index]);
    };

    readFile(0);
  };

  const clearForm = () => {
    const clearedQuestions = Object.fromEntries(
      categories.map((c) => [
        c,
        initialQuestions.map((q) => ({
          ...q,
          answer: undefined,
          note: "", // <-- czyszczenie uwag
        })),
      ])
    );
  
    const clearedImages = categories.reduce((acc, c) => {
      acc[c] = {};
      return acc;
    }, {} as Record<string, Record<number, string[]>>);
  
    setQuestions(clearedQuestions);
    setImagesState(clearedImages);
    saveQuestions(clearedQuestions);
  };
  

  const generatePDF = () => {
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let y = 20;
  
    doc.addFileToVFS("Roboto-Regular.ttf", font);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");
  
    // --- Tytuł ---
    doc.setFontSize(18);
    doc.text("Raport Audytu", pageWidth / 2, y, { align: "center" });
    y += 10;
  
    doc.setFontSize(14);
    doc.text("Tabela zbiorcza", pageWidth / 2, y, { align: "center" });
    y += 10;
  
    const startX = margin;
    const colWidth = 45;
    const baseRowHeight = 18;
  
    // --- Nagłówki tabeli ---
    doc.setFontSize(12);
    doc.text("Pytanie", startX, y);
    categories.forEach((cat, i) => {
      doc.text(cat, startX + (i + 1) * colWidth + colWidth / 2, y, { align: "center" });
    });
    y += baseRowHeight;
    doc.line(startX, y, startX + (categories.length + 1) * colWidth, y);
  
    // --- Wiersze tabeli ---
    initialQuestions.forEach((q, qi) => {
      const wrappedQText = doc.splitTextToSize(q.text, colWidth - 4);
      const rowHeight = Math.max(baseRowHeight, wrappedQText.length * 7 + 4);
      doc.text(wrappedQText, startX + 2, y + 7);
  
      categories.forEach((cat, ci) => {
        const qData = questions[cat][qi];
        const ansText = qData.answer === true ? "TAK" : qData.answer === false ? "NIE" : "";
        const centerX = startX + (ci + 1) * colWidth + colWidth / 2;
  
        if (ansText === "TAK") doc.setTextColor(0, 150, 0);
        else if (ansText === "NIE") doc.setTextColor(200, 0, 0);
        else doc.setTextColor(0, 0, 0);
  
        doc.text(ansText, centerX, y + 7, { align: "center" });
      });
  
      doc.setTextColor(0, 0, 0);
      y += rowHeight;
      doc.line(startX, y, startX + (categories.length + 1) * colWidth, y);
    });
  
    for (let i = 0; i <= categories.length + 1; i++) {
      const xPos = startX + i * colWidth;
      doc.line(xPos, 20 + baseRowHeight, xPos, y);
    }
  
    // --- Zdjęcia i uwagi ---
    y += 15;
    const imageWidth = (pageWidth - 3 * margin) / 2; // 2 kolumny
    const imageHeight = 60;
  
    for (const cat of categories) {
      if (y + 20 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
  
      doc.setFontSize(16);
      doc.setTextColor(20, 60, 120);
      doc.text(`Zakład: ${cat}`, margin, y);
      y += 10;
  
      const catQuestions = questions[cat] || [];
      for (const q of catQuestions) {
        // Nazwa pytania
        const qLines = doc.splitTextToSize(`• ${q.text}`, pageWidth - 2 * margin);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(qLines, margin, y);
        y += qLines.length * 7 + 2;
  
        // Własna uwaga
        if (q.note && q.note.trim() !== "") {
          const noteLines = doc.splitTextToSize(`Uwaga: ${q.note}`, pageWidth - 2 * margin);
          doc.setTextColor(100, 100, 100);
          doc.text(noteLines, margin, y);
          y += noteLines.length * 7 + 2;
          doc.setTextColor(0, 0, 0);
        }
  
        // Zdjęcia w 2 kolumnach
        const qImages = imagesState[cat]?.[q.id] || [];
        if (qImages.length > 0) {
          let x = margin;
          let col = 0;
          for (const img of qImages) {
            if (y + imageHeight > pageHeight - margin) {
              doc.addPage();
              y = margin;
            }
  
            doc.addImage(img, "JPEG", x, y, imageWidth, imageHeight);
            col++;
            if (col % 2 === 0) {
              y += imageHeight + 5;
              x = margin;
            } else {
              x += imageWidth + margin;
            }
          }
          if (col % 2 !== 0) y += imageHeight + 5;
        } else {
          doc.text("(Brak zdjęcia)", margin, y);
          y += 12;
        }
  
        y += 5;
      }
      y += 10;
    }
  
    doc.save(`Raport-Audytu-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  
  
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData: any[][] = [];

    wsData.push(["Pytanie", ...categories]);

    initialQuestions.forEach((q, qi) => {
      const row: any[] = [q.text];
      categories.forEach((cat) => {
        const qData = questions[cat][qi];
        const ansText =
          qData.answer === true ? "TAK" : qData.answer === false ? "NIE" : "";
        row.push(ansText);
      });
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Audyt");
    XLSX.writeFile(wb, `Raport-Audytu-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>Audyt Maszyn</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: activeTab === cat ? "2px solid #1976d2" : "1px solid #ccc",
              backgroundColor: activeTab === cat ? "#e3f2fd" : "white",
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {questions[activeTab].map((q) => (
        <div
          key={q.id}
          style={{
            marginBottom: 25,
            borderBottom: "1px solid #ccc",
            paddingBottom: 10,
          }}
        >
          <p style={{ fontSize: 18 }}>{q.text}</p>

          <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
            <label>
              <input
                type="radio"
                checked={q.answer === true}
                onChange={() => setAnswer(activeTab, q.id, true)}
              />{" "}
              Tak
            </label>
            <label>
              <input
                type="radio"
                checked={q.answer === false}
                onChange={() => setAnswer(activeTab, q.id, false)}
              />{" "}
              Nie
            </label>
          </div>

          <textarea
            placeholder="Wpisz własną uwagę..."
            value={q.note}
            onChange={(e) => updateNote(activeTab, q.id, e.target.value)}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 5,
              border: "1px solid #ccc",
              marginBottom: 8,
            }}
          />

{/* --- INPUT Z WŁASNĄ NAZWĄ PLIKU --- */}
<div style={{ marginBottom: 6 }}>
  <label
    style={{
      display: "inline-block",
      padding: "6px 12px",
      background: "#eee",
      borderRadius: 4,
      cursor: "pointer",
      border: "1px solid #ccc",
    }}
  >
    Wybierz zdjęcie
    <input
      type="file"
      accept="image/*"
      multiple
      style={{ display: "none" }}
      onChange={(e) => {
        if (e.target.files) {
          addImageToQuestion(activeTab, q.id, e.target.files);
          e.target.value = ""; // reset inputa, ale TO NIE ZMIENIA TEGO CO MY WYŚWIETLAMY
        }
      }}
    />
  </label>

  {/* WYŚWIETLANIE NAZWY TYLKO DLA TEGO PYTANIA */}
  <span style={{ marginLeft: 10, fontStyle: "italic" }}>
    {imagesState[activeTab][q.id] &&
    imagesState[activeTab][q.id].length > 0
      ? `Dodano: ${imagesState[activeTab][q.id].length} plik`
      : "Nie dodano pliku"}
  </span>
</div>

{/* MINIATURKI */}
{imagesState[activeTab][q.id] &&
  imagesState[activeTab][q.id].length > 0 && (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginTop: 5,
        flexWrap: "wrap",
      }}
    >
      {imagesState[activeTab][q.id].map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`q${q.id}-${idx}`}
          style={{
            width: 80,
            height: 80,
            objectFit: "cover",
            border: "1px solid #ccc",
          }}
        />
      ))}
    </div>
  )}



       
        </div>
      ))}

      <div style={{ display: "flex", gap: 15, marginTop: 30 }}>
        <button
          onClick={generatePDF}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 5,
          }}
        >
          GENERUJ PDF
        </button>

        <button
          onClick={exportToExcel}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: 5,
          }}
        >
          EKSPORTUJ EXCEL
        </button>

        <button
          onClick={clearForm}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: 5,
          }}
        >
          WYCZYŚĆ FORMULARZ
        </button>
      </div>
    </div>
  );
};

export default AuditForm;
