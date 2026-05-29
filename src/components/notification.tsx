type NotificationProps = {
  error?: string;
  success?: string;
};

export function Notification({ error, success }: NotificationProps) {
  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={`mt-6 rounded-xl border px-4 py-3 text-sm font-semibold ${
        error
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-orange-500/30 bg-orange-500/10 text-orange-200"
      }`}
    >
      {error || success}
    </div>
  );
}
