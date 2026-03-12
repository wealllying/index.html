import { supabase } from '../supabase';

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

// ── Database Mappers ──
function mapWallet(row: any): FamilyWallet {
  return {
    id: row.id,
    name: row.name,
    ownerPhone: row.owner_phone,
    balanceUsd: row.balance_usd,
    members: (row.wallet_members || []).map(mapMember),
    transactions: (row.wallet_transactions || []).map(mapTx).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    requests: (row.wallet_requests || []).map(mapReq).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    createdAt: row.created_at,
  };
}

function mapMember(row: any): WalletMember {
  return {
    phone: row.phone,
    name: row.name,
    role: row.role as WalletRole,
    status: row.status as WalletMemberStatus,
    spendLimitUsd: row.spend_limit_usd,
    joinedAt: row.created_at,
  };
}

function mapTx(row: any): WalletTransaction {
  return {
    id: row.id,
    memberPhone: row.member_phone,
    type: row.type as WalletTxType,
    amountUsd: row.amount_usd,
    description: row.description,
    balanceAfter: row.balance_after,
    createdAt: row.created_at,
  };
}

function mapReq(row: any): WalletRequest {
  return {
    id: row.id,
    requesterPhone: row.requester_phone,
    amountUsd: row.amount_usd,
    reason: row.reason,
    status: row.status as WalletRequestStatus,
    createdAt: row.created_at,
  };
}

// ── Public API ──

export async function createWallet(name: string, ownerPhone: string, ownerName: string): Promise<FamilyWallet | null> {
  const { data, error } = await supabase
    .from('family_wallets')
    .insert([{ name, owner_phone: ownerPhone }])
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating wallet:', error);
    return null;
  }

  const { error: mError } = await supabase
    .from('wallet_members')
    .insert([{ wallet_id: data.id, phone: ownerPhone, name: ownerName, role: 'owner', status: 'active' }])
    .select()
    .single();

  if (mError) {
     console.error('Error adding owner to wallet:', mError);
  }

  return (await getWalletById(data.id)) ?? null;
}

export async function getWalletById(id: string): Promise<FamilyWallet | undefined> {
  const { data, error } = await supabase
    .from('family_wallets')
    .select('*, wallet_members(*), wallet_transactions(*), wallet_requests(*)')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;
  return mapWallet(data);
}

export async function getWalletByOwner(phone: string): Promise<FamilyWallet | undefined> {
  const { data, error } = await supabase
    .from('family_wallets')
    .select('*, wallet_members(*), wallet_transactions(*), wallet_requests(*)')
    .eq('owner_phone', phone)
    .limit(1)
    .single();

  if (error || !data) return undefined;
  return mapWallet(data);
}

export async function getWalletsByMember(phone: string): Promise<FamilyWallet[]> {
  const { data: members, error } = await supabase
    .from('wallet_members')
    .select('wallet_id')
    .eq('phone', phone);

  if (error || !members || members.length === 0) return [];
  
  const walletIds = members.map((m) => m.wallet_id);
  
  const { data: wallets, error: wError } = await supabase
    .from('family_wallets')
    .select('*, wallet_members(*), wallet_transactions(*), wallet_requests(*)')
    .in('id', walletIds);

  if (wError || !wallets) return [];
  return wallets.map(mapWallet);
}

export async function getPrimaryWallet(phone: string): Promise<FamilyWallet | undefined> {
  const owned = await getWalletByOwner(phone);
  if (owned) return owned;
  const all = await getWalletsByMember(phone);
  return all[0];
}

export async function addMember(
  walletId: string,
  phone: string,
  name: string,
  spendLimitUsd?: number,
): Promise<WalletMember | null> {
  const { data, error } = await supabase
    .from('wallet_members')
    .insert([{ wallet_id: walletId, phone, name, role: 'member', status: 'invited', spend_limit_usd: spendLimitUsd }])
    .select()
    .single();

  if (error || !data) {
     const { data: existing } = await supabase.from('wallet_members').select().eq('wallet_id', walletId).eq('phone', phone).single();
     if (existing) return mapMember(existing);
     return null;
  }
  return mapMember(data);
}

export async function activateMember(walletId: string, phone: string): Promise<boolean> {
  const { error } = await supabase
    .from('wallet_members')
    .update({ status: 'active' })
    .eq('wallet_id', walletId)
    .eq('phone', phone);
    
  if (error) return false;
  return true;
}

