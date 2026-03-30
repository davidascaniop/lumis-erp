"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MessageCircle, Clock, User } from "lucide-react";
import type { Chat } from "@/hooks/use-chats";

const TAG_STYLES: Record<string, string> = {
  deudor:  "bg-red-100 text-red-700 border border-red-200",
  lead:    "bg-blue-100 text-blue-700 border border-blue-200",
  urgente: "bg-amber-100 text-amber-700 border border-amber-200",
};

type Tab = "mis_chats" | "sin_asignar" | "todos";

interface ChatListProps {
  chats: Chat[];
  selectedId: string | null;
  currentUserId: string;
  isAdmin: boolean;
  onSelect: (chat: Chat) => void;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function ChatList({ chats, selectedId, currentUserId, isAdmin, onSelect }: ChatListProps) {
  const [tab, setTab] = useState<Tab>("todos");
  const [search, setSearch] = useState("");

  const tabs: { key: Tab; label: string }[] = [
    { key: "mis_chats",    label: "Mis Chats" },
    { key: "sin_asignar",  label: "Sin Asignar" },
    ...(isAdmin ? [{ key: "todos" as Tab, label: "Todos" }] : []),
  ];

  const filtered = chats.filter((c) => {
    const matchSearch =
      !search ||
      c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_phone?.includes(search);

    const matchTab =
      tab === "todos" ||
      (tab === "mis_chats" && c.assigned_to === currentUserId) ||
      (tab === "sin_asignar" && !c.assigned_to);

    return matchSearch && matchTab;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand" />
          Mensajería
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
              tab === t.key
                ? "text-brand border-b-2 border-brand"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <MessageCircle className="w-8 h-8 opacity-30" />
            <p className="text-xs">No hay conversaciones</p>
          </div>
        ) : (
          filtered.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelect(chat)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-all group ${
                selectedId === chat.id ? "bg-brand/5 border-l-2 border-l-brand" : ""
              }`}
            >
              {/* Row 1: Avatar + Name + Time */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold shrink-0">
                    {(chat.contact_name || "?").substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {chat.contact_name || chat.contact_phone || chat.remote_jid}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 ml-1">
                  {timeAgo(chat.last_message_at)}
                </span>
              </div>

              {/* Row 2: Last message + badge */}
              <div className="flex items-center justify-between pl-11">
                <p className="text-xs text-gray-500 truncate flex-1">
                  {chat.last_message || "Sin mensajes"}
                </p>
                {chat.unread_count > 0 && (
                  <span className="ml-2 min-w-[18px] h-[18px] rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center px-1 shrink-0">
                    {chat.unread_count}
                  </span>
                )}
              </div>

              {/* Row 3: Tags + Assignee */}
              {(chat.tags.length > 0 || chat.assignee) && (
                <div className="flex items-center gap-1.5 pl-11 mt-1.5 flex-wrap">
                  {chat.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${TAG_STYLES[tag] || "bg-gray-100 text-gray-600"}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {chat.assignee && (
                    <span className="flex items-center gap-1 text-[9px] text-gray-400 ml-auto">
                      <User className="w-2.5 h-2.5" />
                      {(chat.assignee as any).full_name?.split(" ")[0]}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
