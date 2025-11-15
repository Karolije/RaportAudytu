export interface Question {
  id: string;
  text: string;
  answer?: boolean | null;
  note?: string | null;
  images: string[]; // stringi URL-i zdjęć
}

export const categories = ["CMG.2", "CMG.3", "LWN", "CMG.5", "CMG.6"];

export const initialQuestions: Question[] = [
  { id: "1", text: "Zaleganie ścinek pod piłą", images: [] },
  { id: "2", text: "Zapylenie maszyn produkcja", images: [] },
  { id: "3", text: "Zapylenie maszyn UR", images: [] },
  { id: "4", text: "Nagromadzenie logów odpadowych w maszynie", images: [] },
  { id: "5", text: "Strefy p.poż produkcja", images: [] },
  { id: "6", text: "Strefy p.poż UR", images: [] },
  { id: "7", text: "Prowizorki na maszynie", images: [] },
  { id: "8", text: "Zalegający brud", images: [] },
];
