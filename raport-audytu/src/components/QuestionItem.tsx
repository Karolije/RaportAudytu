import React from 'react';
import { Question } from '../data/questions';
import { ImageUploader } from './ImageUploader';
import { ImagePreviewList } from './ImagePreviewList';

type Props = {
  q: Question;
  activeTab: string;
  setAnswer: (cat: string, id: string, value: boolean | undefined) => void;
  updateNote: (cat: string, id: string, text: string) => void;
  addImageToQuestion: (cat: string, id: string, files: FileList) => void;
  images?: string[];
};

export const QuestionItem: React.FC<Props> = ({
  q,
  activeTab,
  setAnswer,
  updateNote,
  addImageToQuestion,
  images,
}) => {
  return (
    <div style={{ marginBottom: 25, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
      <p style={{ fontSize: 18 }}>{q.text}</p>

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
        value={q.note || ''}
        onChange={(e) => updateNote(activeTab, q.id, e.target.value)}
        style={{ width: '100%', padding: 10, borderRadius: 5, border: '1px solid #ccc', marginBottom: 8 }}
      />

      <ImageUploader onUpload={(files: FileList) => addImageToQuestion(activeTab, q.id, files)} />

      <span style={{ marginLeft: 10, fontStyle: 'italic' }}>
        {images?.length ? `Dodano: ${images.length} plik` : 'Nie dodano pliku'}
      </span>

      <ImagePreviewList images={images} />
    </div>
  );
};
