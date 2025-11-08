import React, { useState, ChangeEvent } from 'react';
import { jsPDF } from 'jspdf';
import font from "../fonts/Roboto-Regular-normal";
import './AuditForm.css'; // dodatkowy plik CSS dla stylów

interface Question {
  id: number;
  text: string;
  answer: boolean | null;
  note: string;
  images: string[];
}

const initialQuestions: Question[] = [
  { id: 1, text: 'Czy dokumentacja jest kompletna?', answer: null, note: '', images: [] },
  { id: 2, text: 'Czy sprzęt działa prawidłowo?', answer: null, note: '', images: [] },
  { id: 3, text: 'Czy miejsce pracy jest czyste?', answer: null, note: '', images: [] },
];

export default function AuditForm() {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  const setAnswer = (id: number, value: boolean) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, answer: value } : q));
  };

  const updateNote = (id: number, text: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, note: text } : q));
  };

  const addPhoto = (id: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, images: [...q.images, reader.result as string] } : q));
    };
    reader.readAsDataURL(file);
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Rejestracja czcionki TTF dla polskich znaków
    doc.addFileToVFS('Roboto-Regular.ttf', font);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');

    let y = 10;
    questions.forEach(q => {
      doc.setFontSize(14);
      doc.text(q.text, 10, y);
      y += 8;

      const answerText = q.answer === true ? 'Tak' : q.answer === false ? 'Nie' : 'Brak odpowiedzi';
      doc.setFontSize(12);
      doc.text(`Odpowiedź: ${answerText}`, 10, y);
      y += 6;

      if (q.note) {
        doc.text(`Uwagi: ${q.note}`, 10, y);
        y += 6;
      }

      q.images.forEach(img => {
        if (y > 250) {
          doc.addPage();
          y = 10;
        }
        doc.addImage(img, 'JPEG', 10, y, 60, 45);
        y += 50;
      });

      y += 10;
    });

    doc.save('raport_audytu.pdf');
  };

  return (
    <div className="audit-form">
      {questions.map(q => (
        <div key={q.id} className="question-container">
          <p className="question-text">{q.text}</p>
          <div className="checkbox-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={q.answer === true} onChange={() => setAnswer(q.id, true)} />
              Tak
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={q.answer === false} onChange={() => setAnswer(q.id, false)} />
              Nie
            </label>
          </div>
          <textarea
            placeholder="Wpisz własną uwagę..."
            value={q.note}
            onChange={e => updateNote(q.id, e.target.value)}
            className="note-input"
          />
          <input type="file" accept="image/*" capture="environment" onChange={e => addPhoto(q.id, e)} />
          <div className="images-row">
            {q.images.map((img, i) => <img key={i} src={img} alt={`Zdjęcie ${i + 1}`} className="image-preview" />)}
          </div>
        </div>
      ))}
      <button className="pdf-button" onClick={generatePDF}>GENERUJ PDF</button>
    </div>
  );
}
