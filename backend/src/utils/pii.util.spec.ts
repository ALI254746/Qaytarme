import {
  canSeeContacts,
  escapeRegex,
  maskEmail,
  maskPhone,
  maskTelegram,
  sanitizeAriza,
  sanitizeProvenance,
} from './pii.util';

const ownerId = '650000000000000000000001';
const matchedId = '650000000000000000000002';
const strangerId = '650000000000000000000003';

const announcement = {
  _id: '650000000000000000000010',
  itemType: 'pasport',
  user: { _id: ownerId, name: 'Ali', email: 'ali@example.com', avatar: 'a.png' },
  matchedUser: matchedId,
  phone: '+998901234567',
  email: 'owner@example.com',
  telegram: '@alikhon',
  provenance: {
    sourceType: 'telegram',
    sourceUrl: 'https://t.me/topilgan/12',
    contentHash: 'a'.repeat(64),
    originalText: 'Pasport topildi, tel +998901234567',
    normalizedText: 'pasport topildi tel 998901234567',
  },
};

describe('PII redaction', () => {
  it('escapes regex metacharacters from user input', () => {
    expect(escapeRegex('(a+)+$')).toBe('\\(a\\+\\)\\+\\$');
    expect(new RegExp(escapeRegex('pasport (AA)')).test('pasport (AA)')).toBe(true);
  });

  it('masks contact values but keeps them recognisable', () => {
    expect(maskPhone('+998901234567')).toBe('\u2022\u2022\u2022\u202267');
    expect(maskEmail('owner@example.com')).toBe('o\u2022\u2022\u2022@example.com');
    expect(maskTelegram('@alikhon')).toBe('@al\u2022\u2022\u2022');
  });

  it('never returns the collected raw text', () => {
    const safe = sanitizeProvenance(announcement.provenance);

    expect(safe).not.toHaveProperty('originalText');
    expect(safe).not.toHaveProperty('normalizedText');
    expect(safe?.sourceUrl).toBe('https://t.me/topilgan/12');
  });

  it('hides contacts and the owner email from anonymous viewers', () => {
    const safe = sanitizeAriza(announcement);

    expect(safe?.phone).toBe('\u2022\u2022\u2022\u202267');
    expect(safe?.email).toBe('o\u2022\u2022\u2022@example.com');
    expect(safe?.user).not.toHaveProperty('email');
    expect(JSON.stringify(safe)).not.toContain('998901234567');
    expect(JSON.stringify(safe)).not.toContain('ali@example.com');
  });

  it('hides contacts from unrelated authenticated users', () => {
    const safe = sanitizeAriza(announcement, strangerId);

    expect(safe?.phone).toBe('\u2022\u2022\u2022\u202267');
    expect(canSeeContacts(announcement, strangerId)).toBe(false);
  });

  it('shows contacts to the owner and to the matched user', () => {
    expect(sanitizeAriza(announcement, ownerId)?.phone).toBe('+998901234567');
    expect(sanitizeAriza(announcement, matchedId)?.telegram).toBe('@alikhon');
  });

  it('still strips raw provenance text for privileged viewers', () => {
    const safe = sanitizeAriza(announcement, ownerId);

    expect(safe?.provenance).not.toHaveProperty('originalText');
  });
});
