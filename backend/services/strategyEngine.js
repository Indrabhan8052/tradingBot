import { SMA } from 'technicalindicators';

export function smaCrossoverSignal(closes, fastPeriod, slowPeriod) {
  if (closes.length < slowPeriod + 2) return 'none';

  const fastFull = SMA.calculate({ period: fastPeriod, values: closes });
  const slowFull = SMA.calculate({ period: slowPeriod, values: closes });

  const fast = fastFull.slice(fastFull.length - slowFull.length);
  const slow = slowFull;

  const len = slow.length;
  if (len < 2) return 'none';

  const fastPrev = fast[len - 2];
  const fastCurr = fast[len - 1];
  const slowPrev = slow[len - 2];
  const slowCurr = slow[len - 1];

  if (fastPrev <= slowPrev && fastCurr > slowCurr) return 'buy';
  if (fastPrev >= slowPrev && fastCurr < slowCurr) return 'sell';
  return 'none';
}