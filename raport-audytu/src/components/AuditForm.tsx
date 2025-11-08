// src/components/AuditForm.tsx
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

interface Question {
  id: number;
  text: string;
  answer: boolean | null;
  note: string;
  images: string[]; // base64
}

const initialQuestions: Question[] = [
  { id: 1, text: 'Czy dokumentacja jest kompletna?', answer: null, note: '', images: [] },
  { id: 2, text: 'Czy sprzęt działa prawidłowo?', answer: null, note: '', images: [] },
  { id: 3, text: 'Czy miejsce pracy jest czyste?', answer: null, note: '', images: [] },
];

export const AuditForm: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  const setAnswer = (id: number, value: boolean) => {
    setQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, answer: value } : q))
    );
  };

  const updateNote = (id: number, text: string) => {
    setQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, note: text } : q))
    );
  };

  const addImage = (id: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setQuestions(prev =>
        prev.map(q => (q.id === id ? { ...q, images: [...q.images, base64] } : q))
      );
    };
    reader.readAsDataURL(file);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let y = 10;

    questions.forEach(q => {
      doc.setFontSize(14);
      doc.text(q.text, 10, y);
      y += 7;
      doc.setFontSize(12);
      doc.text('Odpowiedź: ' + (q.answer === true ? 'Tak' : q.answer === false ? 'Nie' : 'Brak'), 10, y);
      y += 7;
      if (q.note) {
        doc.text('Uwagi: ' + q.note, 10, y);
        y += 7;
      }
      q.images.forEach(img => {
        doc.addImage(img, 'JPEG', 10, y, 50, 50);
        y += 55;
      });
      y += 5;
      if (y > 250) doc.addPage() && (y = 10); // nowa strona jeśli koniec strony
    });

    doc.save('raport.pdf');
  };

  return (
    <div style={{ padding: 20 }}>
      {questions.map(q => (
        <div key={q.id} style={{ marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
          <p>{q.text}</p>
          <div>
            <button onClick={() => setAnswer(q.id, true)} style={{ marginRight: 10 }}>
              Tak {q.answer === true && '✓'}
            </button>
            <button onClick={() => setAnswer(q.id, false)}>
              Nie {q.answer === false && '✓'}
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <textarea
              placeholder="Uwagi..."
              value={q.note}
              onChange={e => updateNote(q.id, e.target.value)}
              style={{ width: '100%', minHeight: 50 }}
            />
          </div>
          <div style={{ marginTop: 10 }}>
  <input
    type="file"
    accept="image/*"
    capture="environment" // otworzy tylny aparat na telefonie
    onChange={e => e.target.files && addImage(q.id, e.target.files[0])}
    style={{ display: 'none' }}
    id={`file-input-${q.id}`}
  />
  <label htmlFor={`file-input-${q.id}`} style={{ cursor: 'pointer', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', borderRadius: 5 }}>
    Dodaj zdjęcie
  </label>
</div>

          <div style={{ display: 'flex', marginTop: 10, gap: 10 }}>
            {q.images.map((img, idx) => (
              <img key={idx} src={img} alt="Zdjęcie" style={{ width: 80, height: 80, objectFit: 'cover' }} />
            ))}
          </div>
        </div>
      ))}

      <button onClick={generatePDF} style={{ marginTop: 20 }}>
        Generuj PDF
      </button>
    </div>
  );
};
