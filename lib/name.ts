export function normalizeNameKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function toDisplayName(name: string): string {
  const trimmed = name.trim().replace(/[_\s]+/g, ' ');
  return trimmed
    .toLocaleLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toLocaleUpperCase() + w.slice(1) : w))
    .join(' ');
}


