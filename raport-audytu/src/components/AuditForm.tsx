import React, { useState } from 'react';
import jsPDF from 'jspdf';
import font from '../fonts/Roboto-Regular-normal';

interface Question {
  id: number;
  text: string;
  answer?: boolean;
  note?: string;
  images?: string[];
}

const categories = ['CMG.2', 'CMG.3', 'LWN', 'CMG.5', 'CMG.6'];

const initialQuestions: Question[] = [
  { id: 1, text: 'Zaleganie ścinek pod piłą', answer: undefined, note: '', images: [] },
  { id: 2, text: 'Zapylenie maszyn produkcja', answer: undefined, note: '', images: [] },
  { id: 3, text: 'Zapylenie maszyn UR', answer: undefined, note: '', images: [] },
  { id: 4, text: 'Nagromadzenie logów odpadowych w maszynie', answer: undefined, note: '', images: [] },
  { id: 5, text: 'Strefy p.poż produkcja', answer: undefined, note: '', images: [] },
  { id: 6, text: 'Strefy p.poż UR', answer: undefined, note: '', images: [] },
  { id: 7, text: 'Prowizorki na maszynie', answer: undefined, note: '', images: [] },
  { id: 8, text: 'Zalegający brud', answer: undefined, note: '', images: [] },
];

const AuditForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('CMG.2');
  const [questions, setQuestions] = useState<Record<string, Question[]>>(
    Object.fromEntries(categories.map(c => [c, initialQuestions.map(q => ({ ...q }))]))
  );

  const setAnswer = (cat: string, id: number, value: boolean) => {
    setQuestions(prev => ({
      ...prev,
      [cat]: prev[cat].map(q => (q.id === id ? { ...q, answer: value } : q)),
    }));
  };

  const updateNote = (cat: string, id: number, text: string) => {
    setQuestions(prev => ({
      ...prev,
      [cat]: prev[cat].map(q => (q.id === id ? { ...q, note: text } : q)),
    }));
  };

  const addImageToQuestion = (cat: string, id: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setQuestions(prev => ({
        ...prev,
        [cat]: prev[cat].map(q =>
          q.id === id ? { ...q, images: [...(q.images || []), reader.result as string] } : q
        ),
      }));
    };
    reader.readAsDataURL(file);
  };

  const generatePDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let y = 20;

    doc.addFileToVFS('Roboto-Regular.ttf', font);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');

    // --- Nagłówek ---
    doc.setFontSize(18);
    doc.text('Raport Audytu', pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(14);
    doc.text('Tabela zbiorcza', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // --- Tabela główna ---
    const startX = margin;
    const colWidth = 45;
    const baseRowHeight = 12;

    doc.setFontSize(12);
    doc.text('Pytanie', startX, y);
    categories.forEach((cat, i) => {
      doc.text(cat, startX + (i + 1) * colWidth + colWidth / 2, y, { align: 'center' });
    });
    y += baseRowHeight;
    doc.line(startX, y, startX + (categories.length + 1) * colWidth, y);

    initialQuestions.forEach((q, qi) => {
      const wrappedQText = doc.splitTextToSize(q.text, colWidth - 4);
      const rowHeight = Math.max(baseRowHeight, wrappedQText.length * 6 + 4);

      doc.text(wrappedQText, startX + 2, y + 7);

      categories.forEach((cat, ci) => {
        const qData = questions[cat][qi];
        const ansText = qData.answer === true ? 'TAK' : qData.answer === false ? 'NIE' : '';
        const centerX = startX + (ci + 1) * colWidth + colWidth / 2;

        if (ansText === 'TAK') doc.setTextColor(0, 150, 0);
        else if (ansText === 'NIE') doc.setTextColor(200, 0, 0);
        else doc.setTextColor(0, 0, 0);

        doc.text(ansText, centerX, y + 7, { align: 'center' });
      });

      doc.setTextColor(0, 0, 0);
      y += rowHeight;
      doc.line(startX, y, startX + (categories.length + 1) * colWidth, y);
    });

    for (let i = 0; i <= categories.length + 1; i++) {
      const xPos = startX + i * colWidth;
      doc.line(xPos, 20 + baseRowHeight, xPos, y);
    }

    // --- Szczegóły pytań poniżej tabeli ---
    y += 15;
    doc.setFontSize(14);
    doc.text('Szczegóły pytań', pageWidth / 2, y, { align: 'center' });
    y += 8;

    for (const cat of categories) {
      doc.setFontSize(16);
      doc.setTextColor(30, 60, 100);
      if (y + 8 > pageHeight - margin) { doc.addPage(); y = margin; }
      doc.text(`Zakład: ${cat}`, margin, y);
      y += 8;

      let counter = 1;
      for (const q of questions[cat]) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        // 1️⃣ Pytanie
        const questionLines = doc.splitTextToSize(`${counter}. Pytanie: ${q.text}`, pageWidth - 2 * margin);
        for (const line of questionLines) {
          if (y + 6 > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin, y);
          y += 6;
        }

        // 2️⃣ Odpowiedź
        const ansText = q.answer === true ? 'TAK' : q.answer === false ? 'NIE' : 'BRAK';
        if (y + 6 > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.text(`   Odpowiedź: ${ansText}`, margin, y);
        y += 6;

        // 3️⃣ Uwagi
        if (y + 6 > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.text(`   Uwagi:`, margin, y);
        y += 6;
        const noteLines = doc.splitTextToSize(q.note || '-', pageWidth - 2 * margin);
        for (const line of noteLines) {
          if (y + 6 > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin + 5, y);
          y += 6;
        }

        // 4️⃣ Zdjęcia
        if (q.images && q.images.length > 0) {
          for (const img of q.images) {
            if (y + 55 > pageHeight - margin) { doc.addPage(); y = margin; }
            doc.text(`   Zdjęcia:`, margin, y);
            y += 5;
            doc.addImage(img, 'JPEG', margin + 5, y, 50, 50);
            y += 55;
          }
        } else {
          if (y + 6 > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(`   Zdjęcia: brak zdjęcia`, margin, y);
          y += 6;
        }

        y += 4;
        counter++;
      }

      y += 8;
    }

    doc.save(`Raport-Audytu-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Audyt Maszyn</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: activeTab === cat ? '2px solid #1976d2' : '1px solid #ccc',
              backgroundColor: activeTab === cat ? '#e3f2fd' : 'white',
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {questions[activeTab].map(q => (
        <div key={q.id} style={{ marginBottom: 25, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
          <p style={{ fontSize: 18 }}>{q.text}</p>
          <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
            <label>
              <input type="radio" checked={q.answer === true} onChange={() => setAnswer(activeTab, q.id, true)} /> Tak
            </label>
            <label>
              <input type="radio" checked={q.answer === false} onChange={() => setAnswer(activeTab, q.id, false)} /> Nie
            </label>
          </div>
          <textarea
            placeholder="Wpisz własną uwagę..."
            value={q.note}
            onChange={e => updateNote(activeTab, q.id, e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc', marginBottom: 8 }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={e => e.target.files && addImageToQuestion(activeTab, q.id, e.target.files[0])}
          />
          {q.images && q.images.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
              {q.images.map((img, idx) => (
                <img key={idx} src={img} alt={`q${q.id}-${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', border: '1px solid #ccc' }} />
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={generatePDF}
        style={{ padding: '10px 20px', fontSize: 16, backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: 5, marginTop: 20 }}
      >
        GENERUJ PDF
      </button>
    </div>
  );
};

export default AuditForm;
