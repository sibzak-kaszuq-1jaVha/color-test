export type Question = {
  question_id: string;
  mode: string;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
  wrong_choice_notes: string;
  tags: string[];
  difficulty: 1 | 2 | 3;
};

export type AnswerLog = {
  question_id: string;
  answered_at: string;
  selected_answer: string;
  is_correct: boolean;
  response_time_ms: number;
};

export type ReviewState = {
  question_id: string;
  review_level: number;
  correct_streak: number;
  wrong_count: number;
  last_answered_at?: string;
  next_review_at?: string;
};

export type AppView = "home" | "quiz" | "review" | "stats" | "settings";
