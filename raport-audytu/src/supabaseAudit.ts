import { Question } from './data/questions';
import { QuestionsState, ImagesState } from './components/types';
import { supabase } from './supabaseClient';

// ---------------------- LOAD DATA ----------------------
export const loadAuditData = async (auditId: number) => {
  console.log("🔄 Pobieram dane audytu:", auditId);

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

    const parsedImages = row.images ? JSON.parse(row.images) : [];

    questions[row.category].push({
      id: row.question_id.toString(),
      text: row.question_text,
      answer: row.answer,
      note: row.note,
      images: parsedImages,
    });

    images[row.category][row.question_id] = parsedImages;
  });

  console.log("📥 Dane załadowane:", questions);
  return { questions, images };
};

// ---------------------- SAVE ANSWER ----------------------
export const saveAnswer = async (auditId: number, category: string, question: Question) => {
  try {
    const imagesString = JSON.stringify(question.images || []);

    let safeAnswer: boolean | null = null;
    if (question.answer === true || question.answer === false) safeAnswer = question.answer;

    console.log('💾 Zapisuję odpowiedź:', {
      audit_id: auditId,
      category,
      question_id: Number(question.id),
      question_text: question.text,
      answer: safeAnswer,
      note: question.note,
      images: question.images,
    });

    const { error } = await supabase
      .from('audit_answers')
      .upsert({
        audit_id: auditId,
        category,
        question_id: Number(question.id),
        question_text: question.text,
        answer: safeAnswer,
        note: question.note ?? null,
        images: imagesString,
        updated_at: new Date(),
      }, {
        onConflict: 'audit_id, category, question_id',
      });

    if (error) console.error('❌ Błąd zapisu w Supabase:', error);
    else console.log('✅ Odpowiedź zapisana do Supabase');
  } catch (err) {
    console.error('Błąd zapisu w Supabase:', err);
    return null;
  }
};

// ---------------------- UPLOAD IMAGE ----------------------
export const uploadImage = async (
  auditId: number,
  category: string,
  questionId: string,
  file: File
): Promise<string> => {
  const path = `audits/${auditId}/${category}/${questionId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('audit-images')
    .upload(path, file);

  if (uploadError) {
    console.error("❌ Błąd uploadu:", uploadError);
    throw new Error(`Błąd uploadu: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('audit-images')
    .getPublicUrl(path);

  console.log("📸 Zdjęcie zapisane:", urlData?.publicUrl);

  return urlData?.publicUrl ?? '';
};
