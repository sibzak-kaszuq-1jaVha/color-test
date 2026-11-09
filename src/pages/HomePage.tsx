import StatCard from "../components/StatCard";
import type { AppView, AnswerLog, CheckState, Question, ReviewState } from "../types";
import { getDueReviewCount, getOverallStats, getUnansweredCount } from "../utils/stats";
import { TONE_MODE, WEAK_TOPIC_TAG } from "../utils/quiz";

type HomePageProps = {
  questions: Question[];
  logs: AnswerLog[];
  reviewStates: ReviewState[];
  checkStates: CheckState[];
  onNavigate: (view: AppView) => void;
  onStartPractice: (focus: "weak" | "tone") => void;
};

export default function HomePage({
  questions,
  logs,
  reviewStates,
  checkStates,
  onNavigate,
  onStartPractice
}: HomePageProps) {
  const overall = getOverallStats(logs);
  const unanswered = getUnansweredCount(questions, logs);
  const weakCount = questions.filter((question) => question.tags.includes(WEAK_TOPIC_TAG)).length;
  const toneCount = questions.filter((question) => question.mode === TONE_MODE).length;
  const dueReview = getDueReviewCount(
    reviewStates,
    checkStates.map((state) => state.question_id)
  );

  return (
    <div className="page-stack">
      <section className="intro-panel">
        <p className="eyebrow">今日の学習</p>
        <h2>慣用色名とトーンを1問ずつ確認しましょう</h2>
      </section>
      <div className="stat-grid">
        <StatCard label="今日の復習" value={`${dueReview}問`} />
        <StatCard label="未回答" value={`${unanswered}問`} />
        <StatCard label="全体正答率" value={`${overall.accuracy}%`} helper={`${overall.total}回答`} />
      </div>
      <div className="action-stack">
        <button className="primary-button" onClick={() => onNavigate("quiz")} type="button">
          学習開始
        </button>
        {weakCount > 0 && (
          <button className="secondary-button" onClick={() => onStartPractice("weak")} type="button">
            苦手分野を練習（{weakCount}問）
          </button>
        )}
        {toneCount > 0 && (
          <button className="secondary-button" onClick={() => onStartPractice("tone")} type="button">
            トーン名から色を選ぶ（{toneCount}問）
          </button>
        )}
        <button className="secondary-button" onClick={() => onNavigate("review")} type="button">
          復習開始
        </button>
        <button className="text-button" onClick={() => onNavigate("stats")} type="button">
          成績を見る
        </button>
        <button className="text-button" onClick={() => onNavigate("settings")} type="button">
          設定を開く
        </button>
      </div>
    </div>
  );
}
