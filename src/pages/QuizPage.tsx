import { useMemo, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import ResultPanel from "../components/ResultPanel";
import type { AnswerLog, CheckState, Question, ReviewState } from "../types";
import { updateReviewState } from "../utils/review";
import { addAnswerLog, saveReviewStates } from "../utils/storage";
import { createQuizSession } from "../utils/quiz";

type QuizPageProps = {
  questions: Question[];
  reviewStates: ReviewState[];
  checkStates: CheckState[];
  onDataChanged: (logs: AnswerLog[], reviewStates: ReviewState[]) => void;
  onCheckStatesChanged: (checkStates: CheckState[]) => void;
  logs: AnswerLog[];
};

export default function QuizPage({
  questions,
  reviewStates,
  checkStates,
  logs,
  onDataChanged,
  onCheckStatesChanged
}: QuizPageProps) {
  const [sessionQuestions, setSessionQuestions] = useState(() => createQuizSession(questions, logs));
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const current = sessionQuestions[index];
  const checkedQuestionIds = useMemo(
    () => new Set(checkStates.map((state) => state.question_id)),
    [checkStates]
  );

  const handleToggleCheck = (questionId: string) => {
    const isChecked = checkedQuestionIds.has(questionId);
    const nextCheckStates = isChecked
      ? checkStates.filter((state) => state.question_id !== questionId)
      : [...checkStates, { question_id: questionId, checked_at: new Date().toISOString() }];
    onCheckStatesChanged(nextCheckStates);
  };

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
    setIndex((currentIndex) => currentIndex + 1);
  };

  if (questions.length === 0) {
    return <p className="empty-message">問題がありません。CSVを確認してください。</p>;
  }

  if (!current) {
    return (
      <div className="empty-panel">
        <h2>今回の学習が完了しました</h2>
        <p>{sessionQuestions.length}問に回答しました。</p>
        <button className="primary-button" type="button" onClick={() => {
          setSessionQuestions(createQuizSession(questions, logs));
          setIndex(0);
          setStartedAt(Date.now());
        }}>
          もう一度学習する
        </button>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <QuestionCard
        question={current}
        questionNumber={index + 1}
        isChecked={checkedQuestionIds.has(current.question_id)}
        selectedAnswer={selectedAnswer}
        totalCount={sessionQuestions.length}
        onToggleCheck={handleToggleCheck}
        onSelect={handleSelect}
      />
      <ResultPanel question={current} selectedAnswer={selectedAnswer} />
      <button
        className="primary-button"
        disabled={!selectedAnswer}
        onClick={handleNext}
        type="button"
      >
        {index + 1 === sessionQuestions.length ? "学習を完了する" : "次の問題へ"}
      </button>
    </div>
  );
}
