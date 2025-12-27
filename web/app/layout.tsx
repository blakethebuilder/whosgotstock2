import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "WhosGotStock | South Africa's Premier IT Sourcing Platform",
  description: "Compare live inventory and pricing from South Africa's leading IT distributors. Find laptops, servers, networking equipment, and more from trusted suppliers in one search.",
  keywords: "IT sourcing, South Africa, computer hardware, laptops, servers, networking, distributor, wholesale, business technology",
  authors: [{ name: "Blake & AI" }],
  creator: "Blake & AI",
  publisher: "WhosGotStock",
  robots: "index, follow",
  openGraph: {
    title: "WhosGotStock | South Africa's Premier IT Sourcing Platform",
    description: "Compare live inventory and pricing from South Africa's leading IT distributors in one powerful search.",
    type: "website",
    locale: "en_ZA",
    siteName: "WhosGotStock"
  },
  twitter: {
    card: "summary_large_image",
    title: "WhosGotStock | South Africa's Premier IT Sourcing Platform",
    description: "Compare live inventory and pricing from South Africa's leading IT distributors in one powerful search."
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
