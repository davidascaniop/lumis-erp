"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const SEMAFORO = {
  green: { color: "#00E5CC", icon: CheckCircle2, label: "Al día" },
  yellow: { color: "#FFB800", icon: Clock, label: "Por vencer" },
  red: { color: "#FF2D55", icon: AlertTriangle, label: "Vencido" },
} as const;

function getSemaforo(cliente: any) {
  if (!cliente?.credit_status) return null;
  return SEMAFORO[cliente.credit_status as keyof typeof SEMAFORO] ?? null;
}

export function ClientePicker({
  clientes,
  selected,
  onSelect,
  onClear,
}: {
  clientes: any[];
  selected: any | null;
  onSelect: (partner: any) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = clientes
    .filter(
      (c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.rif?.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 8);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      ref={containerRef}
      className="px-5 py-4 border-b border-white/5 flex-shrink-0 relative z-10"
    >
      {selected ? (
        /* ── CLIENTE SELECCIONADO ── */
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl
                                bg-[#18102A] border border-[rgba(224,64,251,0.20)]"
        >
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E040FB]/20 to-[#7C4DFF]/20
                                    flex items-center justify-center text-sm font-bold text-[#E040FB] flex-shrink-0"
          >
            {selected.name[0].toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white truncate">
                {selected.name}
              </p>
              {(() => {
                const s = getSemaforo(selected);
                if (!s) return null;
                const Icon = s.icon;
                return (
                  <span
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: `${s.color}15`, color: s.color }}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {s.label}
                  </span>
                );
              })()}
            </div>
            <p className="text-[11px] text-[#9585B8]">
              {selected.rif}
              {selected.credit_limit_usd > 0 && (
                <>
                  {" "}
                  · Límite{" "}
                  <span className="font-mono text-[#9585B8]">
                    ${Number(selected.credit_limit_usd).toFixed(2)}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Cambiar */}
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-[#9585B8]
                                       hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* ── BUSCADOR ── */
        <div>
          <div
            onClick={() => {
              setOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                                    bg-[#18102A] border border-white/[0.06] cursor-text
                                    focus-within:border-[rgba(224,64,251,0.40)]
                                    focus-within:shadow-[0_0_0_3px_rgba(224,64,251,0.08)]
                                    transition-all duration-200"
          >
            <Search className="w-4 h-4 text-[#3D2D5C] flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Buscar cliente por nombre o RIF..."
              className="bg-transparent text-sm text-white placeholder-[#3D2D5C]
                                       focus:outline-none flex-1"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[#3D2D5C] hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {open && filtered.length > 0 && (
            <div
              className="absolute left-5 right-5 top-full mt-1 z-50
                                        bg-[#1C1228] border border-white/[0.08] rounded-xl
                                        shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {filtered.map((c) => {
                const s = getSemaforo(c);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelect(c);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04]
                                                   cursor-pointer transition-colors border-b border-white/[0.04] last:border-0"
                  >
                    <div
                      className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E040FB]/15 to-[#7C4DFF]/15
                                                        flex items-center justify-center text-xs font-bold text-[#E040FB] flex-shrink-0"
                    >
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-[#9585B8]">{c.rif}</p>
                    </div>
                    {s && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          background: s.color,
                          boxShadow: `0 0 6px ${s.color}80`,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
