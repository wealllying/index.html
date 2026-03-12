// lib/bot/wallet-handler.ts — Family Wallet conversation flows for the WhatsApp bot

import { getSession, updateSession, resetSession } from './sessions';
import {
  createWallet,
  getPrimaryWallet,
  getWalletByOwner,
  getWalletsByMember,
  addMember,
  activateMember,
  topUp,
  spend,
  createRequest,
  getPendingRequests,
  approveRequest,
  denyRequest,
  getMemberName,
  getRecentTransactions,
  type FamilyWallet,
} from './wallet';

// ── Bilingual strings for wallet flows ──

const wt = {
  es: {
    walletMenu: (hasWallet: boolean, walletName?: string) => {
      if (hasWallet) {
        return [
          `👨‍👩‍👧‍👦 *Wallet Familiar: ${walletName}*`,
          ``,
          `Elige una opcion:`,
          ``,
          `*1.* 💰 Ver saldo`,
          `*2.* ➕ Añadir dinero`,
          `*3.* 💸 Gastar del wallet`,
          `*4.* 🙏 Pedir dinero`,
          `*5.* ✅ Aprobar solicitudes`,
          `*6.* 👥 Ver miembros`,
          `*7.* ➕ Añadir miembro`,
          ``,
          `Escribe *menu* para volver al inicio.`,
        ].join('\n');
      }
      return [
        `👨‍👩‍👧‍👦 *Wallet Familiar*`,
        ``,
        `No tienes un wallet familiar todavia.`,
        ``,
        `¿Quieres crear uno? Escribe el nombre de tu familia.`,
        ``,
        `Ejemplo: *Familia Ruiz*`,
        ``,
        `Escribe *menu* para volver al inicio.`,
      ].join('\n');
    },

    walletCreated: (name: string) => [
      `✅ *Wallet "${name}" creado!*`,
      ``,
      `Ahora puedes:`,
      `• Añadir miembros — escribe *7* o *añadir miembro*`,
      `• Añadir dinero — escribe *2* o *añadir*`,
      ``,
      `Escribe *wallet* para ver el menu del wallet.`,
    ].join('\n'),

    askMemberPhone: `👥 *Añadir miembro*\n\n¿Cual es el *numero de telefono* del nuevo miembro?\n\nEjemplo: *18095551234*`,

    askMemberName: (phone: string) =>
      `📱 Numero: *${phone}*\n\n¿Cual es su *nombre*?\n\nEjemplo: *Mamá* o *María*`,

    memberAdded: (name: string, walletName: string) => [
      `✅ *${name}* ha sido añadido al wallet *${walletName}*`,
      ``,
      `Se le enviara una invitacion por WhatsApp.`,
      ``,
      `Escribe *wallet* para ver el menu del wallet.`,
    ].join('\n'),

    memberInvite: (walletName: string, ownerName: string) => [
      `👨‍👩‍👧‍👦 *Invitacion a Wallet Familiar*`,
      ``,
      `*${ownerName}* te invito al wallet familiar *${walletName}* en PlataYa.`,
      ``,
      `Escribe *aceptar* para unirte.`,
    ].join('\n'),

    memberAccepted: (walletName: string) =>
      `✅ Te uniste al wallet *${walletName}*!\n\nEscribe *wallet* para ver el menu.`,

    askTopUpAmount: (walletName: string, balance: number) => [
      `➕ *Añadir dinero a ${walletName}*`,
      ``,
      `Saldo actual: *$${balance.toFixed(2)} USD*`,
      ``,
      `¿Cuanto quieres añadir en dolares (USD)?`,
      ``,
      `Ejemplo: *300*`,
    ].join('\n'),

    topUpConfirm: (amount: number, walletName: string) =>
      `💰 Añadir *$${amount.toFixed(2)} USD* al wallet *${walletName}*?\n\nEscribe *SI* para confirmar o *NO* para cancelar.`,

    topUpDone: (amount: number, newBalance: number, walletName: string) => [
      `✅ *$${amount.toFixed(2)} USD* añadidos al wallet *${walletName}*`,
      ``,
      `💰 Nuevo saldo: *$${newBalance.toFixed(2)} USD*`,
      ``,
      `Todos los miembros recibiran una notificacion.`,
      ``,
      `Escribe *wallet* para ver el menu del wallet.`,
    ].join('\n'),

    topUpNotify: (senderName: string, amount: number, newBalance: number, walletName: string) => [
      `💰 *${walletName}*`,
      ``,
      `${senderName} añadio *$${amount.toFixed(2)} USD* al wallet.`,
      ``,
      `Nuevo saldo: *$${newBalance.toFixed(2)} USD*`,
    ].join('\n'),

    askSpendAmount: (walletName: string, balance: number) => [
      `💸 *Gastar del wallet ${walletName}*`,
      ``,
      `Saldo disponible: *$${balance.toFixed(2)} USD*`,
      ``,
      `¿Cuanto quieres gastar en dolares?`,
      ``,
      `Ejemplo: *45*`,
    ].join('\n'),

    askSpendDesc: (amount: number) =>
      `💸 Gastando *$${amount.toFixed(2)} USD*\n\n¿En que lo gastaste? (descripcion breve)\n\nEjemplo: *comida en el colmado*`,

    spendConfirm: (amount: number, desc: string) =>
      `💸 Gastar *$${amount.toFixed(2)} USD* en "${desc}"?\n\nEscribe *SI* para confirmar o *NO* para cancelar.`,

    spendDone: (amount: number, desc: string, newBalance: number) => [
      `✅ Gasto registrado: *$${amount.toFixed(2)} USD* — ${desc}`,
      ``,
      `💰 Saldo restante: *$${newBalance.toFixed(2)} USD*`,
      ``,
      `El dueño del wallet recibira una notificacion.`,
      ``,
      `Escribe *wallet* para ver el menu.`,
    ].join('\n'),

    spendNotify: (memberName: string, amount: number, desc: string, newBalance: number, walletName: string) => [
      `💸 *${walletName}*`,
      ``,
      `*${memberName}* gasto *$${amount.toFixed(2)} USD* en ${desc}.`,
      ``,
      `Saldo: *$${newBalance.toFixed(2)} USD*`,
    ].join('\n'),

    askRequestAmount: (walletName: string) => [
      `🙏 *Pedir dinero del wallet ${walletName}*`,
      ``,
      `¿Cuanto necesitas en dolares?`,
      ``,
      `Ejemplo: *60*`,
    ].join('\n'),

    askRequestReason: (amount: number) =>
      `🙏 Pidiendo *$${amount.toFixed(2)} USD*\n\n¿Para que lo necesitas?\n\nEjemplo: *libros de la universidad*`,

    requestSent: (amount: number, reason: string) => [
      `✅ *Solicitud enviada!*`,
      ``,
      `💰 Monto: *$${amount.toFixed(2)} USD*`,
      `📝 Razon: ${reason}`,
      ``,
      `El dueño del wallet recibira tu solicitud.`,
      ``,
      `Escribe *wallet* para ver el menu.`,
    ].join('\n'),

    requestNotify: (memberName: string, amount: number, reason: string, walletName: string) => [
      `🙏 *${walletName} — Solicitud de dinero*`,
      ``,
      `*${memberName}* necesita *$${amount.toFixed(2)} USD*`,
      `📝 Razon: ${reason}`,
      ``,
      `Escribe *aprobar* o *rechazar* para responder.`,
    ].join('\n'),

    pendingRequests: (requests: { requesterName: string; amount: number; reason?: string; id: string }[]) => {
      if (requests.length === 0) {
        return `✅ No tienes solicitudes pendientes.\n\nEscribe *wallet* para ver el menu.`;
      }
      const lines = [
        `📋 *Solicitudes pendientes:*`,
        ``,
      ];
      requests.forEach((r, i) => {
        lines.push(`*${i + 1}.* ${r.requesterName} — *$${r.amount.toFixed(2)}*${r.reason ? ` (${r.reason})` : ''}`);
      });
      lines.push(``, `Escribe el *numero* de la solicitud para aprobar o rechazar.`);
      return lines.join('\n');
    },

    approveOrDeny: (name: string, amount: number, reason?: string) => [
      `📋 *Solicitud de ${name}*`,
      ``,
      `💰 Monto: *$${amount.toFixed(2)} USD*`,
      reason ? `📝 Razon: ${reason}` : '',
      ``,
      `Escribe *aprobar* para aprobar o *rechazar* para rechazar.`,
    ].filter(Boolean).join('\n'),

    requestApproved: (name: string, amount: number) =>
      `✅ Solicitud de *${name}* por *$${amount.toFixed(2)} USD* aprobada.\n\nEscribe *wallet* para ver el menu.`,

    requestDenied: (name: string, amount: number) =>
      `❌ Solicitud de *${name}* por *$${amount.toFixed(2)} USD* rechazada.\n\nEscribe *wallet* para ver el menu.`,

    requestApprovedNotify: (amount: number, walletName: string) => [
      `✅ *${walletName}*`,
      ``,
      `Tu solicitud de *$${amount.toFixed(2)} USD* fue *aprobada* ✅`,
    ].join('\n'),

    requestDeniedNotify: (amount: number, walletName: string) => [
      `❌ *${walletName}*`,
      ``,
      `Tu solicitud de *$${amount.toFixed(2)} USD* fue *rechazada* ❌`,
    ].join('\n'),

    balance: (walletName: string, balance: number, recentTxs: { type: string; memberName: string; amount: number; desc?: string }[]) => {
      const lines = [
        `💰 *${walletName}*`,
        ``,
        `Saldo: *$${balance.toFixed(2)} USD*`,
      ];
      if (recentTxs.length > 0) {
        lines.push(``, `📊 *Actividad reciente:*`);
        recentTxs.forEach((tx) => {
          const icon = tx.type === 'top_up' ? '➕' : '💸';
          const action = tx.type === 'top_up' ? 'añadio' : 'gasto';
          lines.push(`${icon} ${tx.memberName} ${action} $${tx.amount.toFixed(2)}${tx.desc ? ` — ${tx.desc}` : ''}`);
        });
      }
      lines.push(``, `Escribe *wallet* para ver el menu.`);
      return lines.join('\n');
    },

    members: (walletName: string, members: { name: string; role: string; status: string }[]) => {
      const lines = [
        `👥 *Miembros de ${walletName}:*`,
        ``,
      ];
      members.forEach((m) => {
        const roleIcon = m.role === 'owner' ? '👑' : '👤';
        const statusIcon = m.status === 'active' ? '✅' : '⏳';
        lines.push(`${roleIcon} ${m.name} ${statusIcon}`);
      });
      lines.push(``, `Escribe *wallet* para ver el menu.`);
      return lines.join('\n');
    },

    insufficientBalance: (balance: number) =>
      `⚠️ Saldo insuficiente. Saldo actual: *$${balance.toFixed(2)} USD*\n\nEscribe *wallet* para ver el menu.`,

    invalidAmount: `⚠️ Escribe un monto valido.\n\nEjemplo: *100* o *250.50*`,

    noWallet: `⚠️ No tienes un wallet familiar.\n\nEscribe *wallet* para crear uno.`,
  },

  en: {
    walletMenu: (hasWallet: boolean, walletName?: string) => {
      if (hasWallet) {
        return [
          `👨‍👩‍👧‍👦 *Family Wallet: ${walletName}*`,
          ``,
          `Choose an option:`,
          ``,
          `*1.* 💰 View balance`,
          `*2.* ➕ Add money`,
          `*3.* 💸 Spend from wallet`,
          `*4.* 🙏 Request money`,
          `*5.* ✅ Approve requests`,
          `*6.* 👥 View members`,
          `*7.* ➕ Add member`,
          ``,
          `Type *menu* to go back.`,
        ].join('\n');
      }
      return [
        `👨‍👩‍👧‍👦 *Family Wallet*`,
        ``,
        `You don't have a family wallet yet.`,
        ``,
        `Want to create one? Type your family name.`,
        ``,
        `Example: *The Ruiz Family*`,
        ``,
        `Type *menu* to go back.`,
      ].join('\n');
    },

    walletCreated: (name: string) => [
      `✅ *Wallet "${name}" created!*`,
      ``,
      `Now you can:`,
      `• Add members — type *7* or *add member*`,
      `• Add money — type *2* or *add*`,
      ``,
      `Type *wallet* to see the wallet menu.`,
    ].join('\n'),

    askMemberPhone: `👥 *Add member*\n\nWhat is the *phone number* of the new member?\n\nExample: *18095551234*`,

    askMemberName: (phone: string) =>
      `📱 Number: *${phone}*\n\nWhat is their *name*?\n\nExample: *Mom* or *María*`,

    memberAdded: (name: string, walletName: string) => [
      `✅ *${name}* has been added to wallet *${walletName}*`,
      ``,
      `They'll receive an invite on WhatsApp.`,
      ``,
      `Type *wallet* to see the wallet menu.`,
    ].join('\n'),

    memberInvite: (walletName: string, ownerName: string) => [
      `👨‍👩‍👧‍👦 *Family Wallet Invitation*`,
      ``,
      `*${ownerName}* invited you to the family wallet *${walletName}* on PlataYa.`,
      ``,
      `Type *accept* to join.`,
    ].join('\n'),

    memberAccepted: (walletName: string) =>
      `✅ You joined the *${walletName}* wallet!\n\nType *wallet* to see the menu.`,

    askTopUpAmount: (walletName: string, balance: number) => [
      `➕ *Add money to ${walletName}*`,
      ``,
      `Current balance: *$${balance.toFixed(2)} USD*`,
      ``,
      `How much do you want to add in USD?`,
      ``,
      `Example: *300*`,
    ].join('\n'),

    topUpConfirm: (amount: number, walletName: string) =>
      `💰 Add *$${amount.toFixed(2)} USD* to wallet *${walletName}*?\n\nType *YES* to confirm or *NO* to cancel.`,

    topUpDone: (amount: number, newBalance: number, walletName: string) => [
      `✅ *$${amount.toFixed(2)} USD* added to wallet *${walletName}*`,
      ``,
      `💰 New balance: *$${newBalance.toFixed(2)} USD*`,
      ``,
      `All members will be notified.`,
      ``,
      `Type *wallet* to see the wallet menu.`,
    ].join('\n'),

    topUpNotify: (senderName: string, amount: number, newBalance: number, walletName: string) => [
      `💰 *${walletName}*`,
      ``,
      `${senderName} added *$${amount.toFixed(2)} USD* to the wallet.`,
      ``,
      `New balance: *$${newBalance.toFixed(2)} USD*`,
    ].join('\n'),

    askSpendAmount: (walletName: string, balance: number) => [
      `💸 *Spend from wallet ${walletName}*`,
      ``,
      `Available balance: *$${balance.toFixed(2)} USD*`,
      ``,
      `How much do you want to spend in USD?`,
      ``,
      `Example: *45*`,
    ].join('\n'),

    askSpendDesc: (amount: number) =>
      `💸 Spending *$${amount.toFixed(2)} USD*\n\nWhat did you spend it on? (short description)\n\nExample: *groceries at the store*`,

    spendConfirm: (amount: number, desc: string) =>
      `💸 Spend *$${amount.toFixed(2)} USD* on "${desc}"?\n\nType *YES* to confirm or *NO* to cancel.`,

    spendDone: (amount: number, desc: string, newBalance: number) => [
      `✅ Spend recorded: *$${amount.toFixed(2)} USD* — ${desc}`,
      ``,
      `💰 Remaining balance: *$${newBalance.toFixed(2)} USD*`,
      ``,
      `The wallet owner will be notified.`,
      ``,
      `Type *wallet* to see the menu.`,
    ].join('\n'),

    spendNotify: (memberName: string, amount: number, desc: string, newBalance: number, walletName: string) => [
      `💸 *${walletName}*`,
      ``,
      `*${memberName}* spent *$${amount.toFixed(2)} USD* on ${desc}.`,
      ``,
      `Balance: *$${newBalance.toFixed(2)} USD*`,
    ].join('\n'),

    askRequestAmount: (walletName: string) => [
      `🙏 *Request money from wallet ${walletName}*`,
      ``,
      `How much do you need in USD?`,
      ``,
      `Example: *60*`,
    ].join('\n'),

    askRequestReason: (amount: number) =>
      `🙏 Requesting *$${amount.toFixed(2)} USD*\n\nWhat do you need it for?\n\nExample: *university books*`,

    requestSent: (amount: number, reason: string) => [
      `✅ *Request sent!*`,
      ``,
      `💰 Amount: *$${amount.toFixed(2)} USD*`,
      `📝 Reason: ${reason}`,
      ``,
      `The wallet owner will receive your request.`,
      ``,
      `Type *wallet* to see the menu.`,
    ].join('\n'),

    requestNotify: (memberName: string, amount: number, reason: string, walletName: string) => [
      `🙏 *${walletName} — Money Request*`,
      ``,
      `*${memberName}* needs *$${amount.toFixed(2)} USD*`,
      `📝 Reason: ${reason}`,
      ``,
      `Type *approve* or *deny* to respond.`,
    ].join('\n'),

    pendingRequests: (requests: { requesterName: string; amount: number; reason?: string; id: string }[]) => {
      if (requests.length === 0) {
        return `✅ No pending requests.\n\nType *wallet* to see the menu.`;
      }
      const lines = [
        `📋 *Pending requests:*`,
        ``,
      ];
      requests.forEach((r, i) => {
        lines.push(`*${i + 1}.* ${r.requesterName} — *$${r.amount.toFixed(2)}*${r.reason ? ` (${r.reason})` : ''}`);
      });
      lines.push(``, `Type the *number* of the request to approve or deny.`);
      return lines.join('\n');
    },

    approveOrDeny: (name: string, amount: number, reason?: string) => [
      `📋 *Request from ${name}*`,
      ``,
      `💰 Amount: *$${amount.toFixed(2)} USD*`,
      reason ? `📝 Reason: ${reason}` : '',
      ``,
      `Type *approve* to approve or *deny* to deny.`,
    ].filter(Boolean).join('\n'),

    requestApproved: (name: string, amount: number) =>
      `✅ Request from *${name}* for *$${amount.toFixed(2)} USD* approved.\n\nType *wallet* to see the menu.`,

    requestDenied: (name: string, amount: number) =>
      `❌ Request from *${name}* for *$${amount.toFixed(2)} USD* denied.\n\nType *wallet* to see the menu.`,

    requestApprovedNotify: (amount: number, walletName: string) => [
      `✅ *${walletName}*`,
      ``,
      `Your request for *$${amount.toFixed(2)} USD* was *approved* ✅`,
    ].join('\n'),

    requestDeniedNotify: (amount: number, walletName: string) => [
      `❌ *${walletName}*`,
      ``,
      `Your request for *$${amount.toFixed(2)} USD* was *denied* ❌`,
    ].join('\n'),

    balance: (walletName: string, balance: number, recentTxs: { type: string; memberName: string; amount: number; desc?: string }[]) => {
      const lines = [
        `💰 *${walletName}*`,
        ``,
        `Balance: *$${balance.toFixed(2)} USD*`,
      ];
      if (recentTxs.length > 0) {
        lines.push(``, `📊 *Recent activity:*`);
        recentTxs.forEach((tx) => {
          const icon = tx.type === 'top_up' ? '➕' : '💸';
          const action = tx.type === 'top_up' ? 'added' : 'spent';
          lines.push(`${icon} ${tx.memberName} ${action} $${tx.amount.toFixed(2)}${tx.desc ? ` — ${tx.desc}` : ''}`);
        });
      }
      lines.push(``, `Type *wallet* to see the menu.`);
      return lines.join('\n');
    },

    members: (walletName: string, members: { name: string; role: string; status: string }[]) => {
      const lines = [
        `👥 *Members of ${walletName}:*`,
        ``,
      ];
      members.forEach((m) => {
        const roleIcon = m.role === 'owner' ? '👑' : '👤';
        const statusIcon = m.status === 'active' ? '✅' : '⏳';
        lines.push(`${roleIcon} ${m.name} ${statusIcon}`);
      });
      lines.push(``, `Type *wallet* to see the menu.`);
      return lines.join('\n');
    },

    insufficientBalance: (balance: number) =>
      `⚠️ Insufficient balance. Current balance: *$${balance.toFixed(2)} USD*\n\nType *wallet* to see the menu.`,

    invalidAmount: `⚠️ Enter a valid amount.\n\nExample: *100* or *250.50*`,

    noWallet: `⚠️ You don't have a family wallet.\n\nType *wallet* to create one.`,
  },
};

