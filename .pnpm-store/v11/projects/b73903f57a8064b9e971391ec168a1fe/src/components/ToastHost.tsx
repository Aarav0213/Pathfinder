import { useEffect, useState } from "react";

type ToastTone = "error" | "success" | "info";

type Toast = {
  id: number;
  tone: ToastTone;
  message: string;
};

let counter = 0;

export function emitToast(tone: ToastTone, message: string) {
  window.dispatchEvent(new CustomEvent("app:toast", { detail: { tone, message } }));
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ tone: ToastTone; message: string }>).detail;
      if (!detail) return;
      const toast = { id: ++counter, ...detail };
      setToasts((current) => [...current, toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 3500);
    };

    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  return (
    <div className="fixed right-4 top-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            "max-w-sm rounded-2xl border px-4 py-3 shadow-soft backdrop-blur",
            toast.tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : toast.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-700",
          ].join(" ")}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
