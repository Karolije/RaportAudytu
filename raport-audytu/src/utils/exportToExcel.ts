import * as XLSX from "xlsx";
import { categories, initialQuestions } from "../data/questions";

export const exportToExcel = (questions: any) => {
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];

  wsData.push(["Pytanie", ...categories]);

  initialQuestions.forEach((q, qi) => {
    const row: any[] = [q.text];
    categories.forEach((cat) => {
      const qData = questions[cat][qi];
      const ansText = qData.answer === true ? "TAK" : qData.answer === false ? "NIE" : "";
      row.push(ansText);
    });
    wsData.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Audyt");
  XLSX.writeFile(wb, `Raport-Audytu-${new Date().toISOString().slice(0, 10)}.xlsx`);
};
