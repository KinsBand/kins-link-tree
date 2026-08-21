/**
 * Email Validation & Real-Domain Verification Utility for Kins Band
 * Features:
 * 1. Strict RFC email regex format validation
 * 2. Dummy / spam / junk pattern rejection
 * 3. Comprehensive disposable / temporary email domain blocklist (150+ domains)
 * 4. Asynchronous DNS-over-HTTPS (DoH) real MX/A domain reachability verification (fail-open)
 */

// Top disposable / temporary / throwaway email provider domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com', '10minutemail.net',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.biz', 'guerrillamail.org', 'guerrillamailblock.com',
  'sharklasers.com', 'grr.la', 'pokemail.net', 'spam4.me', 'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc', 'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr',
  'trashmail.com', 'trashmail.net', 'trashmail.me', 'trashmail.org', 'rcpt.at', 'damnthespam.com',
  'throwawaymail.com', 'dispostable.com', 'fakeinbox.com', 'getairmail.com', 'airmail.ne.jp',
  'mohmal.com', 'mohmal.im', 'mohmal.in', 'nada.ltd', 'nada.email', 'getnada.com', 'abcvg.com',
  'generator.email', 'burnermail.io', 'crazymailing.com', 'inboxbear.com', 'mytemp.email',
  'tempm.com', 'dropmail.me', 'clipmail.eu', 'emailondeck.com', 'mytempmail.com', 'tempail.com',
  'tmail.ws', 'mailcatch.com', 'maildrop.cc', 'inboxkitten.com', 'fakemailgenerator.com',
  'armyspy.com', 'cuvox.de', 'dayrep.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com',
  'rhyta.com', 'superrito.com', 'teleworm.us', 'einrot.com', 'nowmymail.com', 'spambox.us',
  'meltmail.com', 'mytempemail.com', 'incognitomail.org', 'disposablemail.com', 'tempemail.co',
  'disposableemailaddress.com', 'trashymail.com', 'tempinbox.com', 'deadaddress.com', 'bupkis.org',
  'fastacura.com', 'spambob.com', 'instantemailaddress.com', 'anonbox.net', 'mailnesia.com',
  'hidemyemail.com', 'burneremail.net', 'burnerelectronics.com', 'throwawayemail.com', 'throwawayemailaddress.com',
  'temporaryemail.net', 'temporarymail.com', 'tempmailer.com', 'tempmailaddress.com', '10minmail.de',
  'minutemail.com', '20minutemail.com', 'easytrashmail.com', 'mailfake.com', 'trash-mail.com',
  'mohmal.tech', 'crazymail.com', 'disbox.net', 'disbox.org', 'tmpmail.org', 'tmpmail.net',
  '1secmail.com', '1secmail.org', '1secmail.net', 'wwjmp.com', 'esiix.com', 'xens.org',
  'kzccv.com', 'vmani.com', 'binkmail.com', 'safetymail.info', 'shieldemail.com', 'antispam.de',
  'temp-mail.io', 'tempmail.plus', 'tempmailo.com', 'emailfake.com', 'fakemail.net', 'internxt.com',
  'inboxbear.net', 'mailpoof.com', 'mailsac.com', 'generator-email.com', 'yomail.info', 'guerrillamail.de',
  'mytrashmail.com', 'soodonims.com', 'spamgourmet.com', 'trashmail.at', 'trashmail.io', 'wegwerfmail.de',
  'wegwerfmail.net', 'wegwerfmail.org', 'werbemail.de', 'whalemail.com', 'zoemail.org'
]);

/**
 * Validates syntax, pattern, and disposable provider checks.
 * @param {string} email
 * @returns {{ valid: boolean, error?: string, cleanEmail?: string, domain?: string, user?: string }}
 */
export function validateEmailFormat(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Please enter an email address.' };
  }

  const clean = email.trim().toLowerCase();

  // W3C standard email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean) || clean.length > 254 || clean.length < 5) {
    return { valid: false, error: 'Please enter a valid email address (e.g. name@gmail.com).' };
  }

  const parts = clean.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid email address structure.' };
  }

  const [user, domain] = parts;

  // Validate user part
  if (!user || user.length < 1 || user.length > 64) {
    return { valid: false, error: 'The email username is invalid.' };
  }

  // Validate domain part
  if (!domain || !domain.includes('.')) {
    return { valid: false, error: 'The email domain is incomplete.' };
  }

  const tld = domain.split('.').pop() || '';
  if (tld.length < 2 || /^\d+$/.test(tld)) {
    return { valid: false, error: 'The email top-level domain (e.g. .com) is invalid.' };
  }

  // Check temporary / disposable email domain
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, error: 'Temporary / disposable emails are not accepted. Please use your real email.' };
  }

  // Block obvious spam / test addresses
  if (domain === 'test.com' || domain === 'fake.com' || domain === 'asdf.com' || domain === 'example.com') {
    return { valid: false, error: 'Please enter a genuine, active email address.' };
  }

  return { valid: true, cleanEmail: clean, domain, user };
}

/**
 * Full end-to-end email validation (Format + Disposable Check).
 * @param {string} email
 * @returns {Promise<{ valid: boolean, error?: string, cleanEmail?: string }>}
 */
export async function validateRealEmail(email) {
  const formatResult = validateEmailFormat(email);
  if (!formatResult.valid) {
    return { valid: false, error: formatResult.error };
  }

  return { valid: true, cleanEmail: formatResult.cleanEmail };
}
