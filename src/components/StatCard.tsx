type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
};

export default function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <section className="stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {helper && <span>{helper}</span>}
    </section>
  );
}
