// AuditForm.tsx
import React, { useEffect, useState } from 'react';
import { categories, initialQuestions, Question } from '../data/questions';
import { Tabs } from './Tabs';
import { QuestionItem } from './QuestionItem';
import { QuestionsState, ImagesState } from './types';
import { loadAuditData, saveAnswer, uploadImage } from '../supabaseAudit';
import { generatePDF } from '../utils/generatePDF';

export const AuditForm: React.FC = () => {
  const auditId = 1; // liczba zgodnie z smallint
  const [activeTab, setActiveTab] = useState<string>(categories[0]);

  // inicjalizacja pytań na start
  const [questions, setQuestions] = useState<QuestionsState>(
    Object.fromEntries(
      categories.map(cat => [
        cat,
        initialQuestions.map(q => ({ ...q })), // kopia pytań
      ])
    )
  );

  const [imagesState, setImagesState] = useState<ImagesState>({});

  // załaduj dane z Supabase, jeśli są
  useEffect(() => {
    loadAuditData(auditId).then(({ questions: loadedQuestions, images }) => {
      const updatedQuestions: QuestionsState = { ...questions };
      categories.forEach(cat => {
        if (loadedQuestions[cat]?.length) {
          updatedQuestions[cat] = loadedQuestions[cat].map(q => ({ ...q }));
        }
      });
      setQuestions(updatedQuestions);
      setImagesState(images);
    });
  }, []);

  const setAnswerFn = (cat: string, id: string, value: boolean | undefined) => {
    setQuestions(prev => ({
      ...prev,
      [cat]: prev[cat]?.map(q => (q.id === id ? { ...q, answer: value } : q)) || [],
    }));
  };

  const updateNoteFn = (cat: string, id: string, note: string) => {
    setQuestions(prev => ({
      ...prev,
      [cat]: prev[cat]?.map(q => (q.id === id ? { ...q, note } : q)) || [],
    }));
  };

  const addImageFn = async (cat: string, id: string, files: FileList) => {
    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(auditId, cat, id, files[i]);
      uploadedUrls.push(url);
    }

    setImagesState(prev => ({
      ...prev,
      [cat]: {
        ...(prev[cat] || {}),
        [id]: [...(prev[cat]?.[id] || []), ...uploadedUrls],
      },
    }));

    const question = questions[cat]?.find(q => q.id === id);
    if (question) {
      question.images = [...(question.images || []), ...uploadedUrls];
      await saveAnswer(auditId, cat, question);
    }
  };

  const handleGeneratePDF = () => {
    generatePDF(questions, imagesState);
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Raport z audytu</h1>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {questions[activeTab]?.map((q: Question) => (
        <QuestionItem
          key={q.id}
          q={q}
          activeTab={activeTab}
          setAnswer={setAnswerFn}
          updateNote={updateNoteFn}
          addImageToQuestion={(cat, id, files) => addImageFn(cat, id, files)}
          images={imagesState[activeTab]?.[q.id]}
        />
      ))}

      <button
        style={{
          marginTop: 20,
          padding: '10px 20px',
          fontSize: 16,
          backgroundColor: '#1464f4',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}
        onClick={handleGeneratePDF}
      >
        Pobierz PDF
      </button>
    </div>
  );
};
