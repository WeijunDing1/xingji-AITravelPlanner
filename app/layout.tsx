import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "行迹 TripCraft — AI 旅行规划师",
  description: "输入想法或截图，输出带地图路线、预算明细的完整攻略",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window._AMapSecurityConfig = { serviceHost: location.protocol + '//' + location.host + '/_AMapService' };`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--canvas)]">{children}</body>
    </html>
  );
}
