import React from "react";
import { Question } from "../data/questions";
import { ImageUploader } from "./ImageUploader";
import { ImagePreviewList } from "./ImagePreviewList";

interface QuestionItemProps {
  q: Question & { answer?: boolean; note?: string };
  activeTab: string;
  setAnswer: (cat: string, id: string, value: boolean) => void;
  updateNote: (cat: string, id: string, text: string) => void;
  addImageToQuestion: (cat: string, id: string, files: File[]) => void;
  images?: string[];
}

export const QuestionItem: React.FC<QuestionItemProps> = ({
  q,
  activeTab,
  setAnswer,
  updateNote,
  addImageToQuestion,
  images,
}) => {
  return (
    <div
      key={q.id}
      style={{
        marginBottom: 25,
        borderBottom: "1px solid #ccc",
        paddingBottom: 10,
      }}
    >
      <p style={{ fontSize: 18 }}>{q.text}</p>

      <div style={{ display: "flex", gap: 20, marginBottom: 8 }}>
        <label>
          <input
            type="radio"
            checked={q.answer === true}
            onChange={() => setAnswer(activeTab, q.id, true)}
          />{" "}
          Tak
        </label>
        <label>
          <input
            type="radio"
            checked={q.answer === false}
            onChange={() => setAnswer(activeTab, q.id, false)}
          />{" "}
          Nie
        </label>
      </div>

      <textarea
        placeholder="Wpisz własną uwagę..."
        value={q.note || ""}
        onChange={(e) => updateNote(activeTab, q.id, e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 5,
          border: "1px solid #ccc",
          marginBottom: 8,
        }}
      />

      <ImageUploader onUpload={(files) => addImageToQuestion(activeTab, q.id, files)} />

      <span style={{ marginLeft: 10, fontStyle: "italic" }}>
        {images?.length ? `Dodano: ${images.length} plik` : "Nie dodano pliku"}
      </span>

      <ImagePreviewList images={images} />
    </div>
  );
};
