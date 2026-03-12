// lib/bot/handler.ts — Main WhatsApp chatbot conversation handler

import { getSession, updateSession, resetSession, type BotStep } from './sessions';
import { EXCHANGE_RATE, NETWORK_FEE, getPlatayaFee, generatePickupCode, generateReferenceNumber } from '../types';
import { handleWalletMessage } from './wallet-handler';

// ── Strings ──

const t = {
  es: {
    welcome: (name?: string) => [
      name ? `Hola ${name}! 👋` : `Hola! 👋`,
      `Soy *PlataYa Bot* — tu asistente para enviar dinero a Republica Dominicana.`,
      ``,
      `Escribe un numero para elegir:`,
      ``,
      `*1.* 💸 Enviar dinero`,
      `*2.* 📊 Ver tasa de cambio`,
      `*3.* 🔍 Consultar estado de envio`,
      `*4.* ❓ Ayuda`,
      `*5.* 🇺🇸 Switch to English`,
      `*6.* 👨‍👩‍👧‍👦 Wallet Familiar`,
    ].join('\n'),

    sendAmount: `💸 *Enviar dinero*\n\n¿Cuanto quieres enviar en dolares (USD)?\n\nEjemplo: *100*`,

    invalidAmount: `⚠️ Escribe un monto valido en dolares.\n\nEjemplo: *100* o *250.50*`,

    amountTooLow: `⚠️ El monto minimo es *$5 USD*.`,

    sendRecipientName: (usd: number, dop: number, fee: number) => [
      `💰 Enviando: *$${usd.toFixed(2)} USD*`,
      `📥 Recibe: *RD$${dop.toLocaleString('en-US', { minimumFractionDigits: 2 })}*`,
      `💳 Comision: *$${fee.toFixed(2)} USD*`,
      ``,
      `¿Cual es el *nombre completo* de quien recibe?`,
    ].join('\n'),

    sendRecipientPhone: (name: string) =>
      `👤 Destinatario: *${name}*\n\n¿Cual es su *numero de telefono* (con codigo de pais)?\n\nEjemplo: *18095551234*`,

    sendMethod: (name: string) => [
      `📱 Numero registrado para *${name}*`,
      ``,
      `¿Como quiere retirar el dinero?`,
      ``,
      `*1.* 🏧 Cajero automatico (ATM) — codigo de retiro`,
      `*2.* 🏪 Caribe Express — recoge con cedula`,
      `*3.* 🏦 Deposito bancario — directo a cuenta`,
    ].join('\n'),

    invalidMethod: `⚠️ Escribe *1*, *2* o *3* para elegir el metodo.`,

    
    sendMethodBankName: `🏦 *Deposito Bancario*\n\n¿Cual es el *nombre del banco* en Republica Dominicana?\n\nEjemplo: *Banco Popular* o *Banreservas*`,

    sendMethodAccount: (bankName: string) =>
      `🏦 Banco: *${bankName}*\n\n¿Cual es el *numero de cuenta*?\n\nEjemplo: *123456789*`,

    requireSenderKyc: (url: string) => [
      `🔒 *Verificacion de Identidad*`,
      ``,
      `Para procesar tu pago, necesitamos verificar tu identidad por seguridad. Haz clic en este enlace seguro para subir tu ID:`,
      ``,
      `${url}`,
      ``,
      `Cuando termines, escribe *listo* aqui.`,
    ].join('\n'),

    checkoutLink: (code: string, url: string) => [
      `💳 *Pago Pendiente*`,
      ``,
      `Tu transferencia de PlataYa (${code}) esta casi lista. Completa el pago de forma segura usando tu banco en este enlace:`,
      ``,
      `${url}`,
      ``,
      `Te notificaremos por aqui en cuanto recibamos los fondos.`
    ].join('\n'),

    sendConfirm: (usd: number, dop: number, fee: number, network: number, total: number, name: string, phone: string, method: string) => [
      `📋 *Resumen de tu envio:*`,
      ``,
      `👤 Destinatario: *${name}*`,
      `📱 Telefono: *${phone}*`,
      `💸 Envia: *$${usd.toFixed(2)} USD*`,
      `📥 Recibe: *RD$${dop.toLocaleString('en-US', { minimumFractionDigits: 2 })}*`,
      `💳 Comision PlataYa: *$${fee.toFixed(2)}*`,
      `🔗 Comision red: *$${network.toFixed(2)}*`,
      `💰 Total a pagar: *$${total.toFixed(2)} USD*`,
      `📊 Tasa: *1 USD = ${EXCHANGE_RATE} DOP*`,
      `🏧 Metodo: *${method}*`,
      ``,
      `Escribe *SI* para confirmar o *NO* para cancelar.`,
    ].join('\n'),

    confirmed: (ref: string, pickupCode?: string) => {
      const lines = [
        `✅ *Envio confirmado!*`,
        ``,
        `📄 Referencia: *${ref}*`,
      ];
      if (pickupCode) {
        lines.push(`🔑 Codigo de retiro: *${pickupCode}*`);
      }
      lines.push(
        ``,
        `Tu envio esta siendo procesado. El destinatario recibira una notificacion por WhatsApp cuando este listo.`,
        ``,
        `⏱ Tiempo estimado: ~15 minutos`,
        ``,
        `Escribe *menu* para volver al inicio.`,
      );
      return lines.join('\n');
    },

    cancelled: `❌ Envio cancelado.\n\nEscribe *menu* para volver al inicio.`,

    rate: [
      `📊 *Tasa de cambio actual:*`,
      ``,
      `*1 USD = ${EXCHANGE_RATE} DOP*`,
      ``,
      `Comisiones:`,
      `• Envios < $200: *$1.99 USD*`,
      `• Envios >= $200: *$2.99 USD*`,
      `• Red (USDC): *$0.50 USD*`,
      ``,
      `Escribe *1* para enviar dinero o *menu* para el inicio.`,
    ].join('\n'),

    statusAsk: `🔍 Escribe el *numero de referencia* de tu envio.\n\nEjemplo: *PY-ABC123*`,

    statusNotFound: (ref: string) =>
      `⚠️ No encontramos el envio con referencia *${ref}*.\n\nVerifica el numero e intenta de nuevo, o escribe *menu* para volver al inicio.`,

    statusFound: (ref: string, status: string, amount: string, recipient: string) => [
      `🔍 *Estado de envio:*`,
      ``,
      `📄 Ref: *${ref}*`,
      `👤 Destinatario: *${recipient}*`,
      `💰 Monto: *${amount}*`,
      `📊 Estado: *${status}*`,
      ``,
      `Escribe *menu* para volver al inicio.`,
    ].join('\n'),

    help: [
      `❓ *Ayuda — PlataYa Bot*`,
      ``,
      `Puedo ayudarte a:`,
      ``,
      `💸 *Enviar dinero* — escribe *1* o *enviar*`,
      `📊 *Ver tasa* — escribe *2* o *tasa*`,
      `🔍 *Estado de envio* — escribe *3* o *estado*`,
      `🔄 *Volver al inicio* — escribe *menu*`,
      `❌ *Cancelar* — escribe *cancelar* en cualquier momento`,
      ``,
      `📞 Soporte: support@plataya.app`,
    ].join('\n'),

    methodNames: { atm: 'Cajero automatico (ATM)', agent: 'Caribe Express', bank: 'Deposito bancario' } as Record<string, string>,
  },

  en: {
    welcome: (name?: string) => [
      name ? `Hi ${name}! 👋` : `Hi! 👋`,
      `I'm *PlataYa Bot* — your assistant for sending money to the Dominican Republic.`,
      ``,
      `Type a number to choose:`,
      ``,
      `*1.* 💸 Send money`,
      `*2.* 📊 Exchange rate`,
      `*3.* 🔍 Check transfer status`,
      `*4.* ❓ Help`,
      `*5.* 🇩🇴 Cambiar a Español`,
      `*6.* 👨‍👩‍👧‍👦 Family Wallet`,
    ].join('\n'),

    sendAmount: `💸 *Send money*\n\nHow much do you want to send in USD?\n\nExample: *100*`,

    invalidAmount: `⚠️ Enter a valid dollar amount.\n\nExample: *100* or *250.50*`,

    amountTooLow: `⚠️ Minimum amount is *$5 USD*.`,

    sendRecipientName: (usd: number, dop: number, fee: number) => [
      `💰 Sending: *$${usd.toFixed(2)} USD*`,
      `📥 Receives: *RD$${dop.toLocaleString('en-US', { minimumFractionDigits: 2 })}*`,
      `💳 Fee: *$${fee.toFixed(2)} USD*`,
      ``,
      `What is the recipient's *full name*?`,
    ].join('\n'),

    sendRecipientPhone: (name: string) =>
      `👤 Recipient: *${name}*\n\nWhat is their *phone number* (with country code)?\n\nExample: *18095551234*`,

    sendMethod: (name: string) => [
      `📱 Number saved for *${name}*`,
      ``,
      `How should they pick up the money?`,
      ``,
      `*1.* 🏧 ATM — pickup code`,
      `*2.* 🏪 Caribe Express — with cedula`,
      `*3.* 🏦 Bank deposit — direct to account`,
    ].join('\n'),

    invalidMethod: `⚠️ Type *1*, *2* or *3* to choose the method.`,

    
    sendMethodBankName: `🏦 *Deposito Bancario*\n\n¿Cual es el *nombre del banco* en Republica Dominicana?\n\nEjemplo: *Banco Popular* o *Banreservas*`,

    sendMethodAccount: (bankName: string) =>
      `🏦 Banco: *${bankName}*\n\n¿Cual es el *numero de cuenta*?\n\nEjemplo: *123456789*`,

    requireSenderKyc: (url: string) => [
      `🔒 *Verificacion de Identidad*`,
      ``,
      `Para procesar tu pago, necesitamos verificar tu identidad por seguridad. Haz clic en este enlace seguro para subir tu ID:`,
      ``,
      `${url}`,
      ``,
      `Cuando termines, escribe *listo* aqui.`,
    ].join('\n'),

    checkoutLink: (code: string, url: string) => [
      `💳 *Pago Pendiente*`,
      ``,
      `Tu transferencia de PlataYa (${code}) esta casi lista. Completa el pago de forma segura usando tu banco en este enlace:`,
      ``,
      `${url}`,
      ``,
      `Te notificaremos por aqui en cuanto recibamos los fondos.`
    ].join('\n'),

    sendConfirm: (usd: number, dop: number, fee: number, network: number, total: number, name: string, phone: string, method: string) => [
      `📋 *Transfer summary:*`,
      ``,
      `👤 Recipient: *${name}*`,
      `📱 Phone: *${phone}*`,
      `💸 Sending: *$${usd.toFixed(2)} USD*`,
      `📥 Receives: *RD$${dop.toLocaleString('en-US', { minimumFractionDigits: 2 })}*`,
      `💳 PlataYa fee: *$${fee.toFixed(2)}*`,
      `🔗 Network fee: *$${network.toFixed(2)}*`,
      `💰 Total charge: *$${total.toFixed(2)} USD*`,
      `📊 Rate: *1 USD = ${EXCHANGE_RATE} DOP*`,
      `🏧 Method: *${method}*`,
      ``,
      `Type *YES* to confirm or *NO* to cancel.`,
    ].join('\n'),

    confirmed: (ref: string, pickupCode?: string) => {
      const lines = [
        `✅ *Transfer confirmed!*`,
        ``,
        `📄 Reference: *${ref}*`,
      ];
      if (pickupCode) {
        lines.push(`🔑 Pickup code: *${pickupCode}*`);
      }
      lines.push(
        ``,
        `Your transfer is being processed. The recipient will get a WhatsApp notification when it's ready.`,
        ``,
        `⏱ Estimated time: ~15 minutes`,
        ``,
        `Type *menu* to go back.`,
      );
      return lines.join('\n');
    },

    cancelled: `❌ Transfer cancelled.\n\nType *menu* to go back.`,

    rate: [
      `📊 *Current exchange rate:*`,
      ``,
      `*1 USD = ${EXCHANGE_RATE} DOP*`,
      ``,
      `Fees:`,
      `• Under $200: *$1.99 USD*`,
      `• $200+: *$2.99 USD*`,
      `• Network (USDC): *$0.50 USD*`,
      ``,
      `Type *1* to send money or *menu* to go back.`,
    ].join('\n'),

    statusAsk: `🔍 Enter your transfer *reference number*.\n\nExample: *PY-ABC123*`,

    statusNotFound: (ref: string) =>
      `⚠️ No transfer found with reference *${ref}*.\n\nDouble-check and try again, or type *menu* to go back.`,

    statusFound: (ref: string, status: string, amount: string, recipient: string) => [
      `🔍 *Transfer status:*`,
      ``,
      `📄 Ref: *${ref}*`,
      `👤 Recipient: *${recipient}*`,
      `💰 Amount: *${amount}*`,
      `📊 Status: *${status}*`,
      ``,
      `Type *menu* to go back.`,
    ].join('\n'),

    help: [
      `❓ *Help — PlataYa Bot*`,
      ``,
      `I can help you:`,
      ``,
      `💸 *Send money* — type *1* or *send*`,
      `📊 *Exchange rate* — type *2* or *rate*`,
      `🔍 *Transfer status* — type *3* or *status*`,
      `🔄 *Main menu* — type *menu*`,
      `❌ *Cancel* — type *cancel* anytime`,
      ``,
      `📞 Support: support@plataya.app`,
    ].join('\n'),

    methodNames: { atm: 'ATM Pickup', agent: 'Caribe Express', bank: 'Bank Deposit' } as Record<string, string>,
  },
};

