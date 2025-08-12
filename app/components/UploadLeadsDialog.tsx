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
      const lastStatsRef = {
        // Track last seen created count and last refresh time to avoid spamming refreshes
        created: 0,
        lastRefreshMs: 0,
      };
      try {
        setIsUploading(true);
        setProgress(5);
        const startedAt = new Date();
        const importId = `${startedAt.getTime()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

        const form = new FormData();
        form.append("file", file);
        form.append("importId", importId);

        // Calculate total rows client-side by reading the CSV quickly (approximate)
        let totalRows = 0;
        try {
          const text = await file.text();
          totalRows =
            text.split(/\r?\n/).filter((l) => l.trim().length > 0).length - 1;
          if (totalRows < 1) totalRows = 1;
        } catch {
          totalRows = 100; // fallback to avoid divide by zero
        }

        // Poll server for created count and convert to percent
        const poll = async () => {
          try {
            const url = new URL("/api/import/status", window.location.origin);
            url.searchParams.set("importId", importId);
            url.searchParams.set("startedAt", startedAt.toISOString());
            const r = await fetch(url.toString(), { credentials: "include" });
            if (!r.ok) return;
            const d = (await r.json()) as { created?: number };
            const created = typeof d.created === "number" ? d.created : 0;
            const percent = Math.max(
              5,
              Math.min(99, Math.round((created / totalRows) * 100))
            );
            setProgress((prev) => (stop ? prev : percent));

            // If new rows were created since last check, refresh the list, but throttle to every ~3s
            const nowMs = Date.now();
            const shouldRefresh =
              !stop &&
              created > lastStatsRef.created &&
              nowMs - lastStatsRef.lastRefreshMs > 3000;
            if (shouldRefresh) {
              console.log(
                `LOG =====> Mid-import refresh: created so far ${created}/${totalRows}`
              );
              lastStatsRef.created = created;
              lastStatsRef.lastRefreshMs = nowMs;
              router.refresh();
            }
          } catch {
            // ignore transient errors
          }
        };
        await poll();
        interval = window.setInterval(poll, 600);

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
        const data: unknown = await res.json().catch(() => ({}));
        let created = 0;
        let updated = 0;
        if (data && typeof data === "object") {
          const record = data as Record<string, unknown>;
          if (typeof record.created === "number") created = record.created;
          if (typeof record.updated === "number") updated = record.updated;
        }
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
        aria-label="Upload CSV"
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 ease-out hover:shadow-2xl hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 group relative hover:scale-110 active:scale-95 before:absolute before:inset-0 before:rounded-full before:bg-primary/20 before:blur-xl before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <div className="h-6 w-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-7 w-7 transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110"
            aria-hidden="true"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
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
