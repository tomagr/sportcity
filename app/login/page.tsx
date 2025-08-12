import { redirect } from "next/navigation";
import { verifySessionFromCookiesOnly } from "@/lib/auth";
import LoginClient from "./LoginClient";

export default async function LoginPage() {
  const session = await verifySessionFromCookiesOnly();
  if (session) {
    redirect("/profile");
  }
  return <LoginClient />;
}
