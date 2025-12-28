import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning className="">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const effectiveTheme = theme === 'system' || !theme ? systemTheme : theme;
                document.documentElement.classList.add(effectiveTheme);
              } catch (e) {
                document.documentElement.classList.add('light');
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
