import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "CloudGuard — Cloud Security & SOC Platform",
  description: "Professional cloud security monitoring and SOC operations platform.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased selection:bg-blue-600/30 selection:text-white">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
