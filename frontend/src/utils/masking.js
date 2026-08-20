/**
 * maskData
 * Reconstructed from call sites in the uploaded App.jsx (this file was
 * referenced but not included in the upload). Masks PII for display when
 * `showFull` is false; returns the raw value unchanged when true.
 *
 * Formats assumed from the product screenshots:
 *   PAN:    ABCPS1234F  ->  ABXXXXXX4F   (first 2 + last 2 visible)
 *   MOBILE: +91-98765-43210  ->  +91-XXXXX-3210  (country code + last 4 visible)
 *   EMAIL:  aditya.sharma@example.com  ->  ad***@example.com
 */
export function maskData(value, type, showFull) {
  if (showFull || !value) return value;

  switch (type) {
    case 'PAN': {
      if (value.length < 4) return value;
      return value.slice(0, 2) + 'X'.repeat(value.length - 4) + value.slice(-2);
    }

    case 'MOBILE': {
      const parts = value.split('-');
      if (parts.length < 2) {
        const digits = value.replace(/\D/g, '');
        return 'X'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-4);
      }
      return parts
        .map((part, i) => {
          if (i === 0) return part; // country code stays visible
          if (i === parts.length - 1) return part.slice(-4); // last block: show last 4 only
          return 'X'.repeat(part.length);
        })
        .join('-');
    }

    case 'EMAIL': {
      const [local, domain] = value.split('@');
      if (!domain) return value;
      return `${local.slice(0, 2)}***@${domain}`;
    }

    default:
      return value;
  }
}
