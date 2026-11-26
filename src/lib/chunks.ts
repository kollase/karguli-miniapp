export interface ChunkTile {
  id: number;
  text: string;
}

export function chunkBank(chunks: string[], seed: string): ChunkTile[] {
  let hash = Array.from(seed).reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const bank = chunks.map((text, id) => ({ id, text }));
  for (let i = bank.length - 1; i > 0; i--) {
    hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [bank[i], bank[j]] = [bank[j], bank[i]];
  }
  // Never hand the learner the complete model already in order.
  if (bank.length > 1 && bank.every((t, i) => t.text === chunks[i]))
    bank.push(bank.shift()!);
  return bank;
}

export function matchesChunks(chunks: string[], chosen: number[]): boolean {
  return chosen.length === chunks.length &&
    new Set(chosen).size === chosen.length &&
    chosen.every((id) => Number.isInteger(id) && id >= 0 && id < chunks.length) &&
    chosen.map((id) => chunks[id]).join(" ") === chunks.join(" ");
}
