type Rgb = [number, number, number];

const BLACK = '#000000';
const WHITE = '#FFFFFF';
/** Below this luminance gap two colours are too close to read against each other. */
const MIN_CONTRAST_GAP = 0.35;

function parse(hex: string): Rgb {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function format([r, g, b]: Rgb): string {
  const value = (r << 16) | (g << 8) | b;
  return `#${value.toString(16).padStart(6, '0').toUpperCase()}`;
}

/** Perceived brightness, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const [r, g, b] = parse(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function isDark(hex: string): boolean {
  return luminance(hex) < 0.5;
}

/** Blends `amount` (0..1) of `other` into `base`. */
export function mix(base: string, other: string, amount: number): string {
  const from = parse(base);
  const to = parse(other);
  return format(
    from.map((channel, i) =>
      Math.round(channel + (to[i] - channel) * amount),
    ) as Rgb,
  );
}

/** Adds an alpha channel to a `#RRGGBB` colour. */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parse(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Black or white, whichever reads better on the given background. */
export function contrastOn(background: string): string {
  return isDark(background) ? WHITE : BLACK;
}

/** Returns `foreground` if it is legible on `background`, otherwise a safe fallback. */
export function ensureReadable(foreground: string, background: string): string {
  const gap = Math.abs(luminance(foreground) - luminance(background));
  return gap >= MIN_CONTRAST_GAP ? foreground : contrastOn(background);
}
