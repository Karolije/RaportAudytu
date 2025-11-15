export interface Question {
    id: string;
    text: string;
    answer?: boolean;
    note?: string;
  }
  
  export const categories = ["CMG.2", "CMG.3", "LWN", "CMG.5", "CMG.6"];
  
  export const initialQuestions = [
    { id: "1", text: "Zaleganie ścinek pod piłą" },
    { id: "2", text: "Zapylenie maszyn produkcja" },
    { id: "3", text: "Zapylenie maszyn UR" },
    { id: "4", text: "Nagromadzenie logów odpadowych w maszynie" },
    { id: "5", text: "Strefy p.poż produkcja" },
    { id: "6", text: "Strefy p.poż UR" },
    { id: "7", text: "Prowizorki na maszynie" },
    { id: "8", text: "Zalegający brud" },
  ];
  
  export const LOCAL_STORAGE_KEY = "auditFormData";
  