import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResumeInterview — AI Interview Prep",
  description:
    "Upload your resume and practice live AI voice mock interviews tailored to your skills and projects.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Required before TalkingHead loads — bare `three` imports won't resolve without this */}
        <script
          type="importmap"
          dangerouslySetInnerHTML={{ __html: talkingHeadImportMap }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
