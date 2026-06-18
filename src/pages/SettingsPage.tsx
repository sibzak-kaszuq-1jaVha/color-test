import { useRef, useState } from "react";
import type { AnswerLog, Question, ReviewState } from "../types";
import {
  exportLearningData,
  importLearningData,
  resetLearningData
} from "../utils/storage";

type SettingsPageProps = {
  questions: Question[];
  onDataImported: () => void;
  onReset: () => void;
  onReloadCsv: () => void;
};

export default function SettingsPage({
  questions,
  onDataImported,
  onReset,
  onReloadCsv
}: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const handleExport = () => {
    const blob = new Blob([exportLearningData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `color-test-learning-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("学習履歴を書き出しました。");
  };

  const handleImport = async (file?: File) => {
    if (!file) {
      return;
    }
    try {
      importLearningData(await file.text());
      onDataImported();
      setMessage("学習履歴を読み込みました。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "読み込みに失敗しました。");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleReset = () => {
    const confirmed = window.confirm("学習履歴をリセットします。元に戻すには事前のエクスポートが必要です。");
    if (!confirmed) {
      return;
    }
    resetLearningData();
    onReset();
    setMessage("学習履歴をリセットしました。");
  };

  return (
    <div className="page-stack">
      <section className="list-panel">
        <h2>CSV</h2>
        <p>現在 {questions.length} 問を読み込んでいます。</p>
        <button className="secondary-button" onClick={onReloadCsv} type="button">
          CSV再読み込み
        </button>
      </section>

      <section className="list-panel">
        <h2>学習履歴</h2>
        <div className="action-stack">
          <button className="primary-button" onClick={handleExport} type="button">
            学習履歴エクスポート
          </button>
          <button
            className="secondary-button"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            学習履歴インポート
          </button>
          <button className="danger-button" onClick={handleReset} type="button">
            学習履歴リセット
          </button>
        </div>
        <input
          accept="application/json"
          className="hidden-input"
          onChange={(event) => void handleImport(event.target.files?.[0])}
          ref={fileInputRef}
          type="file"
        />
        {message && <p className="status-message">{message}</p>}
      </section>
    </div>
  );
}

export type ImportedLearningData = {
  answer_logs: AnswerLog[];
  review_states: ReviewState[];
};
