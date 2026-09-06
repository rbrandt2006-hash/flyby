import { useState, useCallback } from "react";
import { useBackendCollection } from "./useBackendCollection";

export interface ChatUser {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  isSystemMessage?: boolean;
  expenseId?: string;
  messageType?: "expense_submission" | "expense_approved" | "expense_disputed" | "expense_reimbursed" | "regular";
}

export interface ExpenseMetadata {
  merchant: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  submitterName: string;
  submittedAt: string;
}

export interface Chat {
  id: string;
  name: string;
  memberIds: string[];
  messages: ChatMessage[];
  createdAt: string;
  type?: "general" | "expense_approval";
  expenseId?: string;
  participantIds?: string[]; // For 1:1 chat lookup
  expenseMetadata?: ExpenseMetadata; // Store expense details for context card
}

// Team members data (shared with Team page)
// No fabricated teammates. Real workspace members come from the backend
// (see useTeam); this stays empty so nothing invented appears in chats
// or global search.
export const teamMembers: ChatUser[] = [];

// Supervisor lookup by name
export const supervisorMap: Record<string, ChatUser> = {};

// AI Assistant (virtual team member)
export const aiAssistant: ChatUser = {
  id: "ai-assistant",
  name: "Flyby AI",
  role: "Travel Assistant",
  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=flyby&backgroundColor=a3c5e0",
};

// Current user (mock)
export const currentUser: ChatUser = {
  id: "current",
  name: "Julia",
  role: "You",
  avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop",
};

// System user for automated messages
export const systemUser: ChatUser = {
  id: "system",
  name: "Flyby",
  role: "System",
  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=system&backgroundColor=cbd5e1",
};

const STORAGE_KEY = "flyby_chats";

