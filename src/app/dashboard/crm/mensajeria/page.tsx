"use client";

import { useState } from "react";
import { MessageCircle, Zap } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useChats } from "@/hooks/use-chats";
import { ChatList } from "@/components/crm/mensajeria/ChatList";
import { ChatWindow } from "@/components/crm/mensajeria/ChatWindow";
import { ClientContext } from "@/components/crm/mensajeria/ClientContext";
import { WhatsAppSetup } from "@/components/crm/mensajeria/WhatsAppSetup";

export default function MensajeriaPage() {
  const { user } = useUser();
  const companyId = user?.company_id;

  const [waSettings, setWaSettings] = useState<any>(null);

  const {
    chats,
    selectedChat,
    setSelectedChat,
    messages,
    loading,
    loadingMessages,
    assignChat,
    sendMessage,
  } = useChats(companyId);

  const handleSend = async (content: string, isInternal: boolean) => {
    if (!selectedChat || !user?.id) return;
    await sendMessage(
      selectedChat.id,
      content,
      isInternal,
      user.id,
      waSettings,
      selectedChat.remote_jid
    );
  };

  const handleAssign = async (chatId: string) => {
    if (!user?.id) return;
    await assignChat(chatId, user.id);
    // Update local selected chat to reflect assignment
    setSelectedChat((prev: any) =>
      prev ? { ...prev, assigned_to: user.id, status: "activo" } : prev
    );
  };

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] -m-6 bg-gray-50 animate-fade-in">
      {/* Panel A: Chat List (20%) */}
      <div className="w-[22%] min-w-[220px] max-w-[300px] flex flex-col overflow-hidden">
        <ChatList
          chats={chats}
          selectedId={selectedChat?.id ?? null}
          currentUserId={user?.id ?? ""}
          isAdmin={isAdmin}
          onSelect={setSelectedChat}
        />
      </div>

      {/* Panel B: Chat Window (50%) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar inside panel B */}
        <div className="flex items-center justify-end px-4 py-2.5 bg-white border-b border-gray-100">
          {companyId && (
            <WhatsAppSetup companyId={companyId} onSettingsLoaded={setWaSettings} />
          )}
        </div>

        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            messages={messages}
            loadingMessages={loadingMessages}
            currentUserId={user?.id ?? ""}
            waSettings={waSettings}
            onSend={handleSend}
            onAssign={handleAssign}
            onOpenTransfer={() => {/* TODO: Transfer modal */}}
          />
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-8">
            <div className="w-24 h-24 rounded-3xl bg-brand/10 flex items-center justify-center">
              <MessageCircle className="w-12 h-12 text-brand opacity-60" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Centro de Mensajería</h3>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Selecciona una conversación para comenzar o espera nuevos mensajes de tus clientes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left max-w-sm w-full">
              {[
                { icon: "⚡", tip: "Usa / para respuestas rápidas" },
                { icon: "📋", tip: "Modo Nota para mensajes internos" },
                { icon: "📊", tip: "Datos financieros en tiempo real" },
                { icon: "🔗", tip: "Crea ventas sin salir del chat" },
              ].map((t) => (
                <div
                  key={t.tip}
                  className="flex items-start gap-2 p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                >
                  <span className="text-lg">{t.icon}</span>
                  <p className="text-xs text-gray-600 leading-tight">{t.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Panel C: Client Context (28%) */}
      <div className="w-[28%] min-w-[240px] max-w-[340px] overflow-hidden">
        {selectedChat ? (
          <ClientContext chat={selectedChat} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 p-8">
            <Zap className="w-10 h-10 opacity-20" />
            <p className="text-xs text-center">
              El contexto del cliente aparecerá aquí cuando selecciones una conversación.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
