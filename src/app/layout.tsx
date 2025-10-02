import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans, GeistMono } from "geist/font";
import "./globals.css";
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TRPCReactProvider } from '@/lib/trpc/provider';
import { AuthInitializer } from '@/components/providers/auth-initializer';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "spray Community - Admin Platform",
  description: "Community-driven perfume database administration platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TRPCReactProvider>
              <AuthInitializer>
                {children}
              </AuthInitializer>
            </TRPCReactProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
