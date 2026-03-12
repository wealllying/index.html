const fs = require('fs');

let content = fs.readFileSync('lib/bot/handler.ts', 'utf8');

// 1. Update send_method to branch to bank info if needed
content = content.replace(
  /const draft = \{ \.\.\.session\.draft, method \};\n    updateSession\(from, \{ step: 'send_confirm', draft \}\);\n\n    const usd = draft\.amountUsd!;/g,
  `const draft = { ...session.draft, method };

    if (method === 'bank') {
      updateSession(from, { step: 'send_method_bank_name', draft });
      return s.sendMethodBankName;
    }

    updateSession(from, { step: 'send_confirm', draft });

    const usd = draft.amountUsd!;`
);

// 2. Insert new steps: send_method_bank_name, send_method_account, awaiting_sender_kyc before send_confirm
const newSteps = `
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
      return (s as any).checkoutLink(ref, \`https://plataya.app/checkout?tx=\${ref}\`);
    }

    return session.lang === 'es' 
      ? '⚠️ Aún estamos esperando. Escribe *listo* cuando hayas subido tu documento en el enlace.' 
      : '⚠️ Still waiting. Type *done* when you have uploaded your document at the link.';
  }

`;

content = content.replace(/  \/\/ ── Send flow: confirm ──/g, newSteps + '  // ── Send flow: confirm ──');

// 3. Update confirm to route to KYC instead of instantly processing (simulating an unverified user for the demo)
content = content.replace(
  /const pickupCode = d\.method === 'atm' \? generatePickupCode\(\) : undefined;\n\n      const tx: BotTransaction = \{/g,
  `// Simulate checking user KYC status. If this is a new user or first tx, they need KYC.
      const needsKyc = true; // Hardcoded for demo purposes

      if (needsKyc) {
        updateSession(from, { step: 'awaiting_sender_kyc' });
        return (s as any).requireSenderKyc(\`https://plataya.app/kyc?session=\${from}\`);
      }

      const pickupCode = d.method === 'atm' ? generatePickupCode() : undefined;

      const tx: BotTransaction = {`
);

// 4. Update the final status mapping to support the new pending_payment step
content = content.replace(
  /processing: 'Procesando'/g,
  `pending_payment: 'Esperando Pago', processing: 'Procesando'`
);
content = content.replace(
  /processing: 'Processing'/g,
  `pending_payment: 'Waiting for Payment', processing: 'Processing'`
);


fs.writeFileSync('lib/bot/handler.ts', content);
console.log('Flow updated');
