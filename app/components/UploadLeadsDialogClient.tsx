"use client";

import dynamic from "next/dynamic";

const UploadLeadsDialog = dynamic(
  () => import("@/app/components/UploadLeadsDialog"),
  { ssr: false }
);

export default function UploadLeadsDialogClient() {
  return <UploadLeadsDialog />;
}
