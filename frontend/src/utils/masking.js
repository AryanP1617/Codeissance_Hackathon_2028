export function maskData(value, type, isPrivileged = false) {
  if (!value) return 'Not Provided';
  if (isPrivileged) return value;

  switch (type) {
    case 'PAN':
      return value.length >= 10 ? `${value.slice(0, 2)}XXXXXX${value.slice(-2)}` : 'XXXXXXXXXX';
    case 'MOBILE':
      return value.length >= 10 ? `+91-XXXXX-${value.slice(-4)}` : '+91-XXXXX-XXXX';
    case 'EMAIL': {
      const parts = value.split('@');
      return `${parts[0].slice(0, 2)}***@${parts[1] || 'mail.com'}`;
    }
    default:
      return value;
  }
}