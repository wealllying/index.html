// lib/bot/wallet.ts — In-memory Family Wallet data layer
// TODO: migrate to Supabase for persistence across deploys

// ── Types ──

export type WalletRole = 'owner' | 'member';
export type WalletMemberStatus = 'invited' | 'active';
export type WalletTxType = 'top_up' | 'spend';
export type WalletRequestStatus = 'pending' | 'approved' | 'denied';

export interface WalletMember {
  phone: string;
  name: string;
  role: WalletRole;
  status: WalletMemberStatus;
  spendLimitUsd?: number;
  joinedAt: string;
}

export interface WalletTransaction {
  id: string;
  memberPhone: string;
  type: WalletTxType;
  amountUsd: number;
  description?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface WalletRequest {
  id: string;
  requesterPhone: string;
  amountUsd: number;
  reason?: string;
  status: WalletRequestStatus;
  createdAt: string;
}

export interface FamilyWallet {
  id: string;
  name: string;
  ownerPhone: string;
  balanceUsd: number;
  members: WalletMember[];
  transactions: WalletTransaction[];
  requests: WalletRequest[];
  createdAt: string;
}

// ── In-memory store ──

const wallets = new Map<string, FamilyWallet>();

// Index: phone → wallet IDs (a person can be in multiple wallets)
const phoneIndex = new Map<string, Set<string>>();

function indexPhone(phone: string, walletId: string) {
  if (!phoneIndex.has(phone)) phoneIndex.set(phone, new Set());
  phoneIndex.get(phone)!.add(walletId);
}

function generateId(): string {
  return 'fw-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

// ── Public API ──

export function createWallet(name: string, ownerPhone: string, ownerName: string): FamilyWallet {
  const id = generateId();
  const now = new Date().toISOString();
  const wallet: FamilyWallet = {
    id,
    name,
    ownerPhone,
    balanceUsd: 0,
    members: [
      {
        phone: ownerPhone,
        name: ownerName,
        role: 'owner',
        status: 'active',
        joinedAt: now,
      },
    ],
    transactions: [],
    requests: [],
    createdAt: now,
  };
  wallets.set(id, wallet);
  indexPhone(ownerPhone, id);
  return wallet;
}

export function getWalletById(id: string): FamilyWallet | undefined {
  return wallets.get(id);
}

/** Get the primary wallet where this phone is the owner */
export function getWalletByOwner(phone: string): FamilyWallet | undefined {
  const ids = phoneIndex.get(phone);
  if (!ids) return undefined;
  const idArray = Array.from(ids);
  for (const id of idArray) {
    const w = wallets.get(id);
    if (w && w.ownerPhone === phone) return w;
  }
  return undefined;
}

/** Get all wallets this phone is a member of */
export function getWalletsByMember(phone: string): FamilyWallet[] {
  const ids = phoneIndex.get(phone);
  if (!ids) return [];
  return Array.from(ids).map((id) => wallets.get(id)!).filter(Boolean);
}

/** Get the first wallet for this phone (owner or member) */
export function getPrimaryWallet(phone: string): FamilyWallet | undefined {
  // Prefer wallet where user is owner
  const owned = getWalletByOwner(phone);
  if (owned) return owned;
  const all = getWalletsByMember(phone);
  return all[0];
}

export function addMember(
  walletId: string,
  phone: string,
  name: string,
  spendLimitUsd?: number,
): WalletMember | null {
  const wallet = wallets.get(walletId);
  if (!wallet) return null;

  // Already a member?
  const existing = wallet.members.find((m) => m.phone === phone);
  if (existing) return existing;

  const member: WalletMember = {
    phone,
    name,
    role: 'member',
    status: 'invited',
    spendLimitUsd,
    joinedAt: new Date().toISOString(),
  };
  wallet.members.push(member);
  indexPhone(phone, walletId);
  return member;
}

export function activateMember(walletId: string, phone: string): boolean {
  const wallet = wallets.get(walletId);
  if (!wallet) return false;
  const member = wallet.members.find((m) => m.phone === phone);
  if (!member) return false;
  member.status = 'active';
  return true;
}

export function topUp(walletId: string, senderPhone: string, amountUsd: number): WalletTransaction | null {
  const wallet = wallets.get(walletId);
  if (!wallet) return null;

  wallet.balanceUsd += amountUsd;
  const tx: WalletTransaction = {
    id: generateId(),
    memberPhone: senderPhone,
    type: 'top_up',
    amountUsd,
    balanceAfter: wallet.balanceUsd,
    createdAt: new Date().toISOString(),
  };
  wallet.transactions.push(tx);
  return tx;
}

export function spend(
  walletId: string,
  memberPhone: string,
  amountUsd: number,
  description?: string,
): WalletTransaction | null {
  const wallet = wallets.get(walletId);
  if (!wallet) return null;

  // Check balance
  if (wallet.balanceUsd < amountUsd) return null;

  // Check spend limit
  const member = wallet.members.find((m) => m.phone === memberPhone);
  if (member?.spendLimitUsd && amountUsd > member.spendLimitUsd) return null;

  wallet.balanceUsd -= amountUsd;
  const tx: WalletTransaction = {
    id: generateId(),
    memberPhone,
    type: 'spend',
    amountUsd,
    description,
    balanceAfter: wallet.balanceUsd,
    createdAt: new Date().toISOString(),
  };
  wallet.transactions.push(tx);
  return tx;
}

export function createRequest(
  walletId: string,
  requesterPhone: string,
  amountUsd: number,
  reason?: string,
): WalletRequest | null {
  const wallet = wallets.get(walletId);
  if (!wallet) return null;

  const request: WalletRequest = {
    id: generateId(),
    requesterPhone,
    amountUsd,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  wallet.requests.push(request);
  return request;
}

export function getPendingRequests(walletId: string): WalletRequest[] {
  const wallet = wallets.get(walletId);
  if (!wallet) return [];
  return wallet.requests.filter((r) => r.status === 'pending');
}

export function approveRequest(walletId: string, requestId: string): { tx: WalletTransaction; request: WalletRequest } | null {
  const wallet = wallets.get(walletId);
  if (!wallet) return null;

  const request = wallet.requests.find((r) => r.id === requestId);
  if (!request || request.status !== 'pending') return null;

  // Check balance
  if (wallet.balanceUsd < request.amountUsd) return null;

  request.status = 'approved';

  // Deduct from wallet
  wallet.balanceUsd -= request.amountUsd;
  const tx: WalletTransaction = {
    id: generateId(),
    memberPhone: request.requesterPhone,
    type: 'spend',
    amountUsd: request.amountUsd,
    description: request.reason ? `Solicitud: ${request.reason}` : 'Solicitud aprobada',
    balanceAfter: wallet.balanceUsd,
    createdAt: new Date().toISOString(),
  };
  wallet.transactions.push(tx);

  return { tx, request };
}

export function denyRequest(walletId: string, requestId: string): WalletRequest | null {
  const wallet = wallets.get(walletId);
  if (!wallet) return null;

  const request = wallet.requests.find((r) => r.id === requestId);
  if (!request || request.status !== 'pending') return null;

  request.status = 'denied';
  return request;
}

export function getMemberName(wallet: FamilyWallet, phone: string): string {
  return wallet.members.find((m) => m.phone === phone)?.name ?? phone;
}

export function getRecentTransactions(walletId: string, limit = 5): WalletTransaction[] {
  const wallet = wallets.get(walletId);
  if (!wallet) return [];
  return wallet.transactions.slice(-limit).reverse();
}
