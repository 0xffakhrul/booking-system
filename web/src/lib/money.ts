// Prices are stored and sent as whole sen (2800 = RM 28.00), so there's no floating-point money.

const ringgit = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
});

/** 2800 → "RM 28.00", or with `short`, "RM 28" (sen only when there are some: "RM 28.50") */
export function formatPrice(sen: number, { short = false } = {}) {
  if (short && sen % 100 === 0) return `RM ${sen / 100}`;
  return ringgit.format(sen / 100);
}

/** 2800 → "28.00", for filling in a form */
export function senToRinggit(sen: number) {
  return (sen / 100).toFixed(2);
}

/** "28.5" → 2850. Math.round fixes float noise like 19.99 * 100 = 1998.9999… */
export function ringgitToSen(text: string) {
  return Math.round(Number(text) * 100);
}
