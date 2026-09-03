import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevMegle",
  description: "Random pair programming rooms for developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
