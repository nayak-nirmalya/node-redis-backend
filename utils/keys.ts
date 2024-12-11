export function getKeyName(...args: string[]) {
  return `node:${args.join(":")}`;
}
