import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import { AntdProvider } from "./antd-provider";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coulomb AI — Fleet Dashboard",
  description: "EV Fleet Financial Health Dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AntdProvider>{children}</AntdProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
