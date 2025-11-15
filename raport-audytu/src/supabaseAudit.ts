import { Question } from './data/questions';
import { QuestionsState, ImagesState } from './components/types';
import { supabase } from './supabaseClient';

// Pobranie zapisanych odpowiedzi i zdjęć
export const loadAuditData = async (auditId: number) => {
  const { data, error } = await supabase
    .from('audit_answers')
    .select('*')
    .eq('audit_id', auditId);

  if (error) {
    console.error('Błąd pobierania danych z Supabase:', error);
    return { questions: {} as QuestionsState, images: {} as ImagesState };
  }

  const questions: QuestionsState = {};
  const images: ImagesState = {};

  data?.forEach((row: any) => {
    if (!questions[row.category]) questions[row.category] = [];
    questions[row.category].push({
      id: row.question_id,
      text: row.question_text,
      answer: row.answer,
      note: row.note,
      images: row.images ? JSON.parse(row.images) : [],
    });

    if (!images[row.category]) images[row.category] = {};
    images[row.category][row.question_id] = row.images ? JSON.parse(row.images) : [];
  });

  return { questions, images };
};

// Zapis odpowiedzi i notatek dla pytania
export const saveAnswer = async (auditId: number, cat: string, question: Question) => {
  const imagesString = JSON.stringify(question.images || []);

  const { data, error } = await supabase
    .from('audit_answers')
    .upsert(
      [
        {
          audit_id: auditId,
          category: cat,
          question_id: question.id,
          question_text: question.text,
          answer: question.answer,
          note: question.note,
          images: imagesString, // ✅ zawsze string
        },
      ],
      // { onConflict: ['audit_id', 'category', 'question_id'] }
    );

  if (error) console.error('Błąd zapisu w Supabase:', error);
  return data;
};

// Upload zdjęcia i pobranie publicznego URL
export const uploadImage = async (
  auditId: number,
  cat: string,
  questionId: string,
  file: File
): Promise<string> => {
  const path = `audits/${auditId}/${cat}/${questionId}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from('audit-images').upload(path, file);
  if (error) throw new Error(`Błąd uploadu: ${error.message}`);

  const { data: urlData } = supabase.storage.from('audit-images').getPublicUrl(path);
  return urlData?.publicUrl || '';
};
