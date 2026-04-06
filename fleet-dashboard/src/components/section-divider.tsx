"use client";

export function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3" style={{ marginBottom: 2 }}>
      <span style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--text4)", whiteSpace: "nowrap" }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}
