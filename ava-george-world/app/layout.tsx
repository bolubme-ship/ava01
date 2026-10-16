import type { Metadata } from "next";
import { Cormorant_Garamond, Fredoka, Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Ava & George World — The Heritage Collection",
  description: "African childhood, beautifully imagined. Colour, culture and craftsmanship for little lives everywhere.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${cormorant.variable} ${fredoka.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
