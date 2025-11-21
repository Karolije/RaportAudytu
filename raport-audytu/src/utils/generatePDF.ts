import jsPDF from "jspdf";
import font from "../fonts/Roboto-Regular-normal";
import { generateSummaryTable } from "./generateSummaryTable";
import { generateQuestionsSection } from "./generateQuestionsSection";

export const generatePDF = async (questions: any, imagesState: any) => {
  const doc = new jsPDF("l", "mm", "a4");

  // Dodajemy font
  doc.addFileToVFS("Roboto-Regular.ttf", font);
  doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
  doc.setFont("Roboto");

  const startY = generateSummaryTable(doc, questions);
  await generateQuestionsSection(doc, questions, imagesState, startY);

  const fileName = `Raport-Audytu-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};
