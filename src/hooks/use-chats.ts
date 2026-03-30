"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type Chat = {
  id: string;
  partner_id: string | null;
  remote_jid: string;
  contact_name: string | null;
  contact_phone: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  assigned_to: string | null;
  status: "sin_asignar" | "activo" | "cerrado";
  tags: string[];
  partner?: { id: string; name: string; rif: string; current_balance: number };
  assignee?: { id: string; full_name: string };
};

export type Message = {
  id: string;
  chat_id: string;
  content: string;
  message_type: "text" | "image" | "pdf" | "audio";
  direction: "inbound" | "outbound";
  is_internal: boolean;
  sent_by: string | null;
  created_at: string;
  status: string;
};

export function useChats(companyId: string | undefined) {
  const supabase = createClient();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const channelRef = useRef<any>(null);

  // Fetch chats list
  const fetchChats = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("crm_chats")
      .select(`
        *,
        partner:partner_id (id, name, rif, current_balance),
        assignee:assigned_to (id, full_name)
      `)
      .eq("company_id", companyId)
      .neq("status", "cerrado")
      .order("last_message_at", { ascending: false });
    setChats((data as any) || []);
    setLoading(false);
  }, [companyId]);

  // Fetch messages for a chat
  const fetchMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from("crm_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    setLoadingMessages(false);
  }, []);

  // Real-time: subscribe to new messages for the selected chat
  useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.id);

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel(`messages:${selectedChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crm_messages",
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [selectedChat?.id]);

  // Real-time: subscribe to chat list updates
  useEffect(() => {
    if (!companyId) return;
    fetchChats();

    const chatChannel = supabase
      .channel(`chats:${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "crm_chats",
          filter: `company_id=eq.${companyId}`,
        },
        () => fetchChats()
      )
      .subscribe();

    return () => supabase.removeChannel(chatChannel);
  }, [companyId, fetchChats]);

  // Assign a chat to current user
  const assignChat = async (chatId: string, userId: string) => {
    await supabase
      .from("crm_chats")
      .update({ assigned_to: userId, status: "activo" })
      .eq("id", chatId);
    await fetchChats();
  };

  // Send a message (outbound or internal note)
  const sendMessage = async (
    chatId: string,
    content: string,
    isInternal: boolean,
    userId: string,
    waSettings: { api_url: string; instance_name: string; api_token: string } | null,
    remoteJid: string
  ) => {
    // 1. Insert message in DB
    await supabase.from("crm_messages").insert({
      chat_id: chatId,
      company_id: selectedChat?.partner?.id ? undefined : undefined,
      content,
      direction: "outbound",
      is_internal: isInternal,
      sent_by: userId,
    });

    // 2. Send via WhatsApp API if not internal note
    if (!isInternal && waSettings?.api_url && waSettings.instance_name) {
      try {
        await fetch(
          `${waSettings.api_url}/message/sendText/${waSettings.instance_name}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: waSettings.api_token,
            },
            body: JSON.stringify({ number: remoteJid, text: content }),
          }
        );
      } catch (err) {
        console.error("WhatsApp send error:", err);
      }
    }

    // 3. Update last_message on the chat
    await supabase
      .from("crm_chats")
      .update({ last_message: content, last_message_at: new Date().toISOString() })
      .eq("id", chatId);
  };

  return {
    chats,
    selectedChat,
    setSelectedChat,
    messages,
    loading,
    loadingMessages,
    assignChat,
    sendMessage,
    fetchChats,
  };
}
