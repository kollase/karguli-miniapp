// Vite supplies BASE_URL in browser builds; direct Node tests use the root.
export function publicAsset(path: string, base = import.meta.env?.BASE_URL ?? "/"): string {
  return `${base.replace(/\/?$/, "/")}${path.replace(/^\/+/, "")}`;
}
