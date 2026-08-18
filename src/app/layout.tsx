import type { Metadata } from "next";
import "../index.css";
export const metadata: Metadata = { title: "CareMetrics", description: "Care operations management" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
