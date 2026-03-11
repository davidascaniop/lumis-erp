import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  variant?: "default" | "success";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${
          variant === "success" ? "bg-status-ok/10" : "bg-brand/10"
        }`}
      >
        <Icon
          className={`w-10 h-10 ${variant === "success" ? "text-status-ok/50" : "text-brand/50"}`}
        />
      </div>
      <h3 className="text-lg font-syne font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-text-2 max-w-sm mb-6">{description}</p>
      {action &&
        (action.href ? (
          <Link
            href={action.href}
            className="px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold
                       shadow-brand hover:opacity-90 transition-opacity"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-sm font-semibold
                       shadow-brand hover:opacity-90 transition-opacity"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
