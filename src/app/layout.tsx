import type { Metadata } from "next";
import { Outfit, Archivo } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-data",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Customer Portal",
  description: "SpringAqua Customer Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${archivo.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="h-full font-sans text-text-primary bg-surface-base">{children}</body>
    </html>
  );
}