export function useChats() {
  // Conversations are stored in the backend, so a thread opened on one device
  // is there on the next.
  const [chats, setChats] = useBackendCollection<Chat[]>({
    endpoint: "chats",
    payloadKey: "chats",
    cacheKey: STORAGE_KEY,
    initial: [],
  });
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Find existing 1:1 chat between current user and another participant
  const findExistingChat = useCallback((participantId: string): Chat | null => {
    return chats.find((chat) => {
      if (chat.participantIds) {
        const sorted = [...chat.participantIds].sort();
        const target = [currentUser.id, participantId].sort();
        return sorted[0] === target[0] && sorted[1] === target[1];
      }
      return false;
    }) || null;
  }, [chats]);

  // Find chat by expense ID
  const findChatByExpenseId = useCallback((expenseId: string): Chat | null => {
    return chats.find((chat) => chat.expenseId === expenseId) || null;
  }, [chats]);

  const createChat = useCallback((name: string, memberIds: string[], options?: {
    type?: "general" | "expense_approval";
    expenseId?: string;
    participantIds?: string[];
    expenseMetadata?: ExpenseMetadata;
  }): Chat => {
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      name,
      memberIds,
      messages: [],
      createdAt: new Date().toISOString(),
      type: options?.type || "general",
      expenseId: options?.expenseId,
      participantIds: options?.participantIds,
      expenseMetadata: options?.expenseMetadata,
    };
    setChats((prev) => [...prev, newChat]);
    return newChat;
  }, []);

  // Get or create a chat for expense approval
  const getOrCreateExpenseChat = useCallback((
    supervisorId: string,
    supervisorName: string,
    expenseId: string,
    expenseMetadata?: ExpenseMetadata
  ): Chat => {
    // First check if chat already exists for this expense
    const existingExpenseChat = chats.find((c) => c.expenseId === expenseId);
    if (existingExpenseChat) {
      // Update expense metadata if provided
      if (expenseMetadata && !existingExpenseChat.expenseMetadata) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === existingExpenseChat.id ? { ...c, expenseMetadata } : c
          )
        );
      }
      return existingExpenseChat;
    }

    // Check for existing 1:1 chat with supervisor
    const existingChat = findExistingChat(supervisorId);
    if (existingChat) {
      // Update the chat with expense ID reference and metadata
      setChats((prev) =>
        prev.map((c) =>
          c.id === existingChat.id ? { ...c, expenseId, expenseMetadata, type: "expense_approval" as const } : c
        )
      );
      return existingChat;
    }

    // Create new chat
    return createChat(`Chat with ${supervisorName}`, [supervisorId], {
      type: "expense_approval",
      expenseId,
      participantIds: [currentUser.id, supervisorId],
      expenseMetadata,
    });
  }, [chats, findExistingChat, createChat]);

  // Update expense status in chat metadata
  const updateExpenseStatus = useCallback((expenseId: string, status: string) => {
    setChats((prev) =>
      prev.map((c) =>
        c.expenseId === expenseId && c.expenseMetadata
          ? { ...c, expenseMetadata: { ...c.expenseMetadata } }
          : c
      )
    );
  }, []);

  const sendMessage = useCallback((
    chatId: string, 
    text: string, 
    senderId: string = currentUser.id, 
    autoReply: boolean = true,
    options?: {
      isSystemMessage?: boolean;
      expenseId?: string;
      messageType?: ChatMessage["messageType"];
    }
  ) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      text,
      createdAt: new Date().toISOString(),
      isSystemMessage: options?.isSystemMessage,
      expenseId: options?.expenseId,
      messageType: options?.messageType || "regular",
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      )
    );

    // Auto AI reply when user sends a message (only for non-system messages)
    if (autoReply && senderId === currentUser.id && !options?.isSystemMessage) {
      setTimeout(() => {
        const aiReplies = [
          "I can help refine this itinerary or suggest cheaper alternatives.",
          "Let me check for any policy conflicts with this booking.",
          "I found a few options that might work better for your schedule.",
          "Great choice! I'll prepare the booking details.",
          "Would you like me to compare pricing across different dates?",
        ];
        const aiReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];
        
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          senderId: "ai-assistant",
          text: aiReply,
          createdAt: new Date().toISOString(),
        };
        
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === chatId
              ? { ...chat, messages: [...chat.messages, aiMessage] }
              : chat
          )
        );
      }, 1000 + Math.random() * 500);
    }

    return newMessage;
  }, []);

  // Send system message for expense events
  const sendExpenseSystemMessage = useCallback((
    chatId: string,
    expenseId: string,
    messageType: ChatMessage["messageType"],
    content: string
  ) => {
    return sendMessage(chatId, content, "system", false, {
      isSystemMessage: true,
      expenseId,
      messageType,
    });
  }, [sendMessage]);

  // Post expense status update to chat
  const postExpenseUpdate = useCallback((
    chatId: string,
    expenseId: string,
    status: "approved" | "disputed" | "reimbursed",
    actorName: string
  ) => {
    const messages: Record<string, string> = {
      approved: `✅ Expense approved by ${actorName}`,
      disputed: `⚠️ Expense disputed by ${actorName}`,
      reimbursed: `💰 Expense marked as reimbursed`,
    };
    
    return sendExpenseSystemMessage(
      chatId,
      expenseId,
      `expense_${status}` as ChatMessage["messageType"],
      messages[status]
    );
  }, [sendExpenseSystemMessage]);

  const simulateReply = useCallback((chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat || chat.memberIds.length === 0) return;

    // Pick a random member to reply
    const randomMemberId = chat.memberIds[Math.floor(Math.random() * chat.memberIds.length)];
    
    const replies = [
      "Sounds good to me! 👍",
      "Let me check my calendar and get back to you.",
      "Great idea! When should we start?",
      "I'll loop in the rest of the team.",
      "Can we schedule a quick call to discuss?",
      "Perfect, I'm available tomorrow.",
      "Thanks for the update!",
    ];
    
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    
    setTimeout(() => {
      sendMessage(chatId, randomReply, randomMemberId, false);
    }, 1200);
  }, [chats, sendMessage]);

  const getChatById = useCallback((chatId: string) => {
    return chats.find((c) => c.id === chatId) || null;
  }, [chats]);

  const getLastMessage = useCallback((chat: Chat) => {
    if (chat.messages.length === 0) return null;
    return chat.messages[chat.messages.length - 1];
  }, []);

  const getMemberById = useCallback((memberId: string) => {
    if (memberId === currentUser.id) return currentUser;
    if (memberId === aiAssistant.id) return aiAssistant;
    if (memberId === systemUser.id) return systemUser;
    return teamMembers.find((m) => m.id === memberId) || null;
  }, []);

  // Get all expense approval chats
  const getExpenseApprovalChats = useCallback(() => {
    return chats.filter((c) => c.type === "expense_approval" || c.expenseId);
  }, [chats]);

  return {
    chats,
    selectedChatId,
    setSelectedChatId,
    createChat,
    sendMessage,
    simulateReply,
    getChatById,
    getLastMessage,
    getMemberById,
    findExistingChat,
    findChatByExpenseId,
    getOrCreateExpenseChat,
    sendExpenseSystemMessage,
    postExpenseUpdate,
    updateExpenseStatus,
    getExpenseApprovalChats,
    teamMembers,
    currentUser,
    systemUser,
    supervisorMap,
  };
}
