import type { Metadata } from "next";
import "./globals.css";
import "./blockly.css";

export const metadata: Metadata = {
  title: "OnyxBlock",
  description: "Visual programming environment for Onyx robots",
  icons: {
    // icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
