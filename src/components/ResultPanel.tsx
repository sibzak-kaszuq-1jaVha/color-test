import type { Question } from "../types";
import { TONE_MODE } from "../utils/quiz";

type ResultPanelProps = {
  question: Question;
  selectedAnswer?: string;
};

export default function ResultPanel({ question, selectedAnswer }: ResultPanelProps) {
  if (!selectedAnswer) {
    return null;
  }

  const isCorrect = selectedAnswer === question.answer;
  const isToneQuestion = question.mode === TONE_MODE;
  const visibleChoiceColors = question.choiceColors.filter((choice) => choice.hex);
  const correctColor = question.choiceColors.find((choice) => choice.label === question.answer);

  return (
    <section className={isCorrect ? "result-panel correct" : "result-panel wrong"}>
      <p className="result-title">{isCorrect ? "正解です" : "不正解です"}</p>
      <p>
        <strong>正解:</strong> {isToneQuestion
          ? `色票 ${question.choices.indexOf(question.answer) + 1}（${correctColor?.colorName}）`
          : question.answer}
      </p>
      {question.explanation && <p>{question.explanation}</p>}
      {question.wrong_choice_notes && (
        <p className="note">
          <strong>選択肢メモ:</strong> {question.wrong_choice_notes}
        </p>
      )}
      {question.showColorAfterAnswer && visibleChoiceColors.length > 0 && (
        <section className="color-preview-section" aria-label="選択肢の色を確認">
          <h3>選択肢の色を確認</h3>
          <div className="color-preview-list">
            {visibleChoiceColors.map((choice, index) => (
              <div className="color-preview-item" key={choice.key}>
                <span
                  aria-label={`${choice.label} の色見本`}
                  className="color-swatch"
                  style={{ backgroundColor: choice.hex }}
                />
                <div className="color-preview-text">
                  <div className="color-preview-name">
                    {isToneQuestion ? `色票 ${index + 1} · ${choice.colorName}` : choice.label}
                  </div>
                  <div className="color-meta">
                    {choice.hex}
                    {choice.pccs ? ` / PCCS: ${choice.pccs}` : ""}
                    {choice.munsell ? ` / Munsell: ${choice.munsell}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
