"use client";

/**
 * Unified Modal / Form Design System
 *
 * Use these constants and components across all modals to guarantee a
 * consistent, professional look throughout the product.
 *
 * Quick-start:
 *   import { MF_INPUT, MF_LABEL, ModalHeader, ModalFooter, FormField } from "@/components/ui/modal-form";
 */

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import {
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ─── CSS token constants ──────────────────────────────────────────────────────

/** Standard text input / number input */
export const MF_INPUT =
  "w-full h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 text-sm rounded-xl shadow-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors";

/** Field label */
export const MF_LABEL =
  "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-montserrat";

/** Multi-line textarea */
export const MF_TEXTAREA =
  "w-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors resize-none min-h-[88px]";

/** shadcn SelectTrigger height / border */
export const MF_SELECT =
  "h-11 w-full bg-white border-slate-200 text-slate-900 text-sm rounded-xl shadow-none focus:ring-1 focus:ring-brand";

// ─── FormField ────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps any form control with a consistent label, optional hint, and error
 * message below.  Pass `label` to render the field label automatically.
 */
export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className={MF_LABEL}>
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[10px] text-slate-400 font-montserrat">{hint}</p>
      )}
      {error && (
        <p className="text-[10px] text-red-500 font-montserrat">{error}</p>
      )}
    </div>
  );
}

// ─── FormSection ──────────────────────────────────────────────────────────────

interface FormSectionProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Groups related fields under an optional section heading (with a top divider).
 */
export function FormSection({
  title,
  icon,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="flex items-center gap-2 border-t border-slate-100 pt-5">
          {icon && <span className="text-slate-400">{icon}</span>}
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-montserrat">
            {title}
          </h4>
        </div>
      )}
      {children}
    </div>
  );
}

// ─── ModalHeader ─────────────────────────────────────────────────────────────

interface ModalHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  /** Optional icon node (e.g., <Layers className="w-5 h-5" />) */
  icon?: ReactNode;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

/**
 * Consistent modal header for `p-0` DialogContent modals.
 * Includes a right padding so the built-in Dialog close (X) button
 * from the Dialog primitive never overlaps the title.
 *
 * Usage:
 *   <DialogContent className="sm:max-w-[560px] p-0 bg-white border-slate-200 ...">
 *     <ModalHeader title="My Modal" eyebrow="Section" icon={<Icon />} />
 *     …body…
 *   </DialogContent>
 */
export function ModalHeader({
  title,
  description,
  eyebrow,
  icon,
  iconColor = "text-brand",
  iconBg = "bg-brand/10",
  className,
}: ModalHeaderProps) {
  return (
    <div
      className={cn(
        "px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3",
        /* pr-14 ensures the Dialog's built-in X button (absolute right-4 top-4)
           never overlaps the header text */
        "pr-14 shrink-0",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            iconBg,
            iconColor,
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5 font-montserrat">
            {eyebrow}
          </p>
        )}
        <DialogTitle className="text-xl font-bold text-slate-900 leading-none">
          {title}
        </DialogTitle>
        {description && (
          <DialogDescription className="text-slate-500 text-sm mt-1 leading-snug">
            {description}
          </DialogDescription>
        )}
      </div>
    </div>
  );
}

// ─── ModalFooter ─────────────────────────────────────────────────────────────

interface ModalFooterProps {
  onCancel?: () => void;
  /** Label for the primary submit button */
  submitLabel?: string;
  /** Label shown while loading */
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Icon shown on the left of the submit button label when not loading */
  icon?: ReactNode;
  /** Optional content rendered on the left side of the footer (e.g., a counter) */
  leftContent?: ReactNode;
  className?: string;
}

/**
 * Consistent footer for `p-0` modals.  Place it as the last child inside
 * your form element so `type="submit"` wires up correctly.
 *
 * Usage:
 *   <form onSubmit={handleSubmit} className="flex flex-col" style={{ maxHeight: "80vh" }}>
 *     <div className="flex-1 overflow-y-auto p-6 space-y-5">…fields…</div>
 *     <ModalFooter onCancel={() => setOpen(false)} submitLabel="Guardar" loading={saving} />
 *   </form>
 */
export function ModalFooter({
  onCancel,
  submitLabel = "Guardar",
  loadingLabel = "Guardando...",
  loading = false,
  disabled = false,
  icon,
  leftContent,
  className,
}: ModalFooterProps) {
  return (
    <div
      className={cn(
        "px-6 py-4 bg-slate-50/50 border-t border-slate-100",
        "flex items-center justify-between shrink-0",
        className,
      )}
    >
      <div className="text-[11px] text-slate-500 font-montserrat">
        {leftContent}
      </div>
      <div className="flex items-center gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 transition-colors font-montserrat"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || disabled}
          className="px-6 py-2.5 bg-gradient-to-r from-[#E040FB] to-[#7C4DFF] text-white text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-lg hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center gap-2 font-montserrat"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
          {loading ? loadingLabel : submitLabel}
        </button>
      </div>
    </div>
  );
}
