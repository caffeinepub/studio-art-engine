// Non-intrusive save status indicator with fixed width to prevent layout shift

interface SaveStatusIndicatorProps {
  status: "idle" | "saving" | "saved" | "failed";
}

export default function SaveStatusIndicator({
  status,
}: SaveStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      text: "",
      className: "opacity-0",
    },
    saving: {
      text: "Saving…",
      className: "text-muted-foreground opacity-100",
    },
    saved: {
      text: "Saved",
      className: "text-success opacity-100",
    },
    failed: {
      text: "",
      className: "opacity-0",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`text-xs font-black tracking-wider uppercase smooth-transition w-[60px] text-right flex-shrink-0 ${config.className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {config.text}
    </div>
  );
}
