const fs = require('fs');

let content = fs.readFileSync('lib/bot/handler.ts', 'utf8');

// Insert ES strings
const esStrings = `
    sendMethodBankName: \`🏦 *Deposito Bancario*\\n\\n¿Cual es el *nombre del banco* en Republica Dominicana?\\n\\nEjemplo: *Banco Popular* o *Banreservas*\`,

    sendMethodAccount: (bankName: string) =>
      \`🏦 Banco: *\${bankName}*\\n\\n¿Cual es el *numero de cuenta*?\\n\\nEjemplo: *123456789*\`,

    requireSenderKyc: (url: string) => [
      \`🔒 *Verificacion de Identidad*\`,
      \`\`,
      \`Para procesar tu pago, necesitamos verificar tu identidad por seguridad. Haz clic en este enlace seguro para subir tu ID:\`,
      \`\`,
      \`\${url}\`,
      \`\`,
      \`Cuando termines, escribe *listo* aqui.\`,
    ].join('\\n'),

    checkoutLink: (code: string, url: string) => [
      \`💳 *Pago Pendiente*\`,
      \`\`,
      \`Tu transferencia de PlataYa (\${code}) esta casi lista. Completa el pago de forma segura usando tu banco en este enlace:\`,
      \`\`,
      \`\${url}\`,
      \`\`,
      \`Te notificaremos por aqui en cuanto recibamos los fondos.\`
    ].join('\\n'),
`;

content = content.replace(
  /sendConfirm: \(usd: number, dop: number, fee: number, network: number, total: number, name: string, phone: string, method: string\) => \[/g, 
  esStrings + `\n    sendConfirm: (usd: number, dop: number, fee: number, network: number, total: number, name: string, phone: string, method: string) => [`
);

// Insert EN strings
const enStrings = `
    sendMethodBankName: \`🏦 *Bank Deposit*\\n\\nWhat is the *name of the bank* in the Dominican Republic?\\n\\nExample: *Banco Popular* or *Banreservas*\`,

    sendMethodAccount: (bankName: string) =>
      \`🏦 Bank: *\${bankName}*\\n\\nWhat is the *account number*?\\n\\nExample: *123456789*\`,

    requireSenderKyc: (url: string) => [
      \`🔒 *Identity Verification*\`,
      \`\`,
      \`To process your payment, we must verify your identity for security. Click this secure link to upload your ID:\`,
      \`\`,
      \`\${url}\`,
      \`\`,
      \`When finished, type *done* here.\`,
    ].join('\\n'),

    checkoutLink: (code: string, url: string) => [
      \`💳 *Payment Pending*\`,
      \`\`,
      \`Your PlataYa transfer (\${code}) is almost ready. Complete the payment securely using your bank at this link:\`,
      \`\`,
      \`\${url}\`,
      \`\`,
      \`We will notify you here once we receive the funds.\`
    ].join('\\n'),
`;

content = content.replace(
  /sendConfirm: \(usd: number, dop: number, fee: number, network: number, total: number, name: string, phone: string, method: string\) => \[/g, 
  (match, offset, str) => offset > content.length / 2 ? enStrings + '\n    ' + match : match 
); // Hacky way to replace the second instance (EN section)

fs.writeFileSync('lib/bot/handler.ts', content);
console.log('Strings updated');
