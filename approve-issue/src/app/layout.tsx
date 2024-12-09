import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Approve Bytebase issue from Slack",
  description: "Approve Bytebase issue from Slack",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
