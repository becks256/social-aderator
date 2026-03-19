// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aderator",
  description: "Creative production pipeline for localized social ad campaigns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f9f9f8] text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