export async function topUp(walletId: string, senderPhone: string, amountUsd: number): Promise<WalletTransaction | null> {
  const wallet = await getWalletById(walletId);
  if (!wallet) return null;

  const newBalance = wallet.balanceUsd + amountUsd;

  const { error: wError } = await supabase
    .from('family_wallets')
    .update({ balance_usd: newBalance })
    .eq('id', walletId);

  if (wError) return null;

  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert([{
      wallet_id: walletId,
      member_phone: senderPhone,
      type: 'top_up',
      amount_usd: amountUsd,
      balance_after: newBalance
    }])
    .select()
    .single();

  if (error || !data) return null;
  return mapTx(data);
}

export async function spend(
  walletId: string,
  memberPhone: string,
  amountUsd: number,
  description?: string,
): Promise<WalletTransaction | null> {
  const wallet = await getWalletById(walletId);
  if (!wallet) return null;

  if (wallet.balanceUsd < amountUsd) return null;

  const member = wallet.members.find((m) => m.phone === memberPhone);
  if (member?.spendLimitUsd && amountUsd > member.spendLimitUsd) return null;

  const newBalance = wallet.balanceUsd - amountUsd;

  const { error: wError } = await supabase
    .from('family_wallets')
    .update({ balance_usd: newBalance })
    .eq('id', walletId);

  if (wError) return null;

  const { data, error } = await supabase
    .from('wallet_transactions')
    .insert([{
      wallet_id: walletId,
      member_phone: memberPhone,
      type: 'spend',
      amount_usd: amountUsd,
      description,
      balance_after: newBalance
    }])
    .select()
    .single();

  if (error || !data) return null;
  return mapTx(data);
}

export async function createRequest(
  walletId: string,
  requesterPhone: string,
  amountUsd: number,
  reason?: string,
): Promise<WalletRequest | null> {
  const { data, error } = await supabase
    .from('wallet_requests')
    .insert([{
      wallet_id: walletId,
      requester_phone: requesterPhone,
      amount_usd: amountUsd,
      reason,
      status: 'pending'
    }])
    .select()
    .single();

  if (error || !data) return null;
  return mapReq(data);
}

export async function getPendingRequests(walletId: string): Promise<WalletRequest[]> {
  const { data, error } = await supabase
    .from('wallet_requests')
    .select('*')
    .eq('wallet_id', walletId)
    .eq('status', 'pending');

  if (error || !data) return [];
  return data.map(mapReq);
}

export async function approveRequest(walletId: string, requestId: string): Promise<{ tx: WalletTransaction; request: WalletRequest } | null> {
  const wallet = await getWalletById(walletId);
  if (!wallet) return null;

  const request = wallet.requests.find((r) => r.id === requestId);
  if (!request || request.status !== 'pending') return null;

  if (wallet.balanceUsd < request.amountUsd) return null;

  const newBalance = wallet.balanceUsd - request.amountUsd;

  const { error: rError } = await supabase
    .from('wallet_requests')
    .update({ status: 'approved' })
    .eq('id', requestId);
    
  if (rError) return null;

  const { error: wError } = await supabase
    .from('family_wallets')
    .update({ balance_usd: newBalance })
    .eq('id', walletId);

  if (wError) return null;

  const { data: txData, error: txError } = await supabase
    .from('wallet_transactions')
    .insert([{
      wallet_id: walletId,
      member_phone: request.requesterPhone,
      type: 'spend',
      amount_usd: request.amountUsd,
      description: request.reason ? `Solicitud: ${request.reason}` : 'Solicitud aprobada',
      balance_after: newBalance
    }])
    .select()
    .single();

  if (txError || !txData) return null;

  request.status = 'approved';
  return { tx: mapTx(txData), request };
}

export async function denyRequest(walletId: string, requestId: string): Promise<WalletRequest | null> {
  const { data, error } = await supabase
    .from('wallet_requests')
    .update({ status: 'denied' })
    .eq('id', requestId)
    .select()
    .single();

  if (error || !data) return null;
  return mapReq(data);
}

export function getMemberName(wallet: FamilyWallet, phone: string): string {
  return wallet.members.find((m) => m.phone === phone)?.name ?? phone;
}

export async function getRecentTransactions(walletId: string, limit = 5): Promise<WalletTransaction[]> {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(mapTx);
}
