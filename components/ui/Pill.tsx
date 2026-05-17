// Pill — small status / tier label. Subtle, mono-cased, with optional gold-accent dot.

type Tone = "neutral" | "navy" | "gold" | "success" | "warn" | "down";

const tones: Record<Tone, string> = {
  neutral: "bg-paper-soft text-ink-muted ring-rule",
  navy: "bg-navy-soft text-navy ring-navy/20",
  gold: "bg-gold-soft text-gold ring-gold/30",
  success: "bg-[#E8F0E9] text-signal-up ring-signal-up/20",
  warn: "bg-[#F5E9D5] text-[#7E6126] ring-[#B69457]/30",
  down: "bg-[#F4DDD6] text-signal-down ring-signal-down/20",
};

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
};

export function Pill({ children, tone = "neutral", dot = false }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium font-mono tracking-wider uppercase ring-1 ring-inset ${tones[tone]}`}
    >
      {dot && <span className="w-1 h-1 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
