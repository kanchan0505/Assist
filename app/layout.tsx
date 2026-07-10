import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResumeInterview — AI Voice Interview Platform",
  description:
    "Practice live AI voice mock interviews tailored to your resume. Upload, analyze, and improve with real-time feedback.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const talkingHeadImportMap = JSON.stringify({
    imports: {
      three:
        "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js/+esm",
      "three/addons/":
        "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/",
    },
  });

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${outfit.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <script
          type="importmap"
          dangerouslySetInnerHTML={{ __html: talkingHeadImportMap }}
        />
      </head>
      <body className="min-h-full font-sans">
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
