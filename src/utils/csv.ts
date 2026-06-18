import Papa from "papaparse";
import type { Question } from "../types";

type QuestionRow = {
  question_id?: string;
  mode?: string;
  prompt?: string;
  choice_a?: string;
  choice_b?: string;
  choice_c?: string;
  choice_d?: string;
  answer?: string;
  explanation?: string;
  wrong_choice_notes?: string;
  tags?: string;
  difficulty?: string;
};

const CSV_PATH = "/data/questions.csv";

const stripBom = (value: string) => value.replace(/^\uFEFF/, "");

const normalizeDifficulty = (value: string | undefined): 1 | 2 | 3 => {
  const parsed = Number(value);
  if (parsed === 2 || parsed === 3) {
    return parsed;
  }
  return 1;
};

const rowToQuestion = (row: QuestionRow, index: number): Question => {
  const questionId = stripBom(row.question_id ?? "").trim();
  const choices = [
    row.choice_a ?? "",
    row.choice_b ?? "",
    row.choice_c ?? "",
    row.choice_d ?? ""
  ].map((choice) => choice.trim());

  return {
    question_id: questionId || `row-${index + 1}`,
    mode: (row.mode ?? "").trim(),
    prompt: (row.prompt ?? "").trim(),
    choices,
    answer: (row.answer ?? "").trim(),
    explanation: (row.explanation ?? "").trim(),
    wrong_choice_notes: (row.wrong_choice_notes ?? "").trim(),
    tags: (row.tags ?? "")
      .split("|")
      .map((tag) => tag.trim())
      .filter(Boolean),
    difficulty: normalizeDifficulty(row.difficulty)
  };
};

export async function loadQuestions(cacheBust = false): Promise<Question[]> {
  const url = cacheBust ? `${CSV_PATH}?t=${Date.now()}` : CSV_PATH;
  const response = await fetch(url, { cache: cacheBust ? "reload" : "default" });

  if (!response.ok) {
    throw new Error("CSVファイルを読み込めませんでした。public/data/questions.csv を確認してください。");
  }

  const text = stripBom(await response.text());
  const parsed = Papa.parse<QuestionRow>(text, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSVの形式を確認してください: ${parsed.errors[0].message}`);
  }

  return parsed.data
    .map(rowToQuestion)
    .filter((question) => question.prompt && question.choices.length === 4 && question.answer);
}
