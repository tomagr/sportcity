import Navbar from "../components/Navbar";
import UploadLeadsDialog from "@/app/components/UploadLeadsDialog";
import type { ReactNode } from "react";
import { verifySessionFromCookiesOnly } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await verifySessionFromCookiesOnly();
  if (!session) redirect("/login");
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-16 ">{children}</main>
      {/* Floating upload button */}
      <UploadLeadsDialog />
    </div>
  );
}
