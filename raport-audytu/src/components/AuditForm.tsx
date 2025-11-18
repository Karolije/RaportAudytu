import React, { useEffect, useState } from 'react';
import { categories, initialQuestions, Question } from '../data/questions';
import { Tabs } from './Tabs';
import { QuestionItem } from './QuestionItem';
import { QuestionsState, ImagesState } from './types';
import { loadAuditData, saveAnswer, uploadImage } from '../supabaseAudit';
import { generatePDF } from '../utils/generatePDF';

export const AuditForm: React.FC = () => {
  // Generujemy unikalny auditId przy tworzeniu nowego audytu
  const [auditId] = useState(() => Math.floor(Math.random() * 100000));

  const [activeTab, setActiveTab] = useState<string>(categories[0]);
  const [questions, setQuestions] = useState<QuestionsState>({});
  const [imagesState, setImagesState] = useState<ImagesState>({});

  // ---------------------- LOAD DATA ----------------------
  useEffect(() => {
    const load = async () => {
      const { questions: loadedQuestions, images: loadedImages } = await loadAuditData(auditId);

      const fullQuestions: QuestionsState = {};
      const fullImages: ImagesState = {};

      categories.forEach(cat => {
        // Nadawanie unikalnych question_id dla każdego pytania w tej kategorii
        fullQuestions[cat] = initialQuestions.map((q, index) => {
          const loadedQ = loadedQuestions[cat]?.find(lq => lq.id === q.id);

          // question_id = index + 1, zamieniamy na string żeby było zgodne z typem
          const questionId = (index + 1).toString();

          return {
            ...q,
            id: questionId,
            answer: loadedQ?.answer ?? null,
            note: loadedQ?.note ?? null,
            images: loadedQ?.images ?? [],
          };
        });

        fullImages[cat] = loadedImages[cat] || {};
      });

      setQuestions(fullQuestions);
      setImagesState(fullImages);
    };

    load();
  }, [auditId]);

  // ---------------------- SET ANSWER ----------------------
  const setAnswerFn = (cat: string, id: string, value: boolean) => {
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q =>
        q.id === id ? { ...q, answer: value } : q
      );

      const updatedQuestion = updatedCategory.find(q => q.id === id);
      if (updatedQuestion) saveAnswer(cat, updatedQuestion);

      return { ...prev, [cat]: updatedCategory };
    });
  };

  // ---------------------- UPDATE NOTE ----------------------
  const updateNoteFn = (cat: string, id: string, note: string) => {
    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q =>
        q.id === id ? { ...q, note } : q
      );

      const updatedQuestion = updatedCategory.find(q => q.id === id);
      if (updatedQuestion) saveAnswer(cat, updatedQuestion);

      return { ...prev, [cat]: updatedCategory };
    });
  };

  // ---------------------- UPLOAD IMAGES ----------------------
  const addImageFn = async (cat: string, id: string, files: FileList) => {
    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadImage(cat, id, files[i]);
      uploadedUrls.push(url);
    }

    setImagesState(prev => ({
      ...prev,
      [cat]: {
        ...(prev[cat] || {}),
        [id]: [...(prev[cat]?.[id] || []), ...uploadedUrls],
      },
    }));

    setQuestions(prev => {
      const updatedCategory = prev[cat].map(q =>
        q.id === id ? { ...q, images: [...(q.images || []), ...uploadedUrls] } : q
      );

      const updatedQuestion = updatedCategory.find(q => q.id === id);
      if (updatedQuestion) saveAnswer(cat, updatedQuestion);

      return { ...prev, [cat]: updatedCategory };
    });
  };

  // ---------------------- RENDER ----------------------
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Raport z audytu</h1>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {questions[activeTab]?.map(q => (
        <QuestionItem
          key={q.id}
          q={q}
          activeTab={activeTab}
          setAnswer={setAnswerFn}
          updateNote={updateNoteFn}
          addImageToQuestion={addImageFn}
          images={imagesState[activeTab]?.[q.id] || []}
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
        onClick={() => generatePDF(questions, imagesState)}
      >
        Pobierz PDF
      </button>

    </div>
  );
};
