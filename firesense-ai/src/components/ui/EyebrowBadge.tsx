import { ReactNode } from "react";

interface EyebrowBadgeProps {
  label: string;
  icon?: ReactNode;
  className?: string;
}

export default function EyebrowBadge({ label, icon, className = "" }: EyebrowBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/40 backdrop-blur-md px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-zinc-600 ${className}`}>
      {icon && <span className="text-zinc-400">{icon}</span>}
      {label}
    </div>
  );
}
