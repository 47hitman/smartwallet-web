import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartWallet",
  description: "Smart Wallet - Kelola keuangan dengan cerdas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
