import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { createQuizSession, shuffleQuestionChoices, TONE_MODE, WEAK_TOPIC_TAG } from "../src/utils/quiz.ts";

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
  assert.equal(rows.length, 190);
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
  assert.match(prompts.kanyou_new_094, /王国名/);
  assert.match(prompts.kanyou_new_095, /鉄を意味する英語/);
  assert.match(prompts.kanyou_new_097, /PbCrO₄/);
});

const answerAliases = {
  "菫（すみれ）色": ["菫", "董色"],
  "ききょう色": ["桔梗"],
  "かきつばた色": ["杜若", "燕子花"],
  "あやめ色": ["菖蒲", "文目", "綾目"],
  "しょうぶ色": ["菖蒲", "ハナショウブ"],
  "勿忘草（わすれなぐさ）色": ["勿忘草", "忘れな草"],
  "露草色": ["露草", "つゆくさ"],
  "藤色": ["ふじ"],
  "藤紫": ["ふじむらさき"],
  "藤納戸": ["ふじなんど"],
  "ウィスタリア": ["ウイスタリア", "ウィステリア", "wisteria", "藤の花", "フジの花"],
  "ライラック": ["リラの花", "リラとも", "lilac"],
  "ラベンダー": ["lavender"],
  "パンジー": ["pansy", "三色菫", "さんしきすみれ"],
  "バイオレット": ["ヴァイオレット", "violet", "スミレの花", "菫の花"],
  "オーキッド": ["orchid", "蘭の花", "ランの花"],
  "つつじ色": ["躑躅"],
  "ばら色": ["薔薇", "バラ"],
  "桜色": ["さくら", "櫻"],
  "紅梅（こうばい）色": ["紅梅", "こうばい"],
  "桃色": ["もも", "モモ"],
  "山吹色": ["やまぶき"],
  "うこん色": ["鬱金", "ターメリック"],
  "柿色": ["かき", "カキ"],
  "杏色": ["あんず", "アンズ"],
  "栗色": ["くり", "クリ"],
  "紅色": ["べにいろ", "くれないいろ", "紅花", "べにばな"],
  "勝色（かちいろ）": ["勝ち色", "勝つ"],
  "海老茶": ["えびちゃ", "蝦茶", "伊勢海老", "イセエビ"],
  "萌黄（もえぎ）": ["萌葱", "萌え出"],
  "たいしゃ": ["代赭"],
  "るり色": ["瑠璃"],
  "錆色": ["鉄さび", "鉄錆"],
  "スカーレット": ["scarlet", "スカーレト", "緋色", "ひいろ"],
  "カーマイン": ["carmine", "カーミン", "カルミン"],
  "コチニールレッド": ["cochineal", "コチニール", "コチニル"],
  "コチニールレッド → カーマイン": ["コチニール", "カーマイン", "cochineal", "carmine"],
  "バーミリオン → スカーレット": ["バーミリオン", "スカーレット", "緋色"],
  "バーガンディー": ["バーガンディ", "burgundy", "ブルゴーニュ"],
  "プルシャンブルー": ["プルシアンブルー", "prussian blue", "プロイセン"],
  "ネープルスイエロー": ["ネープルズイエロー", "naples yellow", "ナポリ"],
  "バーントシェンナ": ["バーントシエンナ", "burnt sienna", "シエナ"],
  "ローシェンナ": ["ローシエンナ", "raw sienna", "シエナ"]
};

const normalizeForPromptCheck = (text) => text.normalize("NFKC").toLowerCase()
  .replace(/[ァ-ヶ]/g, (kana) => String.fromCharCode(kana.charCodeAt(0) - 0x60))
  .replace(/[^\p{L}\p{N}]/gu, "");

test("設問に正解や確認対象の別表記が含まれない", () => {
  for (const { question_id, prompt, answer } of rows) {
    const normalizedPrompt = normalizeForPromptCheck(prompt);
    const parenthetical = [...answer.matchAll(/[（(]([^）)]+)[）)]/g)].map((match) => match[1]);
    const bareAnswer = answer.replace(/[（(][^）)]+[）)]/g, "");
    const spellings = [answer, bareAnswer, bareAnswer.replace(/色$/, ""), ...parenthetical,
      ...(answerAliases[answer] ?? [])];
    for (const spelling of spellings.map(normalizeForPromptCheck)) {
      if (spelling.length > 1) {
        assert.ok(!normalizedPrompt.includes(spelling), `${question_id}: ${spelling}`);
      }
    }
  }
});

test("苦手対策は3分野、トーン問題は12種類すべてに同一色相の色票を4枚持つ", () => {
  const drills = rows.filter((row) => row.tags.split("|").includes(WEAK_TOPIC_TAG));
  assert.equal(drills.length, 25);
  assert.deepEqual(new Set(drills.flatMap((row) => row.tags.split("|")).filter((tag) => tag !== WEAK_TOPIC_TAG)),
    new Set(["青・紫系の花", "顔料の原料", "赤系の由来"]));
  const tones = rows.filter((row) => row.mode === TONE_MODE);
  assert.deepEqual(new Set(tones.map((row) => row.answer.replace(/\d+$/, ""))),
    new Set(["v", "s", "b", "dp", "lt", "sf", "d", "dk", "p", "ltg", "g", "dkg"]));
  for (const row of tones) {
    const hue = row.answer.match(/\d+$/)[0];
    const swatches = new Set();
    assert.equal(row.show_color_after_answer, "TRUE", row.question_id);
    for (const key of ["a", "b", "c", "d"]) {
      assert.match(row[`choice_${key}`], new RegExp(`^[a-z]+${hue}$`), row.question_id);
      assert.equal(row[`choice_${key}_pccs`], row[`choice_${key}`], row.question_id);
      assert.match(row[`choice_${key}_color_hex`], /^#[\da-f]{6}$/i, row.question_id);
      swatches.add(row[`choice_${key}_color_hex`]);
    }
    assert.equal(swatches.size, 4, row.question_id);
  }
});
