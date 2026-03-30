"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "brand" | "danger" | "success";
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "brand",
  loading = false,
}: ConfirmationModalProps) {
  
  const iconMap = {
    brand: <HelpCircle className="w-12 h-12 text-[#E040FB]" />,
    danger: <AlertCircle className="w-12 h-12 text-status-danger" />,
    success: <CheckCircle2 className="w-12 h-12 text-status-ok" />,
  };

  const buttonVariants = {
    brand: "bg-brand-gradient hover:opacity-90 shadow-brand text-white border-none",
    danger: "bg-status-danger hover:bg-status-danger/90 text-white border-none",
    success: "bg-status-ok hover:bg-status-ok/90 text-white border-none",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] border-[#E040FB]/20 bg-white/95 backdrop-blur-2xl p-0 overflow-hidden rounded-3xl shadow-2xl">
        <div className="p-8 flex flex-col items-center text-center">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 p-4 rounded-full bg-[#E040FB]/10 border border-[#E040FB]/10"
          >
            {iconMap[variant]}
          </motion.div>
          
          <DialogHeader className="p-0 space-y-2">
            <DialogTitle className="text-2xl font-bold text-slate-900 font-primary">
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm leading-relaxed px-2">
              {description}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-8 flex flex-row items-center justify-center gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 h-12 rounded-2xl font-bold transition-all active:scale-95 ${buttonVariants[variant]}`}
            >
              {loading ? (
                <div className="flex items-center gap-2 text-white">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  <span>Procesando...</span>
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