// ── Simple transaction store (in-memory, matches bot-created transactions) ──

interface BotTransaction {
  ref: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  amountUsd: number;
  amountDop: number;
  method: 'atm' | 'agent' | 'bank';
  pickupCode?: string;
  status: string;
  createdAt: string;
}

const botTransactions = new Map<string, BotTransaction>();

export function getBotTransaction(ref: string): BotTransaction | undefined {
  return botTransactions.get(ref.toUpperCase());
}

// ── Main handler ──

export async function handleMessage(from: string, text: string, senderName?: string): Promise<string> {
  const session = getSession(from);
  const s = t[session.lang];
  const input = text.trim();
  const lower = input.toLowerCase();

  // Global commands — work from any step
  if (lower === 'menu' || lower === 'inicio' || lower === 'start' || lower === 'hi' || lower === 'hola' || lower === 'reiniciar' || lower === 'restart') {
    resetSession(from);
    return s.welcome(senderName);
  }
  if (lower === 'cancelar' || lower === 'cancel') {
    resetSession(from);
    return s.cancelled;
  }
  if (lower === 'ayuda' || lower === 'help') {
    resetSession(from);
    return s.help;
  }

  // Try wallet handler first (handles all wallet_* steps and wallet entry)
  const walletReply = await handleWalletMessage(from, text, senderName);
  if (walletReply) return walletReply;

  // Language switch
  if (lower === '5' && session.step === 'idle') {
    const newLang = session.lang === 'es' ? 'en' : 'es';
    updateSession(from, { lang: newLang });
    return t[newLang].welcome(senderName);
  }

  // ── Idle / Menu selection ──
  if (session.step === 'idle') {
    if (lower === '1' || lower === 'enviar' || lower === 'send') {
      updateSession(from, { step: 'send_amount', draft: {} });
      return s.sendAmount;
    }
    if (lower === '2' || lower === 'tasa' || lower === 'rate') {
      return s.rate;
    }
    if (lower === '3' || lower === 'estado' || lower === 'status') {
      updateSession(from, { step: 'status_ref' });
      return s.statusAsk;
    }
    if (lower === '4' || lower === 'ayuda' || lower === 'help') {
      return s.help;
    }
    // Didn't match — show menu
    return s.welcome(senderName);
  }

  // ── Send flow: amount ──
  if (session.step === 'send_amount') {
    const amount = parseFloat(input.replace(/[$,]/g, ''));
    if (isNaN(amount) || amount <= 0) return s.invalidAmount;
    if (amount < 5) return s.amountTooLow;

    const fee = getPlatayaFee(amount);
    const dop = amount * EXCHANGE_RATE;
    updateSession(from, { step: 'send_recipient_name', draft: { ...session.draft, amountUsd: amount } });
    return s.sendRecipientName(amount, dop, fee);
  }

  // ── Send flow: recipient name ──
  if (session.step === 'send_recipient_name') {
    if (input.length < 2) {
      return session.lang === 'es' ? '⚠️ Escribe el nombre completo.' : '⚠️ Enter the full name.';
    }
    updateSession(from, { step: 'send_recipient_phone', draft: { ...session.draft, recipientName: input } });
    return s.sendRecipientPhone(input);
  }

  // ── Send flow: recipient phone ──
  if (session.step === 'send_recipient_phone') {
    const phone = input.replace(/[\s\-()]/g, '');
    if (phone.length < 7 || !/^\+?\d+$/.test(phone)) {
      return session.lang === 'es'
        ? '⚠️ Numero invalido. Incluye el codigo de pais.\n\nEjemplo: *18095551234*'
        : '⚠️ Invalid number. Include country code.\n\nExample: *18095551234*';
    }
    updateSession(from, { step: 'send_method', draft: { ...session.draft, recipientPhone: phone } });
    return s.sendMethod(session.draft.recipientName!);
  }

  // ── Send flow: method ──
  if (session.step === 'send_method') {
    let method: 'atm' | 'agent' | 'bank';
    if (lower === '1' || lower === 'atm' || lower === 'cajero') method = 'atm';
    else if (lower === '2' || lower === 'caribe' || lower === 'agent') method = 'agent';
    else if (lower === '3' || lower === 'banco' || lower === 'bank') method = 'bank';
    else return s.invalidMethod;

    const draft = { ...session.draft, method };

    if (method === 'bank') {
      updateSession(from, { step: 'send_method_bank_name', draft });
      return s.sendMethodBankName;
    }

    updateSession(from, { step: 'send_confirm', draft });

    const usd = draft.amountUsd!;
    const dop = usd * EXCHANGE_RATE;
    const fee = getPlatayaFee(usd);
    const total = usd + fee + NETWORK_FEE;
    return s.sendConfirm(usd, dop, fee, NETWORK_FEE, total, draft.recipientName!, draft.recipientPhone!, s.methodNames[method]);
  }


  // ── Send flow: bank name ──
  if (session.step === 'send_method_bank_name') {
    if (input.length < 2) {
      return session.lang === 'es' ? '⚠️ Escribe el nombre del banco.' : '⚠️ Enter the bank name.';
    }
    updateSession(from, { step: 'send_method_account', draft: { ...session.draft, bankName: input } });
    return (s as any).sendMethodAccount(input);
  }

  // ── Send flow: bank account ──
  if (session.step === 'send_method_account') {
    if (input.length < 4) {
      return session.lang === 'es' ? '⚠️ Numero de cuenta muy corto.' : '⚠️ Account number too short.';
    }
    const draft = { ...session.draft, bankAccountNumber: input };
    updateSession(from, { step: 'send_confirm', draft });

    const usd = draft.amountUsd!;
    const dop = usd * EXCHANGE_RATE;
    const fee = getPlatayaFee(usd);
    const total = usd + fee + NETWORK_FEE;
    return s.sendConfirm(usd, dop, fee, NETWORK_FEE, total, draft.recipientName!, draft.recipientPhone!, s.methodNames[draft.method!]);
  }

  // ── Send flow: awaiting kyc ──
  if (session.step === 'awaiting_sender_kyc') {
    if (lower === 'listo' || lower === 'done') {
      // In a real app, we would verify the DB status here. For now, we simulate success and move to checkout.
      const d = session.draft;
      const ref = generateReferenceNumber();
      // Simulate checking user KYC status. If this is a new user or first tx, they need KYC.
      const needsKyc = true; // Hardcoded for demo purposes

      if (needsKyc) {
        updateSession(from, { step: 'awaiting_sender_kyc' });
        return (s as any).requireSenderKyc(`https://plataya.app/kyc?session=${from}`);
      }

      const pickupCode = d.method === 'atm' ? generatePickupCode() : undefined;

      const tx: BotTransaction = {
        ref,
        senderPhone: from,
        recipientName: d.recipientName!,
        recipientPhone: d.recipientPhone!,
        amountUsd: d.amountUsd!,
        amountDop: d.amountUsd! * EXCHANGE_RATE,
        method: d.method!,
        pickupCode,
        status: 'pending_payment',
        createdAt: new Date().toISOString(),
      };
      botTransactions.set(ref.toUpperCase(), tx);

      resetSession(from);
      return (s as any).checkoutLink(ref, `https://plataya.app/checkout?tx=${ref}`);
    }

    return session.lang === 'es' 
      ? '⚠️ Aún estamos esperando. Escribe *listo* cuando hayas subido tu documento en el enlace.' 
      : '⚠️ Still waiting. Type *done* when you have uploaded your document at the link.';
  }

  // ── Send flow: confirm ──
  if (session.step === 'send_confirm') {
    if (lower === 'si' || lower === 'sí' || lower === 'yes' || lower === 'y') {
      const d = session.draft;
      const ref = generateReferenceNumber();
      // Simulate checking user KYC status. If this is a new user or first tx, they need KYC.
      const needsKyc = true; // Hardcoded for demo purposes

      if (needsKyc) {
        updateSession(from, { step: 'awaiting_sender_kyc' });
        return (s as any).requireSenderKyc(`https://plataya.app/kyc?session=${from}`);
      }

      const pickupCode = d.method === 'atm' ? generatePickupCode() : undefined;

      const tx: BotTransaction = {
        ref,
        senderPhone: from,
        recipientName: d.recipientName!,
        recipientPhone: d.recipientPhone!,
        amountUsd: d.amountUsd!,
        amountDop: d.amountUsd! * EXCHANGE_RATE,
        method: d.method!,
        pickupCode,
        status: 'processing',
        createdAt: new Date().toISOString(),
      };
      botTransactions.set(ref.toUpperCase(), tx);

      resetSession(from);
      return s.confirmed(ref, pickupCode);
    }

    if (lower === 'no' || lower === 'n') {
      resetSession(from);
      return s.cancelled;
    }

    return session.lang === 'es'
      ? '⚠️ Escribe *SI* para confirmar o *NO* para cancelar.'
      : '⚠️ Type *YES* to confirm or *NO* to cancel.';
  }

  // ── Status lookup ──
  if (session.step === 'status_ref') {
    const ref = input.toUpperCase();
    const tx = botTransactions.get(ref);
    resetSession(from);

    if (!tx) return s.statusNotFound(ref);

    const statusLabels: Record<string, Record<string, string>> = {
      es: { pending_payment: 'Esperando Pago', processing: 'Procesando', ready: 'Listo para retiro', picked_up: 'Retirado', cancelled: 'Cancelado' },
      en: { pending_payment: 'Waiting for Payment', processing: 'Processing', ready: 'Ready for pickup', picked_up: 'Picked up', cancelled: 'Cancelled' },
    };

    return s.statusFound(
      ref,
      statusLabels[session.lang][tx.status] ?? tx.status,
      `$${tx.amountUsd.toFixed(2)} USD / RD$${tx.amountDop.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      tx.recipientName,
    );
  }

  // Fallback
  return s.welcome(senderName);
}
