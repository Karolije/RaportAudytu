import { Question } from '../data/questions';

export type QuestionsState = Record<string, Question[]>;
export type ImagesState = Record<string, Record<string, string[]>>;
