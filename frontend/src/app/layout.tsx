import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AIVAProvider } from "@/providers/AIVAProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AIVA | AI Virtual Advisor",
  description:
    "AI-powered financial advisor workstation for wealth management professionals",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="bg-[var(--aiva-bg)] text-[var(--aiva-text-primary)] font-sans antialiased min-h-screen transition-colors duration-200">
        <AIVAProvider>{children}</AIVAProvider>
      </body>
    </html>
  );
}
