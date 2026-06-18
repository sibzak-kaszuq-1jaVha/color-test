import { useCallback, useEffect, useState } from "react";
import Layout from "./components/Layout";
import type { AnswerLog, AppView, Question, ReviewState } from "./types";
import { loadQuestions } from "./utils/csv";
import { getAnswerLogs, getReviewStates } from "./utils/storage";
import HomePage from "./pages/HomePage";
import QuizPage from "./pages/QuizPage";
import ReviewPage from "./pages/ReviewPage";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [logs, setLogs] = useState<AnswerLog[]>(() => getAnswerLogs());
  const [reviewStates, setReviewStates] = useState<ReviewState[]>(() => getReviewStates());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshLocalData = useCallback(() => {
    setLogs(getAnswerLogs());
    setReviewStates(getReviewStates());
  }, []);

  const reloadCsv = useCallback(async (cacheBust = false) => {
    setLoading(true);
    setError("");
    try {
      setQuestions(await loadQuestions(cacheBust));
    } catch (loadError) {
      setQuestions([]);
      setError(loadError instanceof Error ? loadError.message : "CSVを読み込めませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadCsv();
  }, [reloadCsv]);

  const handleDataChanged = (nextLogs: AnswerLog[], nextReviewStates: ReviewState[]) => {
    setLogs(nextLogs);
    setReviewStates(nextReviewStates);
  };

  const renderPage = () => {
    if (loading) {
      return <p className="empty-message">CSVを読み込んでいます。</p>;
    }

    if (error) {
      return (
        <div className="empty-panel">
          <h2>CSV読み込みエラー</h2>
          <p>{error}</p>
          <button className="secondary-button" onClick={() => void reloadCsv(true)} type="button">
            もう一度読み込む
          </button>
        </div>
      );
    }

    switch (view) {
      case "quiz":
        return (
          <QuizPage
            logs={logs}
            questions={questions}
            reviewStates={reviewStates}
            onDataChanged={handleDataChanged}
          />
        );
      case "review":
        return (
          <ReviewPage
            logs={logs}
            questions={questions}
            reviewStates={reviewStates}
            onDataChanged={handleDataChanged}
          />
        );
      case "stats":
        return <StatsPage logs={logs} questions={questions} reviewStates={reviewStates} />;
      case "settings":
        return (
          <SettingsPage
            questions={questions}
            onDataImported={refreshLocalData}
            onReloadCsv={() => void reloadCsv(true)}
            onReset={refreshLocalData}
          />
        );
      case "home":
      default:
        return (
          <HomePage
            logs={logs}
            questions={questions}
            reviewStates={reviewStates}
            onNavigate={setView}
          />
        );
    }
  };

  return (
    <Layout currentView={view} onNavigate={setView}>
      {renderPage()}
    </Layout>
  );
}
