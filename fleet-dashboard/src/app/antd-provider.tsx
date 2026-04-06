"use client";

import { ConfigProvider, App, theme } from "antd";
import type { ReactNode } from "react";
import { useTheme, type ThemeMode } from "@/lib/theme-context";

function buildTheme(mode: ThemeMode) {
  const isDark = mode === "dark";
  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: "#4a9de0",
      colorBgLayout: isDark ? "#0e0f11" : "#f5f5f7",
      colorBgContainer: isDark ? "#1a1c20" : "#ffffff",
      colorBgElevated: isDark ? "#1f2126" : "#f0f0f2",
      colorBorder: isDark ? "#2a2c30" : "#e0e0e2",
      colorText: isDark ? "#e8e6e0" : "#1a1c20",
      colorTextSecondary: isDark ? "#9a9790" : "#6b6966",
      colorTextTertiary: isDark ? "#5a5855" : "#999590",
      colorSuccess: "#2ecc8a",
      colorWarning: "#f0a832",
      colorError: "#e05555",
      colorInfo: "#4a9de0",
      borderRadius: 10,
      fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    components: {
      Card: { colorBgContainer: isDark ? "#1a1c20" : "#ffffff" },
      Table: { colorBgContainer: isDark ? "#1a1c20" : "#ffffff", headerBg: isDark ? "#1f2126" : "#f8f8fa", headerColor: isDark ? "#5a5855" : "#999590", rowHoverBg: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)" },
      Drawer: { colorBgElevated: isDark ? "#141518" : "#ffffff" },
      Select: { colorBgContainer: isDark ? "#1a1c20" : "#ffffff" },
      Collapse: { colorBgContainer: isDark ? "#1a1c20" : "#ffffff", headerBg: "transparent" },
      Input: { colorBgContainer: isDark ? "#1a1c20" : "#ffffff" },
      Tag: { colorBorder: "transparent" },
    },
  };
}

export function AntdProvider({ children }: { children: ReactNode }) {
  const { theme: mode } = useTheme();
  return (
    <ConfigProvider theme={buildTheme(mode)}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
