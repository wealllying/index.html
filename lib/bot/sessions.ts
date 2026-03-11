// lib/bot/sessions.ts — In-memory conversation state for WhatsApp bot
// TODO: migrate to Supabase for persistence across deploys

export type BotStep =
  | 'idle'
  | 'send_amount'
  | 'send_recipient_name'
  | 'send_recipient_phone'
  | 'send_method'
  | 'send_confirm'
  | 'status_ref'
  // Family Wallet steps
  | 'wallet_menu'
  | 'wallet_create_name'
  | 'wallet_add_member_phone'
  | 'wallet_add_member_name'
  | 'wallet_topup_select'
  | 'wallet_topup_amount'
  | 'wallet_topup_confirm'
  | 'wallet_spend_amount'
  | 'wallet_spend_desc'
  | 'wallet_spend_confirm'
  | 'wallet_request_amount'
  | 'wallet_request_reason'
  | 'wallet_approve_select';

export interface SendDraft {
  amountUsd?: number;
  recipientName?: string;
  recipientPhone?: string;
  method?: 'atm' | 'agent' | 'bank';
}

export interface WalletDraft {
  walletId?: string;
  walletName?: string;
  memberPhone?: string;
  memberName?: string;
  amountUsd?: number;
  description?: string;
  requestId?: string;
}

export interface Session {
  phone: string;
  step: BotStep;
  draft: SendDraft;
  walletDraft: WalletDraft;
  lang: 'es' | 'en';
  lastActivity: number;
}

const sessions = new Map<string, Session>();

// Auto-expire sessions after 30 minutes of inactivity
const SESSION_TTL_MS = 30 * 60 * 1000;

export function getSession(phone: string): Session {
  const existing = sessions.get(phone);
  if (existing && Date.now() - existing.lastActivity < SESSION_TTL_MS) {
    existing.lastActivity = Date.now();
    return existing;
  }
  const fresh: Session = {
    phone,
    step: 'idle',
    draft: {},
    walletDraft: {},
    lang: 'es',
    lastActivity: Date.now(),
  };
  sessions.set(phone, fresh);
  return fresh;
}

export function updateSession(phone: string, updates: Partial<Session>) {
  const session = getSession(phone);
  Object.assign(session, updates, { lastActivity: Date.now() });
  sessions.set(phone, session);
}

export function resetSession(phone: string) {
  const session = getSession(phone);
  session.step = 'idle';
  session.draft = {};
  session.walletDraft = {};
  session.lastActivity = Date.now();
}

// Cleanup stale sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  const phones = Array.from(sessions.keys());
  for (const phone of phones) {
    const session = sessions.get(phone);
    if (session && now - session.lastActivity > SESSION_TTL_MS) {
      sessions.delete(phone);
    }
  }
}, 10 * 60 * 1000);
