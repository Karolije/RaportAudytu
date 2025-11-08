import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

interface Question {
  id: number;
  text: string;
  answer: boolean | null;
  note: string;
  images: string[];
}

const LOCAL_STORAGE_KEY = 'auditData';

export default function AuditForm() {
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: 'Czy dokumentacja jest kompletna?', answer: null, note: '', images: [] },
    { id: 2, text: 'Czy sprzęt działa prawidłowo?', answer: null, note: '', images: [] },
  ]);

  // Wczytaj dane z localStorage przy starcie
  useEffect(() => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) setQuestions(JSON.parse(data));
  }, []);

  // Zapisz dane lokalnie przy zmianie
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(questions));
  }, [questions]);

  const setAnswer = (id: number, value: boolean) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, answer: value } : q));
  };

  const updateNote = (id: number, note: string) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, note } : q));
  };

  const addPhoto = (id: number) => {
    // Tutaj w PWA możemy użyć <input type="file" accept="image/*" capture>
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      if (input.files?.[0]) {
        const reader = new FileReader();
        reader.onload = () => {
          setQuestions(qs => qs.map(q => q.id === id ? { ...q, images: [...q.images, reader.result as string] } : q));
        };
        reader.readAsDataURL(input.files[0]);
      }
    };
    input.click();
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    questions.forEach((q, i) => {
      doc.text(`${q.text}`, 10, 10 + i * 30);
      doc.text(`Odpowiedź: ${q.answer === true ? 'Tak' : q.answer === false ? 'Nie' : 'Brak'}`, 10, 16 + i * 30);
      if (q.note) doc.text(`Uwagi: ${q.note}`, 10, 22 + i * 30);
      // zdjęcia w PDF można też dodać, ale wymaga skalowania
    });
    doc.save('raport.pdf');
  };

  return (
    <div>
      {questions.map(q => (
        <div key={q.id}>
          <p>{q.text}</p>
          <button onClick={() => setAnswer(q.id, true)}>Tak</button>
          <button onClick={() => setAnswer(q.id, false)}>Nie</button>
          <textarea value={q.note} onChange={e => updateNote(q.id, e.target.value)} />
          <button onClick={() => addPhoto(q.id)}>Dodaj zdjęcie</button>
        </div>
      ))}
      <button onClick={generatePDF}>GENERUJ PDF</button>
    </div>
  );
}