// ── Notification sender ──
// Collects notifications to be sent after handler returns
export interface WalletNotification {
  to: string;
  message: string;
}

let pendingNotifications: WalletNotification[] = [];

export function flushNotifications(): WalletNotification[] {
  const notifs = pendingNotifications;
  pendingNotifications = [];
  return notifs;
}

function queueNotification(to: string, message: string) {
  pendingNotifications.push({ to, message });
}

// ── Main wallet handler ──
// Returns a reply string if this message was handled, or null if not a wallet flow

export async function handleWalletMessage(from: string, text: string, senderName?: string): Promise<string | null> {
  const session = getSession(from);
  const s = wt[session.lang];
  const input = text.trim();
  const lower = input.toLowerCase();

  // ── Entry point: wallet command ──
  if (session.step === 'idle' && (lower === '6' || lower === 'wallet' || lower === 'billetera')) {
    const wallet = await getPrimaryWallet(from);

    if (wallet) {
      updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
      return s.walletMenu(true, wallet.name);
    } else {
      updateSession(from, { step: 'wallet_create_name' });
      return s.walletMenu(false);
    }
  }

  // ── Accept invite (can come from idle if member received invite) ──
  if (session.step === 'idle' && (lower === 'aceptar' || lower === 'accept')) {
    return await handleAcceptInvite(from, s);
  }

  // ── Create wallet: name ──
  if (session.step === 'wallet_create_name') {
    if (input.length < 2) {
      return session.lang === 'es' ? '⚠️ Escribe un nombre para el wallet.' : '⚠️ Enter a name for the wallet.';
    }
    const name = senderName ?? from;
    const wallet = await createWallet(input, from, name);
    if (!wallet) return session.lang === 'es' ? '⚠️ Error al crear el wallet.' : '⚠️ Error creating wallet.';
    updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
    return s.walletCreated(input);
  }

  // ── Wallet menu selection ──
  if (session.step === 'wallet_menu') {
    const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
    if (!wallet) {
      resetSession(from);
      return s.noWallet;
    }

    const isOwner = wallet.ownerPhone === from;

    // 1 — Balance
    if (lower === '1' || lower === 'saldo' || lower === 'balance') {
      const recentTxs = (await getRecentTransactions(wallet.id, 5)).map((tx) => ({
        type: tx.type,
        memberName: getMemberName(wallet, tx.memberPhone),
        amount: tx.amountUsd,
        desc: tx.description,
      }));
      return s.balance(wallet.name, wallet.balanceUsd, recentTxs);
    }

    // 2 — Top up
    if (lower === '2' || lower === 'añadir' || lower === 'add' || lower === 'topup') {
      updateSession(from, { step: 'wallet_topup_amount', walletDraft: { walletId: wallet.id } });
      return s.askTopUpAmount(wallet.name, wallet.balanceUsd);
    }

    // 3 — Spend
    if (lower === '3' || lower === 'gastar' || lower === 'spend') {
      updateSession(from, { step: 'wallet_spend_amount', walletDraft: { walletId: wallet.id } });
      return s.askSpendAmount(wallet.name, wallet.balanceUsd);
    }

    // 4 — Request money
    if (lower === '4' || lower === 'pedir' || lower === 'request') {
      updateSession(from, { step: 'wallet_request_amount', walletDraft: { walletId: wallet.id } });
      return s.askRequestAmount(wallet.name);
    }

    // 5 — Approve requests (owner only)
    if (lower === '5' || lower === 'aprobar' || lower === 'approve') {
      if (!isOwner) {
        return session.lang === 'es'
          ? '⚠️ Solo el dueño del wallet puede aprobar solicitudes.'
          : '⚠️ Only the wallet owner can approve requests.';
      }
      const pending = await getPendingRequests(wallet.id);
      const formatted = pending.map((r) => ({
        requesterName: getMemberName(wallet, r.requesterPhone),
        amount: r.amountUsd,
        reason: r.reason,
        id: r.id,
      }));
      if (pending.length === 0) {
        return s.pendingRequests([]);
      }
      updateSession(from, { step: 'wallet_approve_select', walletDraft: { walletId: wallet.id } });
      return s.pendingRequests(formatted);
    }

    // 6 — Members
    if (lower === '6' || lower === 'miembros' || lower === 'members') {
      const membersList = wallet.members.map((m) => ({
        name: m.name,
        role: m.role,
        status: m.status,
      }));
      return s.members(wallet.name, membersList);
    }

    // 7 — Add member
    if (lower === '7' || lower === 'añadir miembro' || lower === 'add member') {
      if (!isOwner) {
        return session.lang === 'es'
          ? '⚠️ Solo el dueño del wallet puede añadir miembros.'
          : '⚠️ Only the wallet owner can add members.';
      }
      updateSession(from, { step: 'wallet_add_member_phone', walletDraft: { walletId: wallet.id } });
      return s.askMemberPhone;
    }

    // Didn't match — show wallet menu again
    return s.walletMenu(true, wallet.name);
  }

  // ── Add member: phone ──
  if (session.step === 'wallet_add_member_phone') {
    const phone = input.replace(/[\s\-()]/g, '');
    if (phone.length < 7 || !/^\+?\d+$/.test(phone)) {
      return session.lang === 'es'
        ? '⚠️ Numero invalido. Incluye el codigo de pais.\n\nEjemplo: *18095551234*'
        : '⚠️ Invalid number. Include country code.\n\nExample: *18095551234*';
    }
    updateSession(from, {
      step: 'wallet_add_member_name',
      walletDraft: { ...session.walletDraft, memberPhone: phone },
    });
    return s.askMemberName(phone);
  }

  // ── Add member: name ──
  if (session.step === 'wallet_add_member_name') {
    if (input.length < 1) {
      return session.lang === 'es' ? '⚠️ Escribe el nombre.' : '⚠️ Enter the name.';
    }
    const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
    if (!wallet) { resetSession(from); return s.noWallet; }

    const member = await addMember(wallet.id, session.walletDraft.memberPhone!, input);
    if (!member) { resetSession(from); return s.noWallet; }

    // Send invite to the new member
    const ownerName = getMemberName(wallet, from);
    queueNotification(
      session.walletDraft.memberPhone!,
      wt[session.lang].memberInvite(wallet.name, ownerName),
    );

    updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
    return s.memberAdded(input, wallet.name);
  }

  // ── Top up: amount ──
  if (session.step === 'wallet_topup_amount') {
    const amount = parseFloat(input.replace(/[$,]/g, ''));
    if (isNaN(amount) || amount <= 0) return s.invalidAmount;
    if (amount < 1) return s.invalidAmount;

    const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
    if (!wallet) { resetSession(from); return s.noWallet; }

    updateSession(from, {
      step: 'wallet_topup_confirm',
      walletDraft: { ...session.walletDraft, amountUsd: amount },
    });
    return s.topUpConfirm(amount, wallet.name);
  }

  
  // ── Top up: confirm ──
  if (session.step === 'wallet_topup_confirm') {
    if (lower === 'si' || lower === 'sí' || lower === 'yes' || lower === 'y') {
      const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
      if (!wallet) { resetSession(from); return s.noWallet; }

      // 1. Simulate check KYC
      const needsKyc = true; 
      if (needsKyc) {
        updateSession(from, { step: 'wallet_awaiting_kyc' });
        return session.lang === 'es' ?
          `🔒 *Verificación de Identidad*\n\nPara procesar tu pago, necesitamos verificar tu identidad por seguridad. Haz clic aquí para subir tu ID:\n\nhttps://plataya.app/kyc?session=${from}\n\nCuando termines, escribe *listo* aqui.` :
          `🔒 *Identity Verification*\n\nTo process your payment, we must verify your identity for security. Click here to upload your ID:\n\nhttps://plataya.app/kyc?session=${from}\n\nWhen finished, type *done* here.`;
      }

      // If they were verified, we'd take them to checkout (covered in the next step anyway)
    }
    if (lower === 'no' || lower === 'n') {
      const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
      updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet?.id } });
      return session.lang === 'es' ? '❌ Cancelado.\n\nEscribe *wallet* para ver el menu.' : '❌ Cancelled.\n\nType *wallet* to see the menu.';
    }
    return session.lang === 'es'
      ? '⚠️ Escribe *SI* para confirmar o *NO* para cancelar.'
      : '⚠️ Type *YES* to confirm or *NO* to cancel.';
  }

  // ── Top up: awaiting kyc ──
  if (session.step === 'wallet_awaiting_kyc') {
    if (lower === 'listo' || lower === 'done') {
      const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
      if (!wallet) { resetSession(from); return s.noWallet; }

      // We don't magically top up here anymore, we generate a checkout link!
      // When the webhook fires that they paid, the real `topUp` function would be called.
      const amount = session.walletDraft.amountUsd!;
      updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
      
      return session.lang === 'es' ?
        `💳 *Pago Pendiente*\n\nTu recarga de $100 USD está casi lista. Completa el pago de forma segura usando tu banco en este enlace:\n\nhttps://plataya.app/checkout?wallet=${wallet.id}&amount=${amount}\n\nTe notificaremos por aqui en cuanto recibamos los fondos.` :
        `💳 *Payment Pending*\n\nYour top-up of $100 USD is almost ready. Complete the payment securely using your bank at this link:\n\nhttps://plataya.app/checkout?wallet=${wallet.id}&amount=${amount}\n\nWe will notify you here once we receive the funds.`;
    }
    return session.lang === 'es' 
      ? '⚠️ Aún estamos esperando. Escribe *listo* cuando hayas subido tu documento en el enlace.' 
      : '⚠️ Still waiting. Type *done* when you have uploaded your document at the link.';
  }

  // ── Spend: amount ──
  if (session.step === 'wallet_spend_amount') {
    const amount = parseFloat(input.replace(/[$,]/g, ''));
    if (isNaN(amount) || amount <= 0) return s.invalidAmount;

    const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
    if (!wallet) { resetSession(from); return s.noWallet; }

    if (amount > wallet.balanceUsd) return s.insufficientBalance(wallet.balanceUsd);

    updateSession(from, {
      step: 'wallet_spend_desc',
      walletDraft: { ...session.walletDraft, amountUsd: amount },
    });
    return s.askSpendDesc(amount);
  }

  // ── Spend: description ──
  if (session.step === 'wallet_spend_desc') {
    if (input.length < 1) {
      return session.lang === 'es' ? '⚠️ Escribe una descripcion.' : '⚠️ Enter a description.';
    }
    updateSession(from, {
      step: 'wallet_spend_confirm',
      walletDraft: { ...session.walletDraft, description: input },
    });
    return s.spendConfirm(session.walletDraft.amountUsd!, input);
  }

  // ── Spend: confirm ──
  if (session.step === 'wallet_spend_confirm') {
    if (lower === 'si' || lower === 'sí' || lower === 'yes' || lower === 'y') {
      const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
      if (!wallet) { resetSession(from); return s.noWallet; }

      const tx = await spend(wallet.id, from, session.walletDraft.amountUsd!, session.walletDraft.description);
      if (!tx) {
        updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
        return s.insufficientBalance(wallet.balanceUsd);
      }

      // Notify wallet owner (if spender is not the owner)
      const spenderName = getMemberName(wallet, from);
      if (from !== wallet.ownerPhone) {
        queueNotification(
          wallet.ownerPhone,
          wt[session.lang].spendNotify(spenderName, tx.amountUsd, tx.description ?? '', tx.balanceAfter, wallet.name),
        );
      }
      // Also notify other active members
      wallet.members.forEach((m) => {
        if (m.phone !== from && m.phone !== wallet.ownerPhone && m.status === 'active') {
          queueNotification(
            m.phone,
            wt[session.lang].spendNotify(spenderName, tx.amountUsd, tx.description ?? '', tx.balanceAfter, wallet.name),
          );
        }
      });

      updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
      return s.spendDone(tx.amountUsd, tx.description ?? '', tx.balanceAfter);
    }
    if (lower === 'no' || lower === 'n') {
      const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
      updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet?.id } });
      return session.lang === 'es' ? '❌ Cancelado.\n\nEscribe *wallet* para ver el menu.' : '❌ Cancelled.\n\nType *wallet* to see the menu.';
    }
    return session.lang === 'es'
      ? '⚠️ Escribe *SI* para confirmar o *NO* para cancelar.'
      : '⚠️ Type *YES* to confirm or *NO* to cancel.';
  }

  // ── Request money: amount ──
  if (session.step === 'wallet_request_amount') {
    const amount = parseFloat(input.replace(/[$,]/g, ''));
    if (isNaN(amount) || amount <= 0) return s.invalidAmount;

    updateSession(from, {
      step: 'wallet_request_reason',
      walletDraft: { ...session.walletDraft, amountUsd: amount },
    });
    return s.askRequestReason(amount);
  }

  // ── Request money: reason ──
  if (session.step === 'wallet_request_reason') {
    if (input.length < 1) {
      return session.lang === 'es' ? '⚠️ Escribe la razon.' : '⚠️ Enter the reason.';
    }

    const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
    if (!wallet) { resetSession(from); return s.noWallet; }

    const request = await createRequest(wallet.id, from, session.walletDraft.amountUsd!, input);
    if (!request) { resetSession(from); return s.noWallet; }

    // Notify wallet owner
    const requesterName = getMemberName(wallet, from);
    queueNotification(
      wallet.ownerPhone,
      wt[session.lang].requestNotify(requesterName, request.amountUsd, input, wallet.name),
    );

    updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
    return s.requestSent(request.amountUsd, input);
  }

  // ── Approve requests: select or approve/deny ──
  if (session.step === 'wallet_approve_select') {
    const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
    if (!wallet) { resetSession(from); return s.noWallet; }

    // If a request is already selected, handle approve/deny
    if (session.walletDraft.requestId) {
      if (lower === 'aprobar' || lower === 'approve') {
        return await handleApprove(from, wallet, session.walletDraft.requestId, session.lang);
      }
      if (lower === 'rechazar' || lower === 'deny') {
        return await handleDeny(from, wallet, session.walletDraft.requestId, session.lang);
      }
      // If neither, show the approve/deny prompt again
      const req = (await getPendingRequests(wallet.id)).find((r) => r.id === session.walletDraft.requestId);
      if (req) {
        const reqName = getMemberName(wallet, req.requesterPhone);
        return s.approveOrDeny(reqName, req.amountUsd, req.reason);
      }
    }

    // No request selected yet — expect a number
    const pending = await getPendingRequests(wallet.id);
    const idx = parseInt(lower, 10);

    if (isNaN(idx) || idx < 1 || idx > pending.length) {
      return session.lang === 'es'
        ? `⚠️ Escribe un numero del *1* al *${pending.length}*.`
        : `⚠️ Type a number from *1* to *${pending.length}*.`;
    }

    const request = pending[idx - 1];
    const requesterName = getMemberName(wallet, request.requesterPhone);

    updateSession(from, {
      step: 'wallet_approve_select',
      walletDraft: { ...session.walletDraft, requestId: request.id },
    });

    return s.approveOrDeny(requesterName, request.amountUsd, request.reason);
  }

  // Not a wallet flow
  return null;
}

