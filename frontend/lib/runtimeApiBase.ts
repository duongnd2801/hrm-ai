export function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window === 'undefined') {
    return configured || 'http://localhost:8080';
  }

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  if (!configured) {
    return `${protocol}//${hostname}:8080`;
  }

  try {
    const parsed = new URL(configured);
    const configuredHost = parsed.hostname;
    const isConfiguredLocalhost =
      configuredHost === 'localhost' || configuredHost === '127.0.0.1';
    const isCurrentLocalhost =
      hostname === 'localhost' || hostname === '127.0.0.1';

    if (isConfiguredLocalhost && !isCurrentLocalhost) {
      parsed.hostname = hostname;
      return parsed.toString().replace(/\/$/, '');
    }

    return configured;
  } catch {
    return `${protocol}//${hostname}:8080`;
  }
}
