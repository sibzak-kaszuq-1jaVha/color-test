import { useMemo, useState } from "react";
import QuestionCard from "../components/QuestionCard";
import ResultPanel from "../components/ResultPanel";
import type { AnswerLog, CheckState, Question, ReviewState } from "../types";
import { updateReviewState } from "../utils/review";
import { addAnswerLog, saveReviewStates } from "../utils/storage";
import { getReviewQuestions } from "../utils/stats";
import { shuffleQuestionChoices } from "../utils/quiz";

type ReviewPageProps = {
  questions: Question[];
  logs: AnswerLog[];
  reviewStates: ReviewState[];
  checkStates: CheckState[];
  onDataChanged: (logs: AnswerLog[], reviewStates: ReviewState[]) => void;
  onCheckStatesChanged: (checkStates: CheckState[]) => void;
};

export default function ReviewPage({
  questions,
  logs,
  reviewStates,
  checkStates,
  onDataChanged,
  onCheckStatesChanged
}: ReviewPageProps) {
  const checkedQuestionIds = useMemo(
    () => new Set(checkStates.map((state) => state.question_id)),
    [checkStates]
  );
  const [reviewQuestions, setReviewQuestions] = useState(
    () => getReviewQuestions(questions, logs, reviewStates, [...checkedQuestionIds])
      .map((question) => shuffleQuestionChoices(question))
  );
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>();
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const current = reviewQuestions[index];

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
    setIndex((currentIndex) => currentIndex + 1);
  };

  if (reviewQuestions.length === 0) {
    return (
      <div className="empty-panel">
        <h2>復習対象はありません</h2>
        <p>不正解や復習予定の問題が出ると、ここに表示されます。</p>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="empty-panel">
        <h2>今回の復習が完了しました</h2>
        <p>{reviewQuestions.length}問に回答しました。</p>
        <button className="primary-button" type="button" onClick={() => {
          setReviewQuestions(getReviewQuestions(questions, logs, reviewStates, [...checkedQuestionIds])
            .map((question) => shuffleQuestionChoices(question)));
          setIndex(0);
          setStartedAt(Date.now());
        }}>
          復習対象を更新する
        </button>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <QuestionCard
        question={current}
        answeredCount={index + Number(Boolean(selectedAnswer))}
        isChecked={checkedQuestionIds.has(current.question_id)}
        selectedAnswer={selectedAnswer}
        totalCount={reviewQuestions.length}
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
        {index + 1 === reviewQuestions.length ? "復習を完了する" : "次の復習へ"}
      </button>
    </div>
  );
}