// ── Helper: accept invite ──
async function handleAcceptInvite(phone: string, s: typeof wt.es): Promise<string> {
  const memberWallets = await getWalletsByMember(phone);
  for (const w of memberWallets) {
    const member = w.members.find((m) => m.phone === phone && m.status === 'invited');
    if (member) {
      await activateMember(w.id, phone);
      updateSession(phone, { step: 'wallet_menu', walletDraft: { walletId: w.id } });
      return s.memberAccepted(w.name);
    }
  }
  return s.noWallet;
}

// ── Helper: approve request ──
async function handleApprove(from: string, wallet: FamilyWallet, requestId: string, lang: 'es' | 'en'): Promise<string> {
  const s = wt[lang];
  const result = await approveRequest(wallet.id, requestId);
  if (!result) {
    updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
    return s.insufficientBalance(wallet.balanceUsd);
  }

  const requesterName = getMemberName(wallet, result.request.requesterPhone);

  // Notify requester
  queueNotification(
    result.request.requesterPhone,
    wt[lang].requestApprovedNotify(result.request.amountUsd, wallet.name),
  );

  updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
  return s.requestApproved(requesterName, result.request.amountUsd);
}

// ── Helper: deny request ──
async function handleDeny(from: string, wallet: FamilyWallet, requestId: string, lang: 'es' | 'en'): Promise<string> {
  const s = wt[lang];
  const request = await denyRequest(wallet.id, requestId);
  if (!request) {
    updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
    return s.noWallet;
  }

  const requesterName = getMemberName(wallet, request.requesterPhone);

  // Notify requester
  queueNotification(
    request.requesterPhone,
    wt[lang].requestDeniedNotify(request.amountUsd, wallet.name),
  );

  updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
  return s.requestDenied(requesterName, request.amountUsd);
}
