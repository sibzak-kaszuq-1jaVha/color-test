import type { AnswerLog, CheckState, ReviewState } from "../types";

const ANSWER_LOGS_KEY = "color-test-answer-logs";
const REVIEW_STATES_KEY = "color-test-review-states";
const CHECK_STATES_KEY = "color-test-check-states";

type ExportData = {
  version: 1 | 2;
  exported_at: string;
  answer_logs: AnswerLog[];
  review_states: ReviewState[];
  check_states?: CheckState[];
};

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getAnswerLogs = (): AnswerLog[] => readJson<AnswerLog[]>(ANSWER_LOGS_KEY, []);

export const saveAnswerLogs = (logs: AnswerLog[]) => writeJson(ANSWER_LOGS_KEY, logs);

export const addAnswerLog = (log: AnswerLog) => {
  saveAnswerLogs([...getAnswerLogs(), log]);
};

export const getReviewStates = (): ReviewState[] =>
  readJson<ReviewState[]>(REVIEW_STATES_KEY, []);

export const saveReviewStates = (states: ReviewState[]) => writeJson(REVIEW_STATES_KEY, states);

export const getCheckStates = (): CheckState[] => readJson<CheckState[]>(CHECK_STATES_KEY, []);

export const saveCheckStates = (states: CheckState[]) => writeJson(CHECK_STATES_KEY, states);

export const exportLearningData = (): string => {
  const data: ExportData = {
    version: 2,
    exported_at: new Date().toISOString(),
    answer_logs: getAnswerLogs(),
    review_states: getReviewStates(),
    check_states: getCheckStates()
  };
  return JSON.stringify(data, null, 2);
};

export const importLearningData = (jsonText: string) => {
  const parsed = JSON.parse(jsonText) as Partial<ExportData>;
  if (!Array.isArray(parsed.answer_logs) || !Array.isArray(parsed.review_states)) {
    throw new Error("インポート用ファイルの形式が違います。");
  }
  saveAnswerLogs(parsed.answer_logs);
  saveReviewStates(parsed.review_states);
  saveCheckStates(Array.isArray(parsed.check_states) ? parsed.check_states : []);
};

export const resetLearningData = () => {
  localStorage.removeItem(ANSWER_LOGS_KEY);
  localStorage.removeItem(REVIEW_STATES_KEY);
  localStorage.removeItem(CHECK_STATES_KEY);
};
