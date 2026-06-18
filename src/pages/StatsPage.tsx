import StatCard from "../components/StatCard";
import type { AnswerLog, Question, ReviewState } from "../types";
import {
  getDifficultyStats,
  getFrequentMistakes,
  getOverallStats,
  getTagStats
} from "../utils/stats";

type StatsPageProps = {
  questions: Question[];
  logs: AnswerLog[];
  reviewStates: ReviewState[];
};

export default function StatsPage({ questions, logs, reviewStates }: StatsPageProps) {
  const overall = getOverallStats(logs);
  const tagStats = getTagStats(questions, logs);
  const difficultyStats = getDifficultyStats(questions, logs);
  const mistakes = getFrequentMistakes(questions, reviewStates);

  return (
    <div className="page-stack">
      <div className="stat-grid">
        <StatCard label="総回答数" value={overall.total} />
        <StatCard label="正答数" value={overall.correct} />
        <StatCard label="不正解数" value={overall.wrong} />
        <StatCard label="全体正答率" value={`${overall.accuracy}%`} />
      </div>

      <section className="list-panel">
        <h2>タグ別正答率</h2>
        {tagStats.length === 0 ? (
          <p>まだ回答履歴がありません。</p>
        ) : (
          tagStats.map((stat) => (
            <div className="rate-row" key={stat.name}>
              <span>{stat.name}</span>
              <strong>{stat.accuracy}%</strong>
              <small>{stat.correct} / {stat.total}</small>
            </div>
          ))
        )}
      </section>

      <section className="list-panel">
        <h2>difficulty別正答率</h2>
        {difficultyStats.length === 0 ? (
          <p>まだ回答履歴がありません。</p>
        ) : (
          difficultyStats.map((stat) => (
            <div className="rate-row" key={stat.name}>
              <span>{stat.name}</span>
              <strong>{stat.accuracy}%</strong>
              <small>{stat.correct} / {stat.total}</small>
            </div>
          ))
        )}
      </section>

      <section className="list-panel">
        <h2>よく間違える問題</h2>
        {mistakes.length === 0 ? (
          <p>まだ不正解の記録がありません。</p>
        ) : (
          mistakes.map((question) => (
            <article className="mistake-item" key={question.question_id}>
              <div>
                <strong>{question.prompt}</strong>
                <p>{question.tags.join(" / ")}</p>
              </div>
              <span>{question.wrong_count}回</span>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
