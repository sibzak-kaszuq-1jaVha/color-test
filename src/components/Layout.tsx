import type { AppView } from "../types";

type LayoutProps = {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  children: React.ReactNode;
};

const navItems: Array<{ view: AppView; label: string }> = [
  { view: "home", label: "ホーム" },
  { view: "quiz", label: "出題" },
  { view: "review", label: "復習" },
  { view: "stats", label: "成績" },
  { view: "settings", label: "設定" }
];

export default function Layout({ currentView, onNavigate, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">色彩検定1級2次</p>
          <h1>慣用色名トレーニング</h1>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="画面切り替え">
        {navItems.map((item) => (
          <button
            className={currentView === item.view ? "nav-button active" : "nav-button"}
            key={item.view}
            onClick={() => onNavigate(item.view)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
