/**
 * maskData
 * Masks sensitive PII for display when `showFull` is false; returns raw value unchanged when true.
 * Prevents mutating or stripping strings that are already masked by the backend.
 */
export function maskData(value, type, showFull) {
  if (showFull || !value) return value;

  const str = String(value);

  // If already masked by the backend (contains 'X' or '*'), return as-is to prevent corrupting masks
  if (str.includes('X') || str.includes('*')) {
    return str;
  }

  switch (type) {
    case 'PAN': {
      if (str.length < 4) return str;
      return str.slice(0, 2) + 'X'.repeat(Math.max(0, str.length - 4)) + str.slice(-2);
    }

    case 'MOBILE': {
      const parts = str.split('-');
      if (parts.length < 2) {
        const digits = str.replace(/\D/g, '');
        if (digits.length <= 4) return str;
        return 'X'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-4);
      }
      return parts
        .map((part, i) => {
          if (i === 0) return part;
          if (i === parts.length - 1) return part.slice(-4);
          return 'X'.repeat(part.length);
        })
        .join('-');
    }

    case 'EMAIL': {
      const [local, domain] = str.split('@');
      if (!domain) return str;
      return `${local.slice(0, 2)}***@${domain}`;
    }

    default:
      return str;
  }
}
