/**
 * Normalize friendly bill-ID formats into canonical "congress/type/number".
 *
 * Accepts: "119/hr/1", "HR 3684", "H.R. 3684", "H. R. 3684", "hr3684",
 *          "S 12", "HJRES 1", "H.J.Res. 1", "118 hr 3684".
 * Returns null if the input does not look like a bill-ID shape.
 */

export const CURRENT_CONGRESS = 119;

const BILL_TYPES = ['hjres', 'sjres', 'hconres', 'sconres', 'hres', 'sres', 'hr', 's'] as const;
type BillType = (typeof BILL_TYPES)[number];

function stripTypePunctuation(token: string): string {
  return token.replace(/[.\s]/g, '').toLowerCase();
}

function matchBillType(token: string): BillType | null {
  const stripped = stripTypePunctuation(token);
  for (const t of BILL_TYPES) {
    if (stripped === t) return t;
  }
  return null;
}

export function normalizeBillId(input: string, defaultCongress = CURRENT_CONGRESS): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Canonical: "119/hr/1", "118/H.R./3684"
  const canonical = /^(\d{1,3})\/([a-zA-Z.]+)\/(\d+)$/.exec(trimmed);
  if (canonical) {
    const type = matchBillType(canonical[2]);
    if (!type) return null;
    return `${canonical[1]}/${type}/${canonical[3]}`;
  }

  // Flexible: optional congress, type token (with punctuation), number.
  const flexible = /^(?:(\d{1,3})[\s/]+)?([a-zA-Z][a-zA-Z.\s]*?)[\s.]*(\d+)$/.exec(trimmed);
  if (!flexible) return null;

  const [, congressStr, typeRaw, numberStr] = flexible;
  const type = matchBillType(typeRaw);
  if (!type) return null;

  const congress = congressStr ? parseInt(congressStr, 10) : defaultCongress;
  if (!Number.isFinite(congress) || congress < 1 || congress > 200) return null;

  const num = parseInt(numberStr, 10);
  if (!Number.isFinite(num) || num < 1) return null;

  return `${congress}/${type}/${num}`;
}
