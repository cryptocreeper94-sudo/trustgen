import { useState, useEffect } from "react";

function getStoredTheme(): "dark" | "light" | "system" {
  try {
    const s = localStorage.getItem("dwtl-theme");
    if (s === "dark" || s === "light" || s === "system") return s as any;
  } catch {}
  return "dark";
}

function applyTheme(t: "dark" | "light" | "system") {
  const r = document.documentElement;
  r.classList.remove("dark", "light");
  if (t === "system") {
    r.classList.add(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  } else {
    r.classList.add(t);
  }
}

export function FloatingThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">(getStoredTheme);

  const go = (t: "dark" | "light" | "system") => {
    setTheme(t);
    localStorage.setItem("dwtl-theme", t);
    applyTheme(t);
  };

  useEffect(() => {
    applyTheme(theme);
    if (theme === "system") {
      const m = window.matchMedia("(prefers-color-scheme: dark)");
      const h = () => applyTheme("system");
      m.addEventListener("change", h);
      return () => m.removeEventListener("change", h);
    }
  }, [theme]);

  const icons = { dark: "\u{1F319}", light: "\u2600\uFE0F", system: "\u{1F5A5}\uFE0F" };
  const labels = { dark: "Dark", light: "Light", system: "Auto" };
  const next: Record<string, "dark" | "light" | "system"> = { dark: "light", light: "system", system: "dark" };

  return (
    <button
      onClick={() => go(next[theme])}
      style={{
        position: "fixed", bottom: 24, left: 24, zIndex: 9999,
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500,
        background: "var(--glass-bg, rgba(16,16,26,0.72))",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.08))",
        backdropFilter: "blur(12px)", color: "var(--text-primary, #fff)",
        cursor: "pointer", boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
      }}
      title={`Theme: ${theme}`}
    >
      <span>{icons[theme]}</span>
      <span style={{ color: "var(--text-muted, rgba(255,255,255,0.5))" }}>{labels[theme]}</span>
    </button>
  );
}
