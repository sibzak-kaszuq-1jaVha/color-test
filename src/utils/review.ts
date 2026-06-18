import type { ReviewState } from "../types";

const toLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayLocalDate = () => toLocalDate(new Date());

export const addLocalDays = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
};

export const isDueTodayOrPast = (dateText?: string) => {
  if (!dateText) {
    return false;
  }
  return dateText <= todayLocalDate();
};

export const updateReviewState = (
  current: ReviewState | undefined,
  questionId: string,
  isCorrect: boolean,
  answeredAt: string
): ReviewState => {
  const base: ReviewState = current ?? {
    question_id: questionId,
    review_level: 0,
    correct_streak: 0,
    wrong_count: 0
  };

  if (!isCorrect) {
    return {
      ...base,
      review_level: 1,
      correct_streak: 0,
      wrong_count: base.wrong_count + 1,
      last_answered_at: answeredAt,
      next_review_at: addLocalDays(1)
    };
  }

  const correctStreak = base.correct_streak + 1;
  const reviewLevel = correctStreak >= 3 ? 4 : correctStreak >= 2 ? 3 : 2;
  const nextReviewDays = correctStreak >= 3 ? 14 : correctStreak >= 2 ? 7 : 3;

  return {
    ...base,
    review_level: reviewLevel,
    correct_streak: correctStreak,
    last_answered_at: answeredAt,
    next_review_at: addLocalDays(nextReviewDays)
  };
};
