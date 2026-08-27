import Papa from "papaparse";
import type { ChoiceColor, Question } from "../types";

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
  choice_a_color_name?: string;
  choice_a_color_hex?: string;
  choice_a_pccs?: string;
  choice_a_munsell?: string;
  choice_a_color_source?: string;
  choice_b_color_name?: string;
  choice_b_color_hex?: string;
  choice_b_pccs?: string;
  choice_b_munsell?: string;
  choice_b_color_source?: string;
  choice_c_color_name?: string;
  choice_c_color_hex?: string;
  choice_c_pccs?: string;
  choice_c_munsell?: string;
  choice_c_color_source?: string;
  choice_d_color_name?: string;
  choice_d_color_hex?: string;
  choice_d_pccs?: string;
  choice_d_munsell?: string;
  choice_d_color_source?: string;
  show_color_after_answer?: string;
  color_data_status?: string;
};

const CSV_PATH = `${import.meta.env.BASE_URL}data/questions.csv`;

const stripBom = (value: string) => value.replace(/^\uFEFF/, "");

const normalizeDifficulty = (value: string | undefined): 1 | 2 | 3 => {
  const parsed = Number(value);
  if (parsed === 2 || parsed === 3) {
    return parsed;
  }
  return 1;
};

const normalizeBoolean = (value: string | undefined) => {
  return (value ?? "").trim().toLowerCase() === "true";
};

const trimValue = (value: string | undefined) => (value ?? "").trim();

const getChoiceColor = (
  row: QuestionRow,
  key: ChoiceColor["key"],
  label: string
): ChoiceColor => {
  return {
    key,
    label,
    colorName: trimValue(row[`choice_${key}_color_name`]),
    hex: trimValue(row[`choice_${key}_color_hex`]),
    pccs: trimValue(row[`choice_${key}_pccs`]),
    munsell: trimValue(row[`choice_${key}_munsell`]),
    source: trimValue(row[`choice_${key}_color_source`])
  };
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
    difficulty: normalizeDifficulty(row.difficulty),
    choiceColors: [
      getChoiceColor(row, "a", choices[0]),
      getChoiceColor(row, "b", choices[1]),
      getChoiceColor(row, "c", choices[2]),
      getChoiceColor(row, "d", choices[3])
    ],
    showColorAfterAnswer: normalizeBoolean(row.show_color_after_answer),
    colorDataStatus: trimValue(row.color_data_status)
  };
};

export async function loadQuestions(cacheBust = false): Promise<Question[]> {
  let response: Response;

  if (cacheBust) {
    try {
      const freshResponse = await fetch(`${CSV_PATH}?t=${Date.now()}`, { cache: "reload" });
      response = freshResponse.ok ? freshResponse : await fetch(CSV_PATH);
    } catch {
      response = await fetch(CSV_PATH);
    }
  } else {
    response = await fetch(CSV_PATH);
  }

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
