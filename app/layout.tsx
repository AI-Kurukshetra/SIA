import type { ReactNode } from "react";
import type { Metadata } from "next";

import "@/app/globals.css";
import { appUrl } from "@/lib/env";

export const metadata: Metadata = {
  title: "SIA | Understand Any Server in Minutes",
  description:
    "SIA maps processes, services, ports, configs, and dependencies into human-readable server intelligence for DevOps teams.",
  metadataBase: new URL(appUrl)
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
