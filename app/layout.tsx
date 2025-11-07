import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hitster Online",
  description: "Online multiplayer version of Hitster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}



