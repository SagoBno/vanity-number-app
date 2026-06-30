export function maskPhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.length <= 4) {
    return '****';
  }

  return `+${'*'.repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`;
}
