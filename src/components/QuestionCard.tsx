import type { Question } from "../types";
import ChoiceButton from "./ChoiceButton";

type QuestionCardProps = {
  question: Question;
  questionNumber: number;
  totalCount: number;
  isChecked: boolean;
  selectedAnswer?: string;
  onToggleCheck: (questionId: string) => void;
  onSelect: (choice: string) => void;
};

export default function QuestionCard({
  question,
  questionNumber,
  totalCount,
  isChecked,
  selectedAnswer,
  onToggleCheck,
  onSelect
}: QuestionCardProps) {
  const answered = Boolean(selectedAnswer);

  return (
    <section className="question-card">
      <div className="question-meta">
        <span>
          {questionNumber} / {totalCount}
        </span>
        <span>難易度 {question.difficulty}</span>
      </div>
      <button
        aria-pressed={isChecked}
        className={isChecked ? "check-button active" : "check-button"}
        onClick={() => onToggleCheck(question.question_id)}
        type="button"
      >
        {isChecked ? "要チェック済み" : "要チェック"}
      </button>
      <div className="tag-row">
        {question.tags.map((tag) => (
          <span className="tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <p className="mode-label">{question.mode}</p>
      <h2>{question.prompt}</h2>
      <div className="choice-list">
        {question.choices.map((choice) => (
          <ChoiceButton
            choice={choice}
            disabled={answered}
            isCorrect={choice === question.answer}
            isSelected={choice === selectedAnswer}
            key={choice}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
