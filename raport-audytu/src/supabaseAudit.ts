import { Question } from './data/questions';
import { QuestionsState, ImagesState } from './components/types';
import { supabase } from './supabaseClient';

// ---------------------- MAPA KATEGORII ----------------------
const categoryNumberMap: Record<string, number> = {
  "CMG.2": 2,
  "CMG.3": 3,
  "LWN": 4,
  "CMG.5": 5,
  "CMG.6": 6,
};

// ---------------------- GENERUJ AUDIT ID ----------------------
export const generateAuditId = (cat: string, questionId: string) => {
  const catNum = categoryNumberMap[cat];
  return parseInt(`${catNum}${questionId}`);
};

// ---------------------- LOAD DATA ----------------------
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
    if (!images[row.category]) images[row.category] = {};

    questions[row.category].push({
      id: row.question_id,
      text: row.question_text,
      answer: row.answer,
      note: row.note,
      images: row.images ? JSON.parse(row.images) : [],
    });

    images[row.category][row.question_id] = row.images ? JSON.parse(row.images) : [];
  });

  return { questions, images };
};

// ---------------------- SAVE ANSWER ----------------------
export const saveAnswer = async (cat: string, question: Question) => {
  try {
    const imagesString = JSON.stringify(question.images || []);
    const auditId = generateAuditId(cat, question.id);

    let safeAnswer: boolean | null = null;
    if (question.answer === true || question.answer === false) safeAnswer = question.answer;

    console.log('Wysyłam do Supabase:', {
      audit_id: auditId,
      category: cat,
      question_id: question.id,
      question_text: question.text,
      answer: safeAnswer,
      note: question.note,
      images: question.images,
    });

    const { error } = await supabase
      .from('audit_answers')
      .upsert(
        [
          {
            audit_id: auditId,
            category: cat,
            question_id: question.id,
            question_text: question.text,
            answer: safeAnswer,
            note: question.note ?? null,
            images: imagesString,
          },
        ],
        {
          onConflict: 'audit_id',
        }
      );

    if (error) console.error('Błąd zapisu w Supabase:', error);
    else console.log('Odpowiedź zapisana');
  } catch (err) {
    console.error('Błąd zapisu w Supabase:', err);
    return null;
  }
};

// ---------------------- UPLOAD IMAGE ----------------------
export const uploadImage = async (
  cat: string,
  questionId: string,
  file: File
): Promise<string> => {
  const auditId = generateAuditId(cat, questionId);
  const path = `audits/${auditId}/${cat}/${questionId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('audit-images')
    .upload(path, file);

  if (uploadError) throw new Error(`Błąd uploadu: ${uploadError.message}`);

  const { data: urlData } = supabase.storage
    .from('audit-images')
    .getPublicUrl(path);

  return urlData?.publicUrl ?? '';
};
