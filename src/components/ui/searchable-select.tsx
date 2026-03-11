import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "./input";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between h-10 px-3 py-2 text-sm bg-[#0F0A12]/80 border border-[#E040FB]/10 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E040FB]/40 text-[#F5EEFF]"
      >
        <span className="truncate">
          {selectedOption ? (
            selectedOption.label
          ) : (
            <span className="text-[#6B5280]">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="w-4 h-4 text-[#6B5280] shrink-0 opacity-50" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-[#1A1220]/95 backdrop-blur-xl border border-[#E040FB]/20 rounded-md shadow-lg overflow-hidden flex flex-col max-h-60"
          >
            <div className="flex items-center px-3 border-b border-[#E040FB]/10 shrink-0">
              <Search className="w-4 h-4 text-[#6B5280] mr-2 shrink-0" />
              <input
                className="w-full h-10 bg-transparent text-sm outline-none text-[#F5EEFF] placeholder:text-[#B8A0D0]/60"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="overflow-y-auto p-1 py-1">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-2 text-sm text-[#6B5280] text-center">
                  {emptyMessage}
                </p>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center px-3 py-2 text-sm rounded-sm text-left transition-colors",
                      value === option.value
                        ? "bg-[#E040FB]/20 text-white"
                        : "text-[#B8A0D0] hover:bg-[#E040FB]/10 hover:text-white",
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
