import { useMemo, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import ResultPanel from "../components/ResultPanel";
import type { AnswerLog, Question, ReviewState } from "../types";
import { updateReviewState } from "../utils/review";
import { addAnswerLog, saveReviewStates } from "../utils/storage";

type QuizPageProps = {
  questions: Question[];
  reviewStates: ReviewState[];
  onDataChanged: (logs: AnswerLog[], reviewStates: ReviewState[]) => void;
  logs: AnswerLog[];
};

export default function QuizPage({ questions, reviewStates, logs, onDataChanged }: QuizPageProps) {
  const unansweredFirst = useMemo(() => {
    const answeredIds = new Set(logs.map((log) => log.question_id));
    return [...questions].sort((a, b) => {
      const aAnswered = answeredIds.has(a.question_id) ? 1 : 0;
      const bAnswered = answeredIds.has(b.question_id) ? 1 : 0;
      return aAnswered - bAnswered;
    });
  }, [questions, logs]);
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const current = unansweredFirst[index];

  const handleSelect = (choice: string) => {
    if (!current || selectedAnswer) {
      return;
    }
    const answeredAt = new Date().toISOString();
    const isCorrect = choice === current.answer;
    const log: AnswerLog = {
      question_id: current.question_id,
      answered_at: answeredAt,
      selected_answer: choice,
      is_correct: isCorrect,
      response_time_ms: Date.now() - startedAt
    };
    const nextReviewStates = reviewStates.filter(
      (state) => state.question_id !== current.question_id
    );
    const updatedState = updateReviewState(
      reviewStates.find((state) => state.question_id === current.question_id),
      current.question_id,
      isCorrect,
      answeredAt
    );

    addAnswerLog(log);
    const savedStates = [...nextReviewStates, updatedState];
    saveReviewStates(savedStates);
    setSelectedAnswer(choice);
    onDataChanged([...logs, log], savedStates);
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      return;
    }
    setSelectedAnswer(undefined);
    setStartedAt(Date.now());
    setIndex((currentIndex) => (currentIndex + 1) % Math.max(unansweredFirst.length, 1));
  };

  if (questions.length === 0) {
    return <p className="empty-message">問題がありません。CSVを確認してください。</p>;
  }

  if (!current) {
    return <p className="empty-message">出題できる問題がありません。</p>;
  }

  return (
    <div className="page-stack">
      <QuestionCard
        question={current}
        questionNumber={index + 1}
        selectedAnswer={selectedAnswer}
        totalCount={unansweredFirst.length}
        onSelect={handleSelect}
      />
      <ResultPanel question={current} selectedAnswer={selectedAnswer} />
      <button
        className="primary-button"
        disabled={!selectedAnswer}
        onClick={handleNext}
        type="button"
      >
        次の問題へ
      </button>
    </div>
  );
}
