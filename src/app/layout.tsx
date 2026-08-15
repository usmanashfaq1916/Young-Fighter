import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ConnectivityProvider } from "@/components/providers/connectivity-provider";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker-registration";
import { ACADEMY_NAME } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://young-fighters-academy.vercel.app"),
  title: {
    default: `${ACADEMY_NAME} — Developing Tomorrow's Cricket Champions`,
    template: `%s | ${ACADEMY_NAME}`,
  },
  description:
    "Young Fighters Academy is a cricket academy developing tomorrow's champions — structured coaching, fitness training, match exposure and player development programs.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: ACADEMY_NAME,
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: ACADEMY_NAME,
    title: `${ACADEMY_NAME} — Developing Tomorrow's Cricket Champions`,
    description:
      "Cricket coaching, fitness training and match experience for young players. Apply for admission today.",
    url: "https://young-fighters-academy.vercel.app",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: `${ACADEMY_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${ACADEMY_NAME} — Developing Tomorrow's Cricket Champions`,
    description:
      "Cricket coaching, fitness training and match experience for young players. Apply for admission today.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#145c38" },
    { media: "(prefers-color-scheme: dark)", color: "#16263d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <ConnectivityProvider>
              {children}
              <ServiceWorkerRegistration />
            </ConnectivityProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
