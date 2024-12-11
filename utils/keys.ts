export function getKeyName(...args: string[]) {
  return `node:${args.join(":")}`;
}

export const restaurantKeyById = (id: string) => getKeyName("restaurants", id);
