// lib/whatsapp.ts — Meta WhatsApp Cloud API helper

const GRAPH_API = 'https://graph.facebook.com/v21.0';

interface SendTextResult {
  messageId: string;
}

/**
 * Send a plain text WhatsApp message via Meta Cloud API.
 * Called from API routes only (server-side) — never from the client.
 */
export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<SendTextResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID env vars');
  }

  // Strip any non-digit characters except leading +
  const cleanPhone = to.replace(/[^\d+]/g, '');

  const res = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'text',
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API error ${res.status}: ${JSON.stringify(err)}`,
    );
  }

  const data = await res.json();
  return { messageId: data.messages?.[0]?.id ?? '' };
}

/**
 * Send a WhatsApp template message (required for first-contact / 24h+ window).
 * Template must be pre-approved in Meta Business Manager.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  components?: Record<string, unknown>[],
): Promise<SendTextResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID env vars');
  }

  const cleanPhone = to.replace(/[^\d+]/g, '');

  const payload: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  };

  const res = await fetch(`${GRAPH_API}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API error ${res.status}: ${JSON.stringify(err)}`,
    );
  }

  const data = await res.json();
  return { messageId: data.messages?.[0]?.id ?? '' };
}

// ── Message builders for PlataYa notification types ──

export function buildPickupCodeMessage(
  recipientName: string,
  amountDop: number,
  pickupCode: string,
  referenceNumber: string,
): string {
  return [
    `Hola ${recipientName}!`,
    ``,
    `Te enviaron dinero a traves de PlataYa.`,
    ``,
    `Monto: RD$${amountDop.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `Codigo de retiro: ${pickupCode}`,
    `Referencia: ${referenceNumber}`,
    ``,
    `Puedes retirar en cualquier cajero automatico habilitado.`,
    ``,
    `- PlataYa`,
  ].join('\n');
}

export function buildAgentPickupMessage(
  recipientName: string,
  amountDop: number,
  referenceNumber: string,
): string {
  return [
    `Hola ${recipientName}!`,
    ``,
    `Te enviaron dinero a traves de PlataYa.`,
    ``,
    `Monto: RD$${amountDop.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `Referencia: ${referenceNumber}`,
    ``,
    `Recoge tu dinero en cualquier punto Caribe Express con tu cedula.`,
    ``,
    `- PlataYa`,
  ].join('\n');
}

export function buildBankDepositMessage(
  recipientName: string,
  amountDop: number,
  referenceNumber: string,
): string {
  return [
    `Hola ${recipientName}!`,
    ``,
    `Te depositaron dinero a traves de PlataYa.`,
    ``,
    `Monto: RD$${amountDop.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    `Referencia: ${referenceNumber}`,
    ``,
    `El deposito llegara a tu cuenta en aproximadamente 30 minutos.`,
    ``,
    `- PlataYa`,
  ].join('\n');
}

export function buildKycInviteMessage(recipientName: string): string {
  return [
    `Hola ${recipientName}!`,
    ``,
    `Para que puedas retirar dinero por cajero automatico, necesitamos verificar tu identidad.`,
    ``,
    `Por favor completa la verificacion en el siguiente enlace:`,
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://plataya.app'}/kyc/verify`,
    ``,
    `Solo toma 2 minutos.`,
    ``,
    `- PlataYa`,
  ].join('\n');
}
