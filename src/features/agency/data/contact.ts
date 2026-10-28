export function phoneHref(value: string | null): string | null {
  if (!value || !/^\+?[\d\s().-]{3,40}$/.test(value) || !/\d/.test(value)) {
    return null;
  }
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

export function emailHref(value: string | null): string | null {
  if (!value || !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value)) {
    return null;
  }
  return `mailto:${value}`;
}

export function mapHref(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
