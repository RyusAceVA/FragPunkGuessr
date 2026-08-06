/** URL publique d'un asset (plan, screenshot) servi par /api/assets/[...path]. */
export function assetUrl(assetPath: string): string {
  return `/api/assets/${assetPath.split("/").map(encodeURIComponent).join("/")}`;
}
