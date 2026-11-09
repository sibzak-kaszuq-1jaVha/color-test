import type { AnswerLog, Question } from "../types";

export const TONE_MODE = "トーン名から色を選ぶ";
export const WEAK_TOPIC_TAG = "苦手対策";

export function shuffleQuestionChoices(
  question: Question,
  random: () => number = Math.random
): Question {
  const choices = [...question.choices];
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [choices[index], choices[target]] = [choices[target], choices[index]];
  }
  return {
    ...question,
    choices,
    choiceColors: choices.flatMap((label) =>
      question.choiceColors.filter((color) => color.label === label)
    )
  };
}

// 開始時に順序を確定し、回答履歴の更新で出題中の問題を動かさない。
export function createQuizSession(questions: Question[], logs: AnswerLog[]): Question[] {
  const answeredIds = new Set(logs.map((log) => log.question_id));
  return [...questions]
    .sort((a, b) => Number(answeredIds.has(a.question_id)) - Number(answeredIds.has(b.question_id)))
    .map((question) => shuffleQuestionChoices(question));
}
