import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Reid Sentinel",
      template: "%s · Reid Sentinel",
    },
    description:
      "An evidence-first early warning console for the dragons sheltering in Reid Library.",
    authors: [{ name: "4Freshers" }],
    openGraph: {
      title: "Reid Sentinel",
      description: "Failure had a shape. Now we can see it coming.",
      images: [{ url: `${origin}/og.png`, width: 1730, height: 909, alt: "Reid Sentinel early-warning signal card" }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Reid Sentinel",
      description: "Failure had a shape. Now we can see it coming.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
