export function tokenUnits(raw, decimals = 18) {
  const value = Number(raw);
  const precision = Number(decimals);
  if (!Number.isFinite(value) || !Number.isFinite(precision) || precision < 0 || precision > 30) return null;
  return value / (10 ** precision);
}

export function formatTokenUnits(raw, decimals = 18, maxFractionDigits = 8) {
  try {
    const precision = Number(decimals);
    if (!Number.isInteger(precision) || precision < 0 || precision > 30) return '—';
    const amount = BigInt(raw);
    const scale = 10n ** BigInt(precision);
    const whole = (amount / scale).toLocaleString();
    if (precision === 0 || maxFractionDigits === 0) return whole;
    const fraction = (amount % scale).toString().padStart(precision, '0').slice(0, maxFractionDigits).replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole;
  } catch {
    return '—';
  }
}

export function classifyActivity(transaction, walletAddress) {
  const actionName = [transaction?.action?.name, transaction?.action?.description, transaction?.function]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let kind = 'Transaction';
  if (/swap|exchange/.test(actionName)) kind = 'Swap';
  else if (/transfer|send/.test(actionName)) kind = 'Transfer';
  else if (/stake|delegate|undelegate|unbond/.test(actionName)) kind = 'Staking';
  else if (transaction?.receiver && transaction.receiver !== walletAddress) kind = 'Contract interaction';

  let direction = 'Activity';
  if (transaction?.sender === walletAddress && transaction?.receiver === walletAddress) direction = 'Self';
  else if (transaction?.sender === walletAddress) direction = 'Sent';
  else if (transaction?.receiver === walletAddress) direction = 'Received';

  return { kind, direction };
}

export function normalizeWalletSnapshot(payload, walletAddress) {
  const tokens = Array.isArray(payload?.tokens) ? payload.tokens : [];
  const holdings = tokens
    .filter((token) => token?.type === 'FungibleESDT' && Number(token.balance) > 0)
    .map((token) => ({
      identifier: token.identifier,
      name: token.name || token.ticker || token.identifier,
      symbol: token.ticker || token.identifier?.split('-')[0] || 'Token',
      balanceRaw: token.balance,
      decimals: token.decimals ?? 18,
      balance: tokenUnits(token.balance, token.decimals ?? 18),
      priceUsd: Number.isFinite(Number(token.price)) ? Number(token.price) : null,
      valueUsd: Number.isFinite(Number(token.price)) && Number.isFinite(tokenUnits(token.balance, token.decimals ?? 18))
        ? Number(token.price) * tokenUnits(token.balance, token.decimals ?? 18)
        : null,
    }));

  const transactions = (Array.isArray(payload?.transactions) ? payload.transactions : []).map((transaction) => ({
    hash: transaction.txHash || transaction.hash,
    timestamp: Number(transaction.timestampMs || Number(transaction.timestamp || 0) * 1000),
    status: transaction.status || 'unknown',
    description: transaction.action?.description || transaction.function || transaction.type || 'Transaction',
    ...classifyActivity(transaction, walletAddress),
    counterpart: transaction.sender === walletAddress ? transaction.receiver : transaction.sender,
  })).filter((transaction) => transaction.hash);

  return { holdings, transactions };
}
