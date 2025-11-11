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

interface SectionData {
  id: string;
  name: string;
  questions: Question[];
}

const baseQuestions: Question[] = [
  { id: 1, text: 'Zaleganie ścinek pod piłą', answer: undefined, note: '', images: [] },
  { id: 2, text: 'Zapylenie maszyn produkcja', answer: undefined, note: '', images: [] },
  { id: 3, text: 'Zapylenie maszyn UR', answer: undefined, note: '', images: [] },
  { id: 4, text: 'Nagromadzenie logów odpadowych w maszynie', answer: undefined, note: '', images: [] },
  { id: 5, text: 'Strefy p.poż produkcja', answer: undefined, note: '', images: [] },
  { id: 6, text: 'Strefy p.poż UR', answer: undefined, note: '', images: [] },
  { id: 7, text: 'Prowizorki na maszynie', answer: undefined, note: '', images: [] },
  { id: 8, text: 'Zalegający brud', answer: undefined, note: '', images: [] },
];

const categories = ['CMG.2', 'CMG.3', 'LWN', 'CMG.5', 'CMG.6'];

const AuditForm: React.FC = () => {
  // każda zakładka ma osobny zestaw 8 pytań
  const [sections, setSections] = useState<SectionData[]>(() =>
    categories.map(cat => ({
      id: cat,
      name: cat,
      questions: JSON.parse(JSON.stringify(baseQuestions)), // głęboka kopia
    }))
  );

  const [activeTab, setActiveTab] = useState('CMG.2');

  const setAnswer = (sectionId: string, qid: number, value: boolean) => {
    setSections(prev =>
      prev.map(sec =>
        sec.id === sectionId
          ? {
              ...sec,
              questions: sec.questions.map(q => (q.id === qid ? { ...q, answer: value } : q)),
            }
          : sec
      )
    );
  };

  const updateNote = (sectionId: string, qid: number, text: string) => {
    setSections(prev =>
      prev.map(sec =>
        sec.id === sectionId
          ? {
              ...sec,
              questions: sec.questions.map(q => (q.id === qid ? { ...q, note: text } : q)),
            }
          : sec
      )
    );
  };

  const addPhoto = (sectionId: string, qid: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const reader = new FileReader();
        reader.onload = ev => {
          const base64 = ev.target?.result as string;
          setSections(prev =>
            prev.map(sec =>
              sec.id === sectionId
                ? {
                    ...sec,
                    questions: sec.questions.map(q =>
                      q.id === qid ? { ...q, images: [...(q.images || []), base64] } : q
                    ),
                  }
                : sec
            )
          );
        };
        reader.readAsDataURL(target.files[0]);
      }
    };
    input.click();
  };

  const generatePDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
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

    // Dla każdej sekcji osobna strona
    sections.forEach((section, si) => {
      if (si > 0) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(18);
      doc.setTextColor(30, 30, 120);
      doc.text(`Sekcja: ${section.name}`, 10, y);
      y += 10;
      doc.setTextColor(0, 0, 0);

      section.questions.forEach((q, idx) => {
        if (y > 250) {
          doc.addPage();
          y = 15;
        }

        doc.setFontSize(14);
        doc.text(`${idx + 1}. ${q.text}`, 10, y);
        y += 7;

        const answerText =
          q.answer === true ? 'Tak' : q.answer === false ? 'Nie' : 'Brak odpowiedzi';
        doc.setFontSize(12);
        doc.text(`Odpowiedź: ${answerText}`, 12, y);
        y += 7;

        if (q.note) {
          doc.text(`Uwagi: ${q.note}`, 12, y);
          y += 7;
        }

        q.images?.forEach(img => {
          if (!img) return;
          if (y + 90 > 297) {
            doc.addPage();
            y = 15;
          }
          doc.addImage(img, 'JPEG', 15, y, 180, 90);
          y += 95;
        });

        doc.setDrawColor(200);
        doc.setLineWidth(0.3);
        doc.line(10, y, 200, y);
        y += 7;
      });
    });

    doc.save(`Raport-Audytu-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const currentSection = sections.find(s => s.id === activeTab)!;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Raport Audytu</h1>

      {/* Pasek zakładek */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {sections.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveTab(sec.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 5,
              border: '1px solid #1976d2',
              backgroundColor: activeTab === sec.id ? '#1976d2' : 'white',
              color: activeTab === sec.id ? 'white' : '#1976d2',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {sec.name}
          </button>
        ))}
      </div>

      {/* Lista 8 pytań */}
      {currentSection.questions.map(q => (
        <div
          key={q.id}
          style={{
            marginBottom: 30,
            borderBottom: '1px solid #ccc',
            paddingBottom: 10,
            backgroundColor: '#f9f9f9',
            borderRadius: 8,
            padding: 15,
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 600 }}>{q.text}</p>
          <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
            <label>
              <input
                type="radio"
                checked={q.answer === true}
                onChange={() => setAnswer(activeTab, q.id, true)}
              />{' '}
              Tak
            </label>
            <label>
              <input
                type="radio"
                checked={q.answer === false}
                onChange={() => setAnswer(activeTab, q.id, false)}
              />{' '}
              Nie
            </label>
          </div>
          <textarea
            placeholder="Wpisz własną uwagę..."
            value={q.note}
            onChange={e => updateNote(activeTab, q.id, e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 5,
              border: '1px solid #ccc',
              minHeight: 60,
              resize: 'vertical',
            }}
          />
          <br />
          <button
            onClick={() => addPhoto(activeTab, q.id)}
            style={{
              marginTop: 8,
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Dodaj zdjęcie
          </button>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            {q.images?.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="zdjęcie"
                style={{ width: 150, height: 'auto', borderRadius: 5, boxShadow: '0 0 5px #ccc' }}
              />
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={generatePDF}
        style={{
          padding: '10px 20px',
          fontSize: 16,
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          marginTop: 30,
          cursor: 'pointer',
        }}
      >
        GENERUJ PDF
      </button>
    </div>
  );
};

export default AuditForm;
