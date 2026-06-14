let nextId = 1;

export function createLocalId(prefix: string): string {
  const id = `${prefix}-${nextId}`;
  nextId += 1;
  return id;
}
