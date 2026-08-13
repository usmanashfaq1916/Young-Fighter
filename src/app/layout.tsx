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
  title: {
    default: `${ACADEMY_NAME} — Cricket Academy Management`,
    template: `%s | ${ACADEMY_NAME}`,
  },
  description:
    "Premium cricket academy management platform for administrators, coaches, students and parents.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: ACADEMY_NAME,
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f5a30" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1f3a" },
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
