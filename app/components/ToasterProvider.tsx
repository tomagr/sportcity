"use client";

import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      expand
      toastOptions={{
        classNames: {
          toast: "shadow-lg",
        },
      }}
    />
  );
}
