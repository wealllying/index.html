const fs = require('fs');

let content = fs.readFileSync('lib/bot/wallet-handler.ts', 'utf8');

const newConfirmBlock = `
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
          \`🔒 *Verificación de Identidad*\\n\\nPara procesar tu pago, necesitamos verificar tu identidad por seguridad. Haz clic aquí para subir tu ID:\\n\\nhttps://plataya.app/kyc?session=\${from}\\n\\nCuando termines, escribe *listo* aqui.\` :
          \`🔒 *Identity Verification*\\n\\nTo process your payment, we must verify your identity for security. Click here to upload your ID:\\n\\nhttps://plataya.app/kyc?session=\${from}\\n\\nWhen finished, type *done* here.\`;
      }

      // If they were verified, we'd take them to checkout (covered in the next step anyway)
    }
    if (lower === 'no' || lower === 'n') {
      const wallet = session.walletDraft.walletId ? await getPrimaryWallet(from) : null;
      updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet?.id } });
      return session.lang === 'es' ? '❌ Cancelado.\\n\\nEscribe *wallet* para ver el menu.' : '❌ Cancelled.\\n\\nType *wallet* to see the menu.';
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
      // When the webhook fires that they paid, the real \`topUp\` function would be called.
      const amount = session.walletDraft.amountUsd!;
      updateSession(from, { step: 'wallet_menu', walletDraft: { walletId: wallet.id } });
      
      return session.lang === 'es' ?
        \`💳 *Pago Pendiente*\\n\\nTu recarga de $100 USD está casi lista. Completa el pago de forma segura usando tu banco en este enlace:\\n\\nhttps://plataya.app/checkout?wallet=\${wallet.id}&amount=\${amount}\\n\\nTe notificaremos por aqui en cuanto recibamos los fondos.\` :
        \`💳 *Payment Pending*\\n\\nYour top-up of $100 USD is almost ready. Complete the payment securely using your bank at this link:\\n\\nhttps://plataya.app/checkout?wallet=\${wallet.id}&amount=\${amount}\\n\\nWe will notify you here once we receive the funds.\`;
    }
    return session.lang === 'es' 
      ? '⚠️ Aún estamos esperando. Escribe *listo* cuando hayas subido tu documento en el enlace.' 
      : '⚠️ Still waiting. Type *done* when you have uploaded your document at the link.';
  }
`;

content = content.replace(
  /\/\/ ── Top up: confirm ──[\s\S]*?(?=\/\/ ── Spend: amount ──)/,
  newConfirmBlock + '\n  '
);

fs.writeFileSync('lib/bot/wallet-handler.ts', content);
console.log('Wallet KYC updated');
