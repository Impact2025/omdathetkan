import { create } from 'zustand';
import type { MessageWithSender, CoupleWithUsers, UserPublic } from '@pureliefde/shared';

interface ChatState {
  messages: MessageWithSender[];
  couple: CoupleWithUsers | null;
  partner: UserPublic | null;
  isPartnerTyping: boolean;
  isPartnerOnline: boolean;
  nextCursor: string | null;
  hasMoreMessages: boolean;

  setMessages: (messages: MessageWithSender[]) => void;
  addMessage: (message: MessageWithSender) => void;
  prependMessages: (messages: MessageWithSender[], cursor: string | null) => void;
  updateMessage: (messageId: string, updates: Partial<MessageWithSender>) => void;
  setCouple: (couple: CoupleWithUsers | null) => void;
  setPartner: (partner: UserPublic | null) => void;
  setPartnerTyping: (isTyping: boolean) => void;
  setPartnerOnline: (isOnline: boolean) => void;
  markMessageRead: (messageId: string) => void;
  addReaction: (messageId: string, reaction: MessageWithSender['reactions'][0]) => void;
  removeReaction: (messageId: string, reactionId: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  couple: null,
  partner: null,
  isPartnerTyping: false,
  isPartnerOnline: false,
  nextCursor: null,
  hasMoreMessages: true,

  setMessages: (messages) =>
    set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  prependMessages: (messages, cursor) =>
    set((state) => ({
      messages: [...messages, ...state.messages],
      nextCursor: cursor,
      hasMoreMessages: cursor !== null,
    })),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    })),

  setCouple: (couple) => set({ couple }),

  setPartner: (partner) => set({ partner }),

  setPartnerTyping: (isTyping) => set({ isPartnerTyping: isTyping }),

  setPartnerOnline: (isOnline) => set({ isPartnerOnline: isOnline }),

  markMessageRead: (messageId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, readAt: new Date() } : msg
      ),
    })),

  addReaction: (messageId, reaction) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, reactions: [...msg.reactions, reaction] }
          : msg
      ),
    })),

  removeReaction: (messageId, reactionId) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              reactions: msg.reactions.filter((r) => r.id !== reactionId),
            }
          : msg
      ),
    })),

  reset: () =>
    set({
      messages: [],
      couple: null,
      partner: null,
      isPartnerTyping: false,
      isPartnerOnline: false,
      nextCursor: null,
      hasMoreMessages: true,
    }),
}));
