import { useAuthStore } from '../stores/authStore';
import type {
  LoginRequest,
  VerifyTokenRequest,
  AuthResponse,
  SendMessageRequest,
  GetMessagesResponse,
  AddReactionRequest,
  UpdateCoupleRequest,
  InvitePartnerResponse,
  AcceptInviteRequest,
  UploadUrlResponse,
  User,
  MessageWithSender,
} from '@pureliefde/shared';

const API_BASE = '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Auto logout on 401 (invalid/expired token)
    if (response.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth
export async function login(data: LoginRequest) {
  const input = data.email.trim().toLowerCase();

  // Try dev-login first (direct login for development)
  if (input === 'tamar@pureliefde.nl' || input === 'vincent@pureliefde.nl') {
    try {
      const response = await fetchApi<AuthResponse>('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email: input }),
      });
      // Store directly and return
      useAuthStore.getState().setAuth(response.user, response.token);
      return { message: 'Logged in', directLogin: true };
    } catch {
      // Fall through to magic link if dev-login fails
    }
  }

  return fetchApi<{ message: string; token?: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyToken(data: VerifyTokenRequest) {
  return fetchApi<AuthResponse>('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getMe() {
  return fetchApi<{ user: User }>('/auth/me');
}

export async function updateProfile(data: { name?: string; avatarUrl?: string }) {
  return fetchApi<{ user: User }>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function logout() {
  return fetchApi<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
}

// Messages
export async function getMessages(cursor?: string, limit = 50) {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  params.set('limit', limit.toString());

  return fetchApi<GetMessagesResponse>(`/messages?${params}`);
}

export async function sendMessage(data: SendMessageRequest) {
  return fetchApi<{ message: MessageWithSender }>('/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function markMessageRead(messageId: string) {
  return fetchApi<{ success: boolean }>(`/messages/${messageId}/read`, {
    method: 'POST',
  });
}

export async function addReaction(messageId: string, data: AddReactionRequest) {
  return fetchApi<{ reaction: { id: string } } | { removed: boolean }>(
    `/messages/${messageId}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

// Couple
export async function getCouple() {
  return fetchApi<{
    couple: {
      id: string;
      anniversaryDate: string | null;
      createdAt: string;
      partner: {
        id: string;
        name: string;
        avatarUrl: string | null;
        lastSeen: string;
      } | null;
    } | null;
  }>('/couple');
}

export async function updateCouple(data: UpdateCoupleRequest) {
  return fetchApi<{ couple: unknown }>('/couple', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createInvite(email?: string) {
  return fetchApi<InvitePartnerResponse>('/couple/invite', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function acceptInvite(data: AcceptInviteRequest) {
  return fetchApi<{ couple: unknown }>('/couple/accept', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Media
export async function getUploadUrl(filename: string, contentType: string) {
  return fetchApi<UploadUrlResponse & { key: string }>('/media/upload-url', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType }),
  });
}

export async function uploadMedia(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    const token = useAuthStore.getState().token;

    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(file);
  });
}
