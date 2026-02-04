// Non-intrusive save status indicator component

interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'failed';
}

export default function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === 'idle' || status === 'failed') return null;

  const statusConfig = {
    saving: {
      text: 'Saving…',
      className: 'text-muted-foreground',
    },
    saved: {
      text: 'Saved',
      className: 'text-success',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`text-xs font-black tracking-wider uppercase ${config.className} smooth-transition`}>
      {config.text}
    </div>
  );
}
