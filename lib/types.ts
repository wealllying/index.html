export type CashOutMethod = 'atm' | 'agent' | 'bank';

export type KycStatus = 'none' | 'pending' | 'verified';

export type TransactionStatus = 'initiated' | 'processing' | 'ready' | 'picked_up' | 'cancelled';

export interface Recipient {
  id: string;
  fullName: string;
  phone: string;
  cedula?: string;
  dateOfBirth?: string;
  cedulaPhotoUrl?: string;
  bankName?: string;
  bankAccount?: string;
  preferredMethod: CashOutMethod;
  kycStatus: KycStatus;
  createdAt: string;
}

export interface Transaction {
  id: string;
  recipientId: string;
  recipientName: string;
  amountUsd: number;
  amountDop: number;
  feeUsd: number;
  networkFeeUsd: number;
  totalUsd: number;
  exchangeRate: number;
  cashOutMethod: CashOutMethod;
  status: TransactionStatus;
  pickupCode?: string;
  referenceNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  balanceUsd: number;
}

export const EXCHANGE_RATE = 58.50;
export const NETWORK_FEE = 0.50;

export function getPlatayaFee(amountUsd: number): number {
  return amountUsd < 200 ? 1.99 : 2.99;
}

export function generatePickupCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateReferenceNumber(): string {
  return 'PY-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDop(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
