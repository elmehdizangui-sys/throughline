import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono, Instrument_Serif, Source_Serif_4 } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
});
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif" });

export const metadata: Metadata = {
  title: "Throughline",
  description: "A journal for the line through your life.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={[
          inter.variable,
          fraunces.variable,
          jetbrainsMono.variable,
          instrumentSerif.variable,
          sourceSerif.variable,
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
