export const Roles = {
  ADMIN: 'admin',
  OWNER: 'owner',
  MANAGER: 'manager',
  BARISTA: 'barista',
  USER: 'user'
} as const;

export type Role = typeof Roles[keyof typeof Roles];

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (Object.values(Roles) as string[]).includes(value);
}
