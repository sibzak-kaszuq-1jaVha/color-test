import type { Question } from "../types";

type ResultPanelProps = {
  question: Question;
  selectedAnswer?: string;
};

export default function ResultPanel({ question, selectedAnswer }: ResultPanelProps) {
  if (!selectedAnswer) {
    return null;
  }

  const isCorrect = selectedAnswer === question.answer;

  return (
    <section className={isCorrect ? "result-panel correct" : "result-panel wrong"}>
      <p className="result-title">{isCorrect ? "正解です" : "不正解です"}</p>
      <p>
        <strong>正解:</strong> {question.answer}
      </p>
      {question.explanation && <p>{question.explanation}</p>}
      {question.wrong_choice_notes && (
        <p className="note">
          <strong>選択肢メモ:</strong> {question.wrong_choice_notes}
        </p>
      )}
    </section>
  );
}
