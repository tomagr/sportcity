"use client";
import { useEffect, useState, useRef } from "react";

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/users", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (!mounted) return;
        setUser(data.user);
        setEmail(data.user.email || "");
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");
      } catch (e) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-save profile changes with debounce
  useEffect(() => {
    if (loading || !user) return;
    if (!initializedRef.current) {
      // Skip the first run right after initial load
      initializedRef.current = true;
      return;
    }
    setError(null);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setSuccess(null);
      try {
        const res = await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            firstName: firstName || null,
            lastName: lastName || null,
          }),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to update profile");
        setSuccess("Profile updated");
        // Briefly show success then clear
        setTimeout(() => setSuccess(null), 1500);
      } catch (e) {
        setError("Failed to update profile");
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [email, firstName, lastName, loading, user]);

  async function handleAvatarFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setError(null);
    setSuccess(null);
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    setIsUploading(true);
    setUploadProgress(0);
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/users/${user.id}/avatar`);
        xhr.withCredentials = true;
        xhr.responseType = "json";

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error"));
        };

        xhr.onload = () => {
          const status = xhr.status;
          if (status >= 200 && status < 300) {
            const data = (xhr.response ?? null) as { avatarUrl?: string } | null;
            const avatarUrl = data?.avatarUrl;
            if (avatarUrl) {
              setUser({ ...(user as User), avatarUrl });
              setSuccess("Avatar uploaded");
              if (fileInputRef.current) fileInputRef.current.value = "";
              setUploadProgress(100);
              resolve();
            } else {
              reject(new Error("Invalid server response"));
            }
          } else {
            reject(new Error("Failed to upload avatar"));
          }
        };

        xhr.send(form);
      });
    } catch (err) {
      setError("Failed to upload avatar");
    } finally {
      setTimeout(() => setUploadProgress(null), 600);
      setIsUploading(false);
    }
  }

  if (loading)
    return <div className="container max-w-2xl mx-auto py-10">Loading…</div>;
  if (error)
    return (
      <div className="container max-w-2xl mx-auto py-10 rounded-md border border-error-500 bg-error-500/10 p-3 text-sm text-error-500">
        {error}
      </div>
    );
  if (!user)
    return (
      <div className="container max-w-2xl mx-auto py-10 rounded-md border border-error-500 bg-error-500/10 p-3 text-sm text-error-500">
        No user
      </div>
    );

  return (
    <div className="container max-w-2xl mx-auto py-10">
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">Your profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your personal information and avatar.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {isSaving && (
              <div className="mt-1 text-xs text-muted-foreground">Saving…</div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="firstName"
              >
                First name
              </label>
              <input
                id="firstName"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor="lastName"
              >
                Last name
              </label>
              <input
                id="lastName"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-border">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">
                  👤
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={handleAvatarFileChange}
            />
          </div>
          {uploadProgress !== null && (
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded bg-neutral-200">
                <div
                  style={{ width: `${uploadProgress}%` }}
                  className="h-full bg-primary-500 transition-[width] duration-150 ease-linear"
                />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {uploadProgress}%
              </div>
            </div>
          )}
        </div>

        {success && (
          <div className="mt-6 rounded-md border border-success-500 bg-success-500/10 p-3 text-sm text-success-500">
            {success}
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-md border border-error-500 bg-error-500/10 p-3 text-sm text-error-500">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
