import React, { useEffect, useState } from "react";
import {
  categories,
  initialQuestions,
  LOCAL_STORAGE_KEY,
  Question,
} from "../data/questions";
import { generatePDF } from "../utils/generatePDF";
import { exportToExcel } from "../utils/exportToExcel";
import { Tabs } from "./Tabs";
import { QuestionItem } from "./QuestionItem";

type ImagesState = Record<string, Record<string, string[]>>;
type QuestionsState = Record<string, Question[]>;

const loadQuestions = (): QuestionsState => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
      return Object.fromEntries(
        categories.map((cat) => [
          cat,
          initialQuestions.map((q) => {
            const saved = parsed.questions[cat]?.find((sq: any) =>
              sq.id.endsWith(`-${q.id}`)
            );
            return {
              ...q,
              id: `${cat}-${q.id}`,
              answer: saved?.answer,
              note: saved?.note || "",
            } as Question;
          }),
        ])
      ) as QuestionsState;
    }
  }

  return Object.fromEntries(
    categories.map((cat) => [
      cat,
      initialQuestions.map((q) => ({
        ...q,
        id: `${cat}-${q.id}`,
        answer: undefined,
        note: "",
      })),
    ])
  ) as QuestionsState;
};

const saveQuestions = (questions: QuestionsState) => {
  const smallQuestions = Object.fromEntries(
    Object.entries(questions).map(([cat, qs]) => [
      cat,
      qs.map((q) => ({ id: q.id, answer: q.answer, note: q.note })),
    ])
  );

  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({ timestamp: Date.now(), questions: smallQuestions })
  );
};

export const AuditForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("CMG.2");
  const [questions, setQuestions] = useState<QuestionsState>(loadQuestions());

  const [imagesState, setImagesState] = useState<ImagesState>(() =>
    categories.reduce((acc, c) => ({ ...acc, [c]: {} }), {} as ImagesState)
  );

  useEffect(() => {
    saveQuestions(questions);
  }, [questions]);

  // <-- TU: wartość answer ma typ boolean | undefined
  const setAnswer = (cat: string, id: string, value: boolean | undefined) => {
    setQuestions((prev: QuestionsState): QuestionsState => ({
      ...prev,
      [cat]: prev[cat].map((q) =>
        q.id === id ? ({ ...q, answer: value } as Question) : q
      ),
    }));
  };

  const updateNote = (cat: string, id: string, text: string) => {
    setQuestions((prev: QuestionsState): QuestionsState => ({
      ...prev,
      [cat]: prev[cat].map((q) =>
        q.id === id ? ({ ...q, note: text } as Question) : q
      ),
    }));
  };

  const addImageToQuestion = (cat: string, id: string, files: File[]) => {
    const fileArray = Array.from(files); // <-- konwertujemy FileList na tablicę, jeśli by było FileList
    const newImages: string[] = [];
  
    const readFile = (index: number) => {
      if (index >= fileArray.length) {
        setImagesState((prev) => {
          const catCopy: Record<string, string[]> = { ...(prev[cat] || {}) };
          const oldImgs = catCopy[id] ? [...catCopy[id]] : [];
          catCopy[id] = [...oldImgs, ...newImages];
          return { ...prev, [cat]: catCopy };
        });
        return;
      }
  
      const reader = new FileReader();
      reader.onload = () => {
        newImages.push(reader.result as string);
        readFile(index + 1);
      };
      reader.readAsDataURL(fileArray[index]);
    };
  
    readFile(0);
  };
  

  const clearForm = () => {
    const cleared = Object.fromEntries(
      categories.map((c) => [
        c,
        initialQuestions.map((q) => ({
          ...q,
          id: `${c}-${q.id}`,
          answer: undefined,
          note: "",
        })),
      ])
    ) as QuestionsState;

    setQuestions(cleared);
    setImagesState(
      categories.reduce((acc, c) => ({ ...acc, [c]: {} }), {} as ImagesState)
    );
    saveQuestions(cleared);
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h1>Raport z audytu KRYTYCZNE</h1>

      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {questions[activeTab].map((q) => (
        <QuestionItem
          key={q.id}
          q={q}
          activeTab={activeTab}
          setAnswer={setAnswer}
          updateNote={updateNote}
          addImageToQuestion={addImageToQuestion}
          images={imagesState[activeTab]?.[q.id]}
        />
      ))}

      <div style={{ display: "flex", gap: 15, marginTop: 30 }}>
        <button
          onClick={() => generatePDF(questions, imagesState)}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 5,
          }}
        >
          GENERUJ PDF
        </button>

        <button
          onClick={() => exportToExcel(questions)}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: 5,
          }}
        >
          EKSPORTUJ EXCEL
        </button>

        <button
          onClick={clearForm}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: "#d32f2f",
            color: "white",
            border: "none",
            borderRadius: 5,
          }}
        >
          WYCZYŚĆ FORMULARZ
        </button>
      </div>
    </div>
  );
};

export default AuditForm;
