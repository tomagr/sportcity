import Navbar from "../components/Navbar";
import type { ReactNode } from "react";
import { verifySessionFromCookiesOnly } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const session = await verifySessionFromCookiesOnly();
  if (!session) redirect("/login");
  return (
    <div className="container">
      <Navbar />
      {children}
    </div>
  );
}
