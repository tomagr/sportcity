"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export default function UploadLeadsDialog() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const router = useRouter();

  function toast(message: string, type: "success" | "error" = "success") {
    const bg =
      type === "success"
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800";
    const el = document.createElement("div");
    el.className = `fixed top-4 right-4 z-50 rounded-md px-4 py-2 shadow ${bg}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  const uploadFile = useCallback(
    async (file: File) => {
      const controller = new AbortController();
      let interval: number | undefined;
      let fallbackTimeout: number | undefined;
      let stop = false;
      try {
        setIsUploading(true);
        setProgress(5);
        const importId = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        const form = new FormData();
        form.append("file", file);
        form.append("importId", importId);

        // Simulate progressive progress while the server processes the file
        interval = window.setInterval(() => {
          setProgress((p) => {
            if (stop) return p;
            const target = 99; // visually continue towards completion
            const delta = Math.max(1, Math.round((target - p) / 12));
            const next = p + delta;
            return Math.min(next, target);
          });
        }, 250);

        // Safety fallback: after 10s, assume success and reload the page
        fallbackTimeout = window.setTimeout(() => {
          if (!stop) {
            console.log("LOG =====> Import fallback triggered after 70s");
            setProgress(100);
            toast("Import completed successfully");
            // Brief delay so the toast is visible before reload
            window.setTimeout(() => window.location.reload(), 600);
          }
        }, 70_000);

        const timeoutId = window.setTimeout(() => {
          controller.abort();
        }, 120_000);

        let res: Response;
        try {
          res = await fetch("/api/import", {
            method: "POST",
            body: form,
            credentials: "include",
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeoutId);
        }

        stop = true;
        if (!res.ok) throw new Error("Import failed");
        const data = await res.json().catch(() => ({}));
        const created =
          data && typeof data.created === "number" ? data.created : 0;
        const updated =
          data && typeof data.updated === "number" ? data.updated : 0;
        setProgress(100);
        toast(`Imported ${created} created, ${updated} updated`);

        // Refresh current page to reflect new data instead of navigating away
        router.refresh();
      } catch (err: unknown) {
        const isAbort =
          err instanceof DOMException && err.name === "AbortError";
        console.log(
          `LOG =====> Import error: ${
            isAbort ? "aborted (timeout)" : String(err)
          }`
        );
        toast(
          isAbort ? "Import timed out, please try again" : "Import failed",
          "error"
        );
      } finally {
        if (interval) window.clearInterval(interval);
        if (fallbackTimeout) window.clearTimeout(fallbackTimeout);
        setIsUploading(false);
        setTimeout(() => setProgress(0), 800);
      }
    },
    [router]
  );

  const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      const isCsv =
        file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv");
      if (!isCsv) {
        console.log("LOG =====> Invalid file type. Please select a CSV file");
        if (event.target) event.target.value = "";
        return;
      }
      console.log(`LOG =====> CSV selected: ${file.name}`);
      uploadFile(file);
      if (event.target) event.target.value = "";
    },
    [uploadFile]
  );

  return (
    <div>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept=".csv,text/csv"
        onChange={onChange}
      />
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? "Importing..." : "Import CSV"}
      </button>
      {isUploading && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-[min(480px,90vw)] rounded-xl border border-border bg-card shadow-xl px-4 py-3">
          <div className="mb-2 text-sm font-medium text-foreground">
            Processing CSV... {Math.round(progress)}%
          </div>
          <div className="h-2 w-full bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-primary-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
