import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "NexServe Portal", template: "%s · NexServe" },
  description: "NexServe corporate management portal — Sales, HR and administration.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0c2448",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" closeButton toastOptions={{ className: "text-sm" }} />
      </body>
    </html>
  );
}
