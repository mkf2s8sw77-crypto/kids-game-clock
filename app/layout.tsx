import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LOGO_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "游戏计时 · kids-game-clock",
  description: "记录小孩每周游戏时长的轻量工具",
  icons: {
    icon: LOGO_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
