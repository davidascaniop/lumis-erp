"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, StickyNote, Paperclip, ArrowLeftRight, FileText,
  ZapIcon, ChevronDown, Loader2, Lock
} from "lucide-react";
import type { Chat, Message } from "@/hooks/use-chats";
import { createClient } from "@/lib/supabase/client";

const QUICK_REPLY_EXAMPLES = [
  { shortcut: "/hola",    title: "Saludo",      content: "Hola 👋 ¿En qué le podemos ayudar hoy?" },
  { shortcut: "/precios", title: "Precios",     content: "Nuestra lista de precios actualizada está disponible. ¿Se la enviamos?" },
  { shortcut: "/datos",   title: "Datos pago",  content: "Nuestros datos de pago son: Banco..., Cuenta..., RIF..." },
  { shortcut: "/gracias", title: "Despedida",   content: "Muchas gracias por comunicarse con nosotros. Que tenga un excelente día 🙌" },
];

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  loadingMessages: boolean;
  currentUserId: string;
  waSettings: { api_url: string; instance_name: string; api_token: string } | null;
  onSend: (content: string, isInternal: boolean) => Promise<void>;
  onAssign: (chatId: string, userId: string) => Promise<void>;
  onOpenTransfer: () => void;
}

function MessageBubble({ msg, currentUserId }: { msg: Message; currentUserId: string }) {
  const isOwn = msg.direction === "outbound";

  if (msg.is_internal) {
    return (
      <div className="flex justify-center my-2">
        <div className="max-w-[80%] bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-2 text-sm italic">
          <span className="text-[10px] font-bold uppercase text-amber-500 block mb-0.5">📋 Nota Interna</span>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isOwn
            ? "bg-brand text-white rounded-br-md"
            : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <p>{msg.content}</p>
        <p className={`text-[10px] mt-1 text-right ${isOwn ? "text-white/60" : "text-gray-400"}`}>
          {new Date(msg.created_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
          {isOwn && msg.status === "read" && " ✓✓"}
        </p>
      </div>
    </div>
  );
}

export function ChatWindow({
  chat, messages, loadingMessages, currentUserId,
  waSettings, onSend, onAssign, onOpenTransfer,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [quickReplies, setQuickReplies] = useState(QUICK_REPLY_EXAMPLES);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load company quick replies from DB if they exist
  useEffect(() => {
    async function loadQR() {
      const { data } = await supabase.from("crm_quick_replies").select("*").limit(20);
      if (data && data.length > 0) setQuickReplies(data as any);
    }
    loadQR();
  }, []);

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.startsWith("/")) {
      setShowSlash(true);
      setSlashFilter(val.slice(1).toLowerCase());
    } else {
      setShowSlash(false);
    }
  };

  const handleSelectReply = (content: string) => {
    setInput(content);
    setShowSlash(false);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await onSend(input.trim(), isInternal);
    setInput("");
    setSending(false);
  };

  const isUnassigned = !chat.assigned_to;

  const filteredReplies = quickReplies.filter(
    (r) =>
      r.shortcut.toLowerCase().includes(slashFilter) ||
      r.title.toLowerCase().includes(slashFilter)
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shadow-sm">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">
            {chat.contact_name || chat.contact_phone}
          </h3>
          <p className="text-[11px] text-gray-400">
            {chat.partner?.rif || chat.contact_phone}
            {chat.status === "sin_asignar" && (
              <span className="ml-2 text-amber-500 font-bold">• Sin asignar</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUnassigned ? (
            <button
              onClick={() => onAssign(chat.id, currentUserId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all"
            >
              <Lock className="w-3 h-3" /> Tomar Chat
            </button>
          ) : (
            <button
              onClick={onOpenTransfer}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-base border border-border text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-all"
            >
              <ArrowLeftRight className="w-3 h-3" /> Transferir
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <ZapIcon className="w-10 h-10 opacity-20" />
            <p className="text-sm">Inicia la conversación</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} currentUserId={currentUserId} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t bg-white px-4 py-3 transition-colors ${isInternal ? "bg-amber-50 border-amber-200" : ""}`}>
        
        {/* Slash menu */}
        {showSlash && filteredReplies.length > 0 && (
          <div className="mb-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {filteredReplies.map((r) => (
              <button
                key={r.shortcut}
                onClick={() => handleSelectReply(r.content)}
                className="w-full text-left px-4 py-2.5 hover:bg-brand/5 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
              >
                <span className="text-brand font-mono text-xs font-bold w-20 shrink-0">{r.shortcut}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{r.title}</p>
                  <p className="text-[11px] text-gray-500 truncate">{r.content}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setIsInternal(false)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
              !isInternal ? "bg-brand text-white" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            💬 Mensaje
          </button>
          <button
            onClick={() => setIsInternal(true)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all ${
              isInternal ? "bg-amber-400 text-white" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            📋 Nota Interna
          </button>
        </div>

        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isInternal ? "Escribe una nota interna… (solo visible para el equipo)" : "Escribe un mensaje… (usa / para respuestas rápidas)"}
            rows={2}
            className={`flex-1 resize-none text-sm rounded-xl border px-3 py-2.5 outline-none transition-all leading-relaxed ${
              isInternal
                ? "border-amber-300 bg-amber-50 text-amber-900 placeholder:text-amber-400 focus:ring-2 focus:ring-amber-200"
                : "border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
            }`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="h-10 w-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-brand hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {!waSettings?.api_url && (
          <p className="text-[10px] text-amber-600 mt-1.5">
            ⚠️ WhatsApp no configurado — los mensajes se guardarán pero no se enviarán al cliente.
          </p>
        )}
      </div>
    </div>
  );
}
