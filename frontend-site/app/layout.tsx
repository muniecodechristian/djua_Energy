import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { ScrollToTop } from "@/components/scroll-to-top";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Djua Energy | Solutions solaires en RDC",
  description: "Djua Energy étudie, installe et entretient des systèmes solaires pour les maisons, commerces et entreprises en RDC.",
  icons: {
    icon: "/tech-plus-logo.jpg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
