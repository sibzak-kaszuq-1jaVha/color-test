import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { createQuizSession, shuffleQuestionChoices } from "../src/utils/quiz.ts";

const question = {
  question_id: "test-1",
  choices: ["赤", "青", "黄", "緑"],
  answer: "赤",
  choiceColors: [
    { key: "a", label: "赤", hex: "#FF0000" },
    { key: "b", label: "青", hex: "#0000FF" },
    { key: "c", label: "黄", hex: "#FFFF00" },
    { key: "d", label: "緑", hex: "#008000" }
  ]
};

test("24通りの並びで正解・色見本の対応を保ち、正解が各位置に均等に現れる", () => {
  const original = structuredClone(question);
  const permutations = new Set();
  const correctPositions = [0, 0, 0, 0];
  for (let a = 0; a < 4; a++) {
    for (let b = 0; b < 3; b++) {
      for (let c = 0; c < 2; c++) {
        const draws = [(a + 0.5) / 4, (b + 0.5) / 3, (c + 0.5) / 2];
        const result = shuffleQuestionChoices(question, () => draws.shift());
        permutations.add(result.choices.join(","));
        correctPositions[result.choices.indexOf(result.answer)]++;
        assert.equal(result.answer, question.answer);
        assert.deepEqual(new Set(result.choices), new Set(question.choices));
        assert.deepEqual(result.choiceColors.map((color) => color.label), result.choices);
        for (const color of result.choiceColors) {
          assert.deepEqual(color, original.choiceColors.find((item) => item.label === color.label));
        }
      }
    }
  }
  assert.equal(permutations.size, 24);
  assert.deepEqual(correctPositions, [6, 6, 6, 6]);
  assert.deepEqual(question, original);
});

test("未回答を優先し、開始後の履歴変更で出題順を動かさない", () => {
  const questions = ["answered", "new-1", "new-2"].map((question_id) => ({ ...question, question_id }));
  const logs = [{ question_id: "answered" }];
  const session = createQuizSession(questions, logs);
  logs.push({ question_id: "new-1" });
  assert.deepEqual(session.map((item) => item.question_id), ["new-1", "new-2", "answered"]);
  assert.deepEqual(questions.map((item) => item.question_id), ["answered", "new-1", "new-2"]);
  assert.deepEqual(createQuizSession(questions, logs).map((item) => item.question_id),
    ["new-2", "answered", "new-1"]);
});

test("全問回答済みでも一巡分の全問題が含まれ、空の問題集も扱える", () => {
  assert.deepEqual(createQuizSession([], []), []);
  const session = createQuizSession([question], [{ question_id: question.question_id }]);
  assert.equal(session.length, 1);
  assert.equal(session[0].question_id, question.question_id);
});

const parsed = Papa.parse(readFileSync(new URL("../public/data/questions.csv", import.meta.url), "utf8"),
  { header: true, skipEmptyLines: true });
const rows = parsed.data;

test("全問題のID・4択・正解・色見本が有効", () => {
  assert.deepEqual(parsed.errors, []);
  assert.equal(rows.length, 153);
  assert.equal(new Set(rows.map((row) => row.question_id)).size, rows.length);
  for (const row of rows) {
    const choices = ["a", "b", "c", "d"].map((key) => row[`choice_${key}`]);
    assert.ok(row.prompt && row.explanation, row.question_id);
    assert.ok(choices.every(Boolean), row.question_id);
    assert.equal(new Set(choices).size, 4, row.question_id);
    assert.equal(choices.filter((choice) => choice === row.answer).length, 1, row.question_id);
    for (const key of ["a", "b", "c", "d"]) {
      if (row[`choice_${key}_color_hex`]) {
        assert.match(row[`choice_${key}_color_hex`], /^#[\da-f]{6}$/i, row.question_id);
        // 色名データには「ローズレッド → ローズ」など別名の対応もある。
        assert.ok(row[`choice_${key}_color_name`], row.question_id);
      }
    }
  }
});

test("同じ由来の和色名と外来色名が並ぶ設問には言語の限定がある", () => {
  for (const id of ["kanyou_043", "kanyou_new_046", "kanyou_new_050", "kanyou_new_057",
    "kanyou_new_061", "kanyou_new_070", "kanyou_new_074"]) {
    assert.match(rows.find((row) => row.question_id === id).prompt, /和色名/, id);
  }
});

test("同じ顔料・染料が由来の設問は成分だけで正解を決めない", () => {
  const prompts = Object.fromEntries(rows.map((row) => [row.question_id, row.prompt]));
  assert.match(prompts.kanyou_002, /洋紅/);
  assert.match(prompts.kanyou_new_083, /洋紅/);
  assert.match(prompts.kanyou_new_084, /名称をそのまま含み/);
  assert.match(prompts.kanyou_new_094, /プロイセン/);
  assert.match(prompts.kanyou_new_095, /鉄を意味する英語/);
  assert.match(prompts.kanyou_new_097, /クロム酸鉛/);
});
