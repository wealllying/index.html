import { NextRequest, NextResponse } from 'next/server';
import { handleMessage } from '@/lib/bot/handler';
import { sendWhatsAppText } from '@/lib/whatsapp';

/**
 * GET  — Meta webhook verification (one-time setup).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp webhook] Verified');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Track processed message IDs to prevent duplicates (Meta sometimes retries)
const processedMessages = new Set<string>();

/**
 * POST — Incoming webhook events from Meta.
 * Routes incoming text messages through the PlataYa chatbot handler
 * and replies via the WhatsApp Cloud API.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries = body.entry ?? [];

    for (const entry of entries) {
      const changes = entry.changes ?? [];
      for (const change of changes) {
        const value = change.value;

        // Delivery status updates (log only)
        const statuses = value?.statuses ?? [];
        for (const status of statuses) {
          console.log(
            `[WhatsApp status] id=${status.id} status=${status.status} recipient=${status.recipient_id}`,
          );
        }

        // Incoming messages → route through chatbot
        const messages = value?.messages ?? [];
        const contacts = value?.contacts ?? [];

        for (const msg of messages) {
          // Deduplicate
          if (processedMessages.has(msg.id)) continue;
          processedMessages.add(msg.id);

          // Only handle text messages for now
          if (msg.type !== 'text') {
            console.log(`[WhatsApp incoming] Ignoring non-text message type=${msg.type} from=${msg.from}`);
            continue;
          }

          const from = msg.from;
          const text = msg.text?.body ?? '';
          const senderName = contacts.find(
            (c: { wa_id: string; profile?: { name?: string } }) => c.wa_id === from,
          )?.profile?.name;

          console.log(`[WhatsApp incoming] from=${from} name=${senderName ?? 'unknown'} text="${text}"`);

          // Get bot response
          const reply = handleMessage(from, text, senderName);

          // Send reply back via WhatsApp
          try {
            await sendWhatsAppText(from, reply);
            console.log(`[WhatsApp reply] to=${from} length=${reply.length}`);
          } catch (sendErr) {
            console.error(`[WhatsApp reply failed] to=${from}`, sendErr);
          }
        }
      }
    }

    // Cleanup old message IDs periodically (keep set from growing)
    if (processedMessages.size > 10000) {
      processedMessages.clear();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[WhatsApp webhook error]', err);
    return NextResponse.json({ ok: true }); // 200 to prevent Meta retries
  }
}
