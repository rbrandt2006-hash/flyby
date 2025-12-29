import { useState, useEffect, useCallback } from "react";

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
}

export interface Chat {
  id: string;
  name: string;
  memberIds: string[];
  messages: ChatMessage[];
  createdAt: string;
}

// Team members data (shared with Team page)
export const teamMembers: ChatUser[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Product Manager",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Sales Director",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    id: "3",
    name: "Emily Watson",
    role: "Engineering Lead",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
  {
    id: "4",
    name: "David Kim",
    role: "UX Designer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  },
  {
    id: "5",
    name: "Lisa Martinez",
    role: "Account Executive",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
  },
  {
    id: "6",
    name: "James Wilson",
    role: "CFO",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  },
];

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

const STORAGE_KEY = "flyby_chats";

function loadChatsFromStorage(): Chat[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load chats from localStorage:", e);
  }
  return [];
}

function saveChatsToStorage(chats: Chat[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error("Failed to save chats to localStorage:", e);
  }
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>(() => loadChatsFromStorage());
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Persist chats to localStorage whenever they change
  useEffect(() => {
    saveChatsToStorage(chats);
  }, [chats]);

  const createChat = useCallback((name: string, memberIds: string[]): Chat => {
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      name,
      memberIds,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setChats((prev) => [...prev, newChat]);
    return newChat;
  }, []);

  const sendMessage = useCallback((chatId: string, text: string, senderId: string = currentUser.id, autoReply: boolean = true) => {
    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      text,
      createdAt: new Date().toISOString(),
    };

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, newMessage] }
          : chat
      )
    );

    // Auto AI reply when user sends a message
    if (autoReply && senderId === currentUser.id) {
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

  const simulateReply = useCallback((chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat || chat.memberIds.length === 0) return;

    // Pick a random member to reply
    const randomMemberId = chat.memberIds[Math.floor(Math.random() * chat.memberIds.length)];
    const member = teamMembers.find((m) => m.id === randomMemberId);
    
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
      sendMessage(chatId, randomReply, randomMemberId);
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
    return teamMembers.find((m) => m.id === memberId) || null;
  }, []);

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
    teamMembers,
    currentUser,
  };
}
