import { useMemo, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import ResultPanel from "../components/ResultPanel";
import type { AnswerLog, Question, ReviewState } from "../types";
import { updateReviewState } from "../utils/review";
import { addAnswerLog, saveReviewStates } from "../utils/storage";
import { getReviewQuestions } from "../utils/stats";

type ReviewPageProps = {
  questions: Question[];
  logs: AnswerLog[];
  reviewStates: ReviewState[];
  onDataChanged: (logs: AnswerLog[], reviewStates: ReviewState[]) => void;
};

export default function ReviewPage({
  questions,
  logs,
  reviewStates,
  onDataChanged
}: ReviewPageProps) {
  const reviewQuestions = useMemo(
    () => getReviewQuestions(questions, logs, reviewStates),
    [questions, logs, reviewStates]
  );
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const current = reviewQuestions[index];

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
    const savedStates = [...nextReviewStates, updatedState];

    addAnswerLog(log);
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
    setIndex((currentIndex) => (currentIndex + 1) % Math.max(reviewQuestions.length, 1));
  };

  if (reviewQuestions.length === 0) {
    return (
      <div className="empty-panel">
        <h2>復習対象はありません</h2>
        <p>不正解や復習予定の問題が出ると、ここに表示されます。</p>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <QuestionCard
        question={current}
        questionNumber={index + 1}
        selectedAnswer={selectedAnswer}
        totalCount={reviewQuestions.length}
        onSelect={handleSelect}
      />
      <ResultPanel question={current} selectedAnswer={selectedAnswer} />
      <button
        className="primary-button"
        disabled={!selectedAnswer}
        onClick={handleNext}
        type="button"
      >
        次の復習へ
      </button>
    </div>
  );
}
