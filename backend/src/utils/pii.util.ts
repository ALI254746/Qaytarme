/**
 * Redaction helpers for announcement API responses.
 *
 * Announcements are public, but the contact details and the raw collected
 * text behind them are not. Everything that leaves the API goes through
 * `sanitizeAriza` so a scraper cannot harvest phone numbers or emails.
 */

/** Escapes a user supplied string so it can be used inside a RegExp safely. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keepTail(value: string, visible: number): string {
  const tail = value.slice(-visible);
  return `${'\u2022'.repeat(4)}${tail}`;
}

export function maskPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '\u2022'.repeat(4);
  return keepTail(digits, 2);
}

export function maskEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const [local, domain] = email.split('@');
  if (!domain) return '\u2022'.repeat(4);
  const head = local.slice(0, 1) || '\u2022';
  return `${head}${'\u2022'.repeat(3)}@${domain}`;
}

export function maskTelegram(telegram?: string | null): string | undefined {
  if (!telegram) return undefined;
  const handle = telegram.replace(/^@/, '');
  if (handle.length <= 2) return '@\u2022\u2022\u2022';
  return `@${handle.slice(0, 2)}${'\u2022'.repeat(3)}`;
}

/**
 * Provenance is OSINT evidence, but the collected raw text can contain the
 * contact details of third parties, so it never leaves the API.
 */
export function sanitizeProvenance(
  provenance: Record<string, any> | null | undefined,
): Record<string, any> | undefined {
  if (!provenance) return undefined;

  const {
    originalText: _originalText,
    normalizedText: _normalizedText,
    ...safe
  } = provenance;

  return safe;
}

function sanitizeOwner(user: any): any {
  if (!user || typeof user !== 'object') return user;
  if (!('email' in user) && !('phone' in user)) return user;

  const { email: _email, phone: _phone, ...safe } = user;
  return safe;
}

function identifier(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
}

/**
 * Returns true when the viewer is a party to the announcement and is
 * therefore allowed to see the contact details.
 */
export function canSeeContacts(
  item: Record<string, any>,
  viewerId?: string | null,
): boolean {
  if (!viewerId) return false;
  return (
    identifier(item.user) === viewerId ||
    identifier(item.matchedUser) === viewerId
  );
}

/**
 * Removes or masks every personally identifiable field of an announcement.
 *
 * @param item Plain announcement object (use `.toObject()` or `.lean()`).
 * @param viewerId Authenticated user id, when available.
 */
export function sanitizeAriza(
  item: Record<string, any> | null | undefined,
  viewerId?: string | null,
): Record<string, any> | null {
  if (!item) return null;

  const plain = typeof item.toObject === 'function' ? item.toObject() : item;
  const privileged = canSeeContacts(plain, viewerId);

  const sanitized: Record<string, any> = {
    ...plain,
    user: sanitizeOwner(plain.user),
  };

  if (plain.provenance) {
    sanitized.provenance = sanitizeProvenance(plain.provenance);
  }

  if (privileged) return sanitized;

  if ('phone' in sanitized) sanitized.phone = maskPhone(plain.phone);
  if ('email' in sanitized) sanitized.email = maskEmail(plain.email);
  if ('telegram' in sanitized) sanitized.telegram = maskTelegram(plain.telegram);

  return sanitized;
}

export function sanitizeArizaList(
  items: Array<Record<string, any>>,
  viewerId?: string | null,
): Array<Record<string, any>> {
  return items
    .map((item) => sanitizeAriza(item, viewerId))
    .filter((item): item is Record<string, any> => item !== null);
}
