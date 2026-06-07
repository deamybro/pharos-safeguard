import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pharos SafeGuard",
  description: "PreFlight, WalletScan, and Sentinel security checks for Pharos Atlantic Testnet."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
