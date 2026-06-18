import type { AnswerLog, Question, ReviewState } from "../types";
import { isDueTodayOrPast } from "./review";

export type RateStats = {
  total: number;
  correct: number;
  wrong: number;
  accuracy: number;
};

export type NamedRateStats = RateStats & {
  name: string;
};

const emptyRateStats = (): RateStats => ({
  total: 0,
  correct: 0,
  wrong: 0,
  accuracy: 0
});

const addResult = (stats: RateStats, isCorrect: boolean) => {
  stats.total += 1;
  if (isCorrect) {
    stats.correct += 1;
  } else {
    stats.wrong += 1;
  }
  stats.accuracy = stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
};

export const getOverallStats = (logs: AnswerLog[]): RateStats => {
  const stats = emptyRateStats();
  logs.forEach((log) => addResult(stats, log.is_correct));
  return stats;
};

export const getTagStats = (questions: Question[], logs: AnswerLog[]): NamedRateStats[] => {
  const questionMap = new Map(questions.map((question) => [question.question_id, question]));
  const statsMap = new Map<string, RateStats>();

  logs.forEach((log) => {
    const question = questionMap.get(log.question_id);
    question?.tags.forEach((tag) => {
      const stats = statsMap.get(tag) ?? emptyRateStats();
      addResult(stats, log.is_correct);
      statsMap.set(tag, stats);
    });
  });

  return Array.from(statsMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
};

export const getDifficultyStats = (
  questions: Question[],
  logs: AnswerLog[]
): NamedRateStats[] => {
  const questionMap = new Map(questions.map((question) => [question.question_id, question]));
  const statsMap = new Map<string, RateStats>();

  logs.forEach((log) => {
    const question = questionMap.get(log.question_id);
    if (!question) {
      return;
    }
    const name = `難易度 ${question.difficulty}`;
    const stats = statsMap.get(name) ?? emptyRateStats();
    addResult(stats, log.is_correct);
    statsMap.set(name, stats);
  });

  return Array.from(statsMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
};

export const getUnansweredCount = (questions: Question[], logs: AnswerLog[]) => {
  const answeredIds = new Set(logs.map((log) => log.question_id));
  return questions.filter((question) => !answeredIds.has(question.question_id)).length;
};

export const getDueReviewCount = (states: ReviewState[], checkedQuestionIds: string[] = []) => {
  const reviewIds = new Set(
    states
      .filter((state) => state.wrong_count > 0 || isDueTodayOrPast(state.next_review_at))
      .map((state) => state.question_id)
  );
  checkedQuestionIds.forEach((questionId) => reviewIds.add(questionId));
  return reviewIds.size;
};

export const getWeakTags = (
  questions: Question[],
  logs: AnswerLog[],
  limit = 3
): string[] =>
  getTagStats(questions, logs)
    .filter((stat) => stat.total >= 1 && stat.accuracy < 80)
    .slice(0, limit)
    .map((stat) => stat.name);

export const getReviewQuestions = (
  questions: Question[],
  logs: AnswerLog[],
  states: ReviewState[],
  checkedQuestionIds: string[] = []
): Question[] => {
  const stateMap = new Map(states.map((state) => [state.question_id, state]));
  const weakTags = new Set(getWeakTags(questions, logs));
  const checkedIds = new Set(checkedQuestionIds);

  return questions
    .filter((question) => {
      const state = stateMap.get(question.question_id);
      const hasWeakTag = question.tags.some((tag) => weakTags.has(tag));
      return Boolean(
        state?.wrong_count ||
          isDueTodayOrPast(state?.next_review_at) ||
          checkedIds.has(question.question_id) ||
          hasWeakTag
      );
    })
    .sort((a, b) => {
      const stateA = stateMap.get(a.question_id);
      const stateB = stateMap.get(b.question_id);
      const checkedA = checkedIds.has(a.question_id) ? 1 : 0;
      const checkedB = checkedIds.has(b.question_id) ? 1 : 0;
      const dateA = checkedA ? "0000-00-00" : stateA?.next_review_at ?? "9999-12-31";
      const dateB = checkedB ? "0000-00-00" : stateB?.next_review_at ?? "9999-12-31";
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      const checkedDiff = checkedB - checkedA;
      if (checkedDiff !== 0) {
        return checkedDiff;
      }
      const wrongDiff = (stateB?.wrong_count ?? 0) - (stateA?.wrong_count ?? 0);
      if (wrongDiff !== 0) {
        return wrongDiff;
      }
      return b.difficulty - a.difficulty;
    });
};

export const getFrequentMistakes = (
  questions: Question[],
  states: ReviewState[],
  limit = 5
): Array<Question & { wrong_count: number }> => {
  const stateMap = new Map(states.map((state) => [state.question_id, state]));
  return questions
    .map((question) => ({
      ...question,
      wrong_count: stateMap.get(question.question_id)?.wrong_count ?? 0
    }))
    .filter((question) => question.wrong_count > 0)
    .sort((a, b) => b.wrong_count - a.wrong_count || b.difficulty - a.difficulty)
    .slice(0, limit);
};
