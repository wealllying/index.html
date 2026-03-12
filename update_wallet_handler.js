const fs = require('fs');

let content = fs.readFileSync('lib/bot/wallet-handler.ts', 'utf8');

content = content.replace(/export function handleWalletMessage/g, 'export async function handleWalletMessage');
content = content.replace(/\): string \| null \{/g, '): Promise<string | null> {');
content = content.replace(/function handleAcceptInvite/g, 'async function handleAcceptInvite');
content = content.replace(/function handleApprove/g, 'async function handleApprove');
content = content.replace(/function handleDeny/g, 'async function handleDeny');
content = content.replace(/\): string \{/g, '): Promise<string> {');

const asyncDbFunctions = [
    'getPrimaryWallet',
    'createWallet',
    'getRecentTransactions',
    'getPendingRequests',
    'addMember',
    'topUp',
    'spend',
    'createRequest',
    'approveRequest',
    'denyRequest',
    'getWalletsByMember',
    'activateMember',
    'handleAcceptInvite',
    'handleApprove',
    'handleDeny'
];

asyncDbFunctions.forEach(fn => {
    // We only want to replace actual function calls, not imports or definitions
    // regex matches an word boundary, function name, zero or more spaces, and then '('
    // We must ensure we don't duplicate `await await` if run twice
    const regex = new RegExp(`(?<!await\\s+)(?<!function\\s+)(?<!async\\s+)(${fn})\\s*\\(`, 'g');
    content = content.replace(regex, `await $1(`);
});

fs.writeFileSync('lib/bot/wallet-handler.ts', content);
console.log('Updated wallet-handler.ts');
