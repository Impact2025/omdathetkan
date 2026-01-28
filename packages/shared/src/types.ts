// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  partnerId: string | null;
  createdAt: Date;
  lastSeen: Date;
}

export interface UserPublic {
  id: string;
  name: string;
  avatarUrl: string | null;
  lastSeen: Date;
}

// Couple types
export interface Couple {
  id: string;
  user1Id: string;
  user2Id: string;
  anniversaryDate: Date | null;
  createdAt: Date;
}

export interface CoupleWithUsers extends Couple {
  user1: UserPublic;
  user2: UserPublic;
}

// Message types
export type MessageType = 'text' | 'emoji' | 'sticker' | 'image' | 'video' | 'voice';

export interface Message {
  id: string;
  coupleId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  mediaUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface MessageWithSender extends Message {
  sender: UserPublic;
  reactions: Reaction[];
}

// Reaction types
export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

// WebSocket message types
export type WSMessageType =
  | 'message:new'
  | 'message:read'
  | 'message:reaction'
  | 'typing:start'
  | 'typing:stop'
  | 'presence:online'
  | 'presence:offline'
  | 'error';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  payload: T;
  timestamp: number;
}

export interface WSNewMessage {
  message: MessageWithSender;
}

export interface WSReadReceipt {
  messageId: string;
  readAt: Date;
}

export interface WSTypingIndicator {
  userId: string;
  coupleId: string;
}

export interface WSPresence {
  userId: string;
  lastSeen: Date;
}

export interface WSReaction {
  reaction: Reaction;
  messageId: string;
}

// API Request/Response types
export interface LoginRequest {
  email: string;
}

export interface LoginResponse {
  message: string;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SendMessageRequest {
  content: string;
  messageType: MessageType;
  mediaUrl?: string;
}

export interface GetMessagesRequest {
  limit?: number;
  cursor?: string;
}

export interface GetMessagesResponse {
  messages: MessageWithSender[];
  nextCursor: string | null;
}

export interface AddReactionRequest {
  emoji: string;
}

export interface UpdateCoupleRequest {
  anniversaryDate?: Date;
}

export interface InvitePartnerRequest {
  email: string;
}

export interface InvitePartnerResponse {
  inviteCode: string;
}

export interface AcceptInviteRequest {
  inviteCode: string;
}

// Media upload types
export interface UploadUrlRequest {
  filename: string;
  contentType: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

// Date counter types
export interface DateCounterData {
  anniversaryDate: Date;
  days: number;
  months: number;
  years: number;
  nextMilestone: Milestone | null;
}

export interface Milestone {
  type: 'days' | 'months' | 'years';
  value: number;
  date: Date;
  label: string;
}
