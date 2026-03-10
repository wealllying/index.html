import { NextRequest, NextResponse } from 'next/server';
import {
  sendWhatsAppText,
  buildPickupCodeMessage,
  buildAgentPickupMessage,
  buildBankDepositMessage,
  buildKycInviteMessage,
} from '@/lib/whatsapp';

interface SendRequest {
  type: 'pickup_code' | 'agent_pickup' | 'bank_deposit' | 'kyc_invite';
  phone: string;
  recipientName: string;
  amountDop?: number;
  pickupCode?: string;
  referenceNumber?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SendRequest = await req.json();
    const { type, phone, recipientName, amountDop, pickupCode, referenceNumber } = body;

    if (!phone || !recipientName || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let message: string;

    switch (type) {
      case 'pickup_code':
        if (!amountDop || !pickupCode || !referenceNumber) {
          return NextResponse.json({ error: 'Missing pickup_code fields' }, { status: 400 });
        }
        message = buildPickupCodeMessage(recipientName, amountDop, pickupCode, referenceNumber);
        break;

      case 'agent_pickup':
        if (!amountDop || !referenceNumber) {
          return NextResponse.json({ error: 'Missing agent_pickup fields' }, { status: 400 });
        }
        message = buildAgentPickupMessage(recipientName, amountDop, referenceNumber);
        break;

      case 'bank_deposit':
        if (!amountDop || !referenceNumber) {
          return NextResponse.json({ error: 'Missing bank_deposit fields' }, { status: 400 });
        }
        message = buildBankDepositMessage(recipientName, amountDop, referenceNumber);
        break;

      case 'kyc_invite':
        message = buildKycInviteMessage(recipientName);
        break;

      default:
        return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }

    const result = await sendWhatsAppText(phone, message);

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[WhatsApp send]', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
