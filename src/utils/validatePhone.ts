const EG_MOBILE_RE = /^(?:\+20)?0?1[0125]\d{8}$/;

export function isValidEGMobile(phone: string): boolean {
  return EG_MOBILE_RE.test(phone.replace(/[\s\-()]/g, ''));
}

export const egMobileMessage = 'Enter a valid Egyptian mobile (e.g. 01012345678)';
