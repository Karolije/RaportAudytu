import React, { useState } from 'react';
import jsPDF from 'jspdf';
import font from '../fonts/Roboto-Regular-normal'; // Base64 czcionki UTF-8

interface Question {
  id: number;
  text: string;
  answer?: boolean;
  note?: string;
  images?: string[];
}

const AuditForm: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: 'Czy sprzęt działa prawidłowo?', answer: undefined, note: '', images: [] },
    { id: 2, text: 'Czy miejsce pracy jest czyste?', answer: undefined, note: '', images: [] },
    { id: 3, text: 'Czy dokumentacja jest kompletna?', answer: undefined, note: '', images: [] },
  ]);

  const setAnswer = (id: number, value: boolean) => {
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, answer: value } : q)));
  };

  const updateNote = (id: number, text: string) => {
    setQuestions(prev => prev.map(q => (q.id === id ? { ...q, note: text } : q)));
  };

  const addPhoto = (id: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const reader = new FileReader();
        reader.onload = ev => {
          const base64 = ev.target?.result as string;
          setQuestions(prev =>
            prev.map(q => (q.id === id ? { ...q, images: [...(q.images || []), base64] } : q))
          );
        };
        reader.readAsDataURL(target.files[0]);
      }
    };
    input.click();
  };

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // dodanie czcionki UTF-8
    doc.addFileToVFS('Roboto-Regular.ttf', font);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');

    let y = 15;

    // Nagłówek
    doc.setFontSize(24);
    doc.text('Raport Audytu', 105, y, { align: 'center' });
    y += 15;
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 105, y, { align: 'center' });
    y += 15;

    questions.forEach((q, idx) => {
      if (y > 250) { doc.addPage(); y = 15; }

      // Pytanie
      doc.setFontSize(14);
      doc.text(`${idx + 1}. ${q.text}`, 10, y);
      y += 7;

      // Odpowiedź
      const answerText = q.answer === true ? 'Tak' : q.answer === false ? 'Nie' : 'Brak odpowiedzi';
      doc.setFontSize(12);
      doc.text(`Odpowiedź: ${answerText}`, 12, y);
      y += 7;

      // Uwagi
      if (q.note) {
        doc.text(`Uwagi: ${q.note}`, 12, y);
        y += 7;
      }

      // Zdjęcia – duże i estetycznie ułożone
      q.images?.forEach(img => {
        if (!img) return;
        if (y + 90 > 297) { doc.addPage(); y = 15; }
        doc.addImage(img, 'JPEG', 15, y, 180, 90);
        y += 95; // odstęp po zdjęciu
      });

      // Linia oddzielająca pytania
      doc.setDrawColor(200);
      doc.setLineWidth(0.3);
      doc.line(10, y, 200, y);
      y += 7;
    });

    doc.save(`Raport-Audytu-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Raport Audytu</h1>
      {questions.map(q => (
        <div key={q.id} style={{ marginBottom: 30, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
          <p style={{ fontSize: 18 }}>{q.text}</p>
          <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
            <label><input type="radio" checked={q.answer === true} onChange={() => setAnswer(q.id, true)} /> Tak</label>
            <label><input type="radio" checked={q.answer === false} onChange={() => setAnswer(q.id, false)} /> Nie</label>
          </div>
          <textarea
            placeholder="Wpisz własną uwagę..."
            value={q.note}
            onChange={e => updateNote(q.id, e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc' }}
          />
          <br />
          <button onClick={() => addPhoto(q.id)} style={{ marginTop: 8 }}>Dodaj zdjęcie</button>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            {q.images?.map((img, i) => (
              <img key={i} src={img} alt="zdjęcie" style={{ width: 150, height: 'auto', borderRadius: 5 }} />
            ))}
          </div>
        </div>
      ))}
      <button onClick={generatePDF} style={{ padding: '10px 20px', fontSize: 16, backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: 5 }}>
        GENERUJ PDF
      </button>
    </div>
  );
};

export default AuditForm;
