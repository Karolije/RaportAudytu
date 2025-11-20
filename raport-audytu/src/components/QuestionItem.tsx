import React from 'react';
import { Question } from '../data/questions';
import { ImageUploader } from './ImageUploader';
import { ImagePreviewList } from './ImagePreviewList';

type Props = {
  q: Question;
  activeTab: string;
  setAnswer: (cat: string, id: string, value: boolean) => void;
  updateNote: (cat: string, id: string, text: string) => void;
  addImageToQuestion: (cat: string, id: string, files: FileList) => void;
  images?: string[];
  auditId: number;
  imagesState: Record<string, Record<string, string[]>>;
  setImagesState: React.Dispatch<React.SetStateAction<Record<string, Record<string, string[]>>>>;
  questions: Record<string, Question[]>;
  setQuestions: React.Dispatch<React.SetStateAction<Record<string, Question[]>>>;
  saveAnswer: (auditId: number, cat: string, question: Question) => void;
};

export const QuestionItem: React.FC<Props> = ({
  q,
  activeTab,
  setAnswer,
  updateNote,
  addImageToQuestion,
  images = [],
  auditId,
  imagesState,
  setImagesState,
  questions,
  setQuestions,
  saveAnswer
}) => {

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);

    // aktualizacja imagesState
    setImagesState(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [q.id]: updatedImages
      }
    }));

    // aktualizacja pytań
    const updatedQuestions = questions[activeTab].map(question =>
      question.id === q.id ? { ...question, images: updatedImages } : question
    );
    setQuestions(prev => ({ ...prev, [activeTab]: updatedQuestions }));

    // zapis w Supabase
    saveAnswer(auditId, activeTab, { ...q, images: updatedImages });
  };

  return (
    <div style={{ marginBottom: 25, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
      <p style={{ fontSize: 18 }}>{q.text}</p>

  <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
  <button
    onClick={() => setAnswer(activeTab, q.id, true)}
    style={{
      padding: '6px 12px',
      fontSize: 20,
      fontWeight: 'bold',
      color: '#28a745',
      borderRadius: 5,
      cursor: 'pointer',
      minWidth: 50,
      border: q.answer === true ? '2px solid #28a745' : '1px solid #28a745',
      backgroundColor: q.answer === true ? '#c3e6cb' : '#f0f0f0',
      boxShadow: q.answer === true ? '0 0 5px rgba(0,0,0,0.2)' : 'none',
    }}
  >
    V
  </button>

  <button
    onClick={() => setAnswer(activeTab, q.id, false)}
    style={{
      padding: '6px 12px',
      fontSize: 20,
      fontWeight: 'bold',
      color: '#dc3545',
      borderRadius: 5,
      cursor: 'pointer',
      minWidth: 50,
      border: q.answer === false ? '2px solid #dc3545' : '1px solid #dc3545',
      backgroundColor: q.answer === false ? '#f5c6cb' : '#f0f0f0',
      boxShadow: q.answer === false ? '0 0 5px rgba(0,0,0,0.2)' : 'none',
    }}
  >
    X
  </button>
</div>


      <textarea
        placeholder="Wpisz własną uwagę..."
        value={q.note || ''}
        onChange={(e) => updateNote(activeTab, q.id, e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 5,
          border: '1px solid #ccc',
          marginBottom: 8,
          resize: 'vertical',
        }}
      />

      <ImageUploader onUpload={(files: FileList) => addImageToQuestion(activeTab, q.id, files)} />

      <div style={{ marginTop: 5, fontStyle: 'italic' }}>
        {images.length > 0
          ? `Dodano: ${images.length} plik${images.length > 1 ? 'i' : ''}`
          : 'Nie dodano pliku'}
      </div>

      <ImagePreviewList images={images} onRemove={handleRemoveImage} />
    </div>
  );
};
