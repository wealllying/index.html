import { create } from 'zustand';
import {
  Recipient, Transaction, User, TransactionStatus,
  EXCHANGE_RATE, NETWORK_FEE, getPlatayaFee,
  generatePickupCode, generateReferenceNumber,
} from './types';
import { mockUser, mockRecipients, mockTransactions } from './mock-data';

interface SendFlowState {
  step: number;
  amountUsd: number;
  recipientId: string | null;
  cashOutMethod: 'atm' | 'agent' | 'bank';
}

interface AppStore {
  user: User;
  recipients: Recipient[];
  transactions: Transaction[];
  sendFlow: SendFlowState;

  // Send flow
  setSendStep: (step: number) => void;
  setSendAmount: (amount: number) => void;
  setSendRecipient: (id: string) => void;
  setSendMethod: (method: 'atm' | 'agent' | 'bank') => void;
  resetSendFlow: () => void;
  confirmSend: () => Transaction;

  // Recipients
  addRecipient: (r: Omit<Recipient, 'id' | 'createdAt'>) => Recipient;
  updateRecipient: (id: string, updates: Partial<Recipient>) => void;
  deleteRecipient: (id: string) => void;
  sendKycInvite: (id: string) => void;

  // Transactions
  cancelTransaction: (id: string) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus) => void;
}

const initialSendFlow: SendFlowState = {
  step: 1,
  amountUsd: 0,
  recipientId: null,
  cashOutMethod: 'atm',
};

export const useStore = create<AppStore>((set, get) => ({
  user: mockUser,
  recipients: mockRecipients,
  transactions: mockTransactions,
  sendFlow: { ...initialSendFlow },

  setSendStep: (step) => set((s) => ({ sendFlow: { ...s.sendFlow, step } })),
  setSendAmount: (amount) => set((s) => ({ sendFlow: { ...s.sendFlow, amountUsd: amount } })),
  setSendRecipient: (id) => set((s) => ({ sendFlow: { ...s.sendFlow, recipientId: id } })),
  setSendMethod: (method) => set((s) => ({ sendFlow: { ...s.sendFlow, cashOutMethod: method } })),
  resetSendFlow: () => set({ sendFlow: { ...initialSendFlow } }),

  confirmSend: () => {
    const { sendFlow, recipients, transactions, user } = get();
    const recipient = recipients.find((r) => r.id === sendFlow.recipientId)!;
    const fee = getPlatayaFee(sendFlow.amountUsd);
    const totalUsd = sendFlow.amountUsd + fee + NETWORK_FEE;
    const amountDop = sendFlow.amountUsd * EXCHANGE_RATE;
    const now = new Date().toISOString();

    const tx: Transaction = {
      id: 'tx-' + Date.now(),
      recipientId: recipient.id,
      recipientName: recipient.fullName,
      amountUsd: sendFlow.amountUsd,
      amountDop,
      feeUsd: fee,
      networkFeeUsd: NETWORK_FEE,
      totalUsd,
      exchangeRate: EXCHANGE_RATE,
      cashOutMethod: sendFlow.cashOutMethod,
      status: 'initiated',
      pickupCode: sendFlow.cashOutMethod === 'atm' ? generatePickupCode() : undefined,
      referenceNumber: generateReferenceNumber(),
      createdAt: now,
      updatedAt: now,
    };

    set({
      transactions: [tx, ...transactions],
      user: { ...user, balanceUsd: user.balanceUsd - totalUsd },
      sendFlow: { ...initialSendFlow },
    });

    // Simulate status progression
    setTimeout(() => {
      get().updateTransactionStatus(tx.id, 'processing');
    }, 2000);
    setTimeout(() => {
      get().updateTransactionStatus(tx.id, 'ready');
    }, 5000);

    return tx;
  },

  addRecipient: (data) => {
    const r: Recipient = {
      ...data,
      id: 'r-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ recipients: [...s.recipients, r] }));
    return r;
  },

  updateRecipient: (id, updates) => {
    set((s) => ({
      recipients: s.recipients.map((r) => r.id === id ? { ...r, ...updates } : r),
    }));
  },

  deleteRecipient: (id) => {
    set((s) => ({ recipients: s.recipients.filter((r) => r.id !== id) }));
  },

  sendKycInvite: (id) => {
    // Mark as pending — invite sent to recipient's phone
    set((s) => ({
      recipients: s.recipients.map((r) =>
        r.id === id ? { ...r, kycStatus: 'pending' as const } : r
      ),
    }));
    // Simulate recipient completing KYC on their phone
    setTimeout(() => {
      set((s) => ({
        recipients: s.recipients.map((r) =>
          r.id === id ? { ...r, kycStatus: 'verified' as const } : r
        ),
      }));
    }, 6000);
  },

  cancelTransaction: (id) => {
    const { transactions, user } = get();
    const tx = transactions.find((t) => t.id === id);
    if (!tx || tx.status === 'picked_up' || tx.status === 'cancelled') return;
    set({
      transactions: transactions.map((t) =>
        t.id === id ? { ...t, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : t
      ),
      user: { ...user, balanceUsd: user.balanceUsd + tx.totalUsd },
    });
  },

  updateTransactionStatus: (id, status) => {
    set((s) => ({
      transactions: s.transactions.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    }));
  },
}));
