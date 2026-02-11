import type { Metadata } from "next";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://chain-bias-dashboard.vercel.app"),
  title: "Chain Bias Dashboard",
  description:
    "Which blockchain do AI models default to? Measuring chain bias across LLMs.",
  openGraph: {
    title: "Chain Bias Dashboard",
    description:
      "Which blockchain do AI models default to? Measuring chain bias across LLMs.",
    url: "https://chain-bias-dashboard.vercel.app",
    siteName: "Chain Bias Dashboard",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chain Bias Dashboard",
    description:
      "Which blockchain do AI models default to? Measuring chain bias across LLMs.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#1a1a2e] text-[#e0e0e0]">
        <Nav />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
