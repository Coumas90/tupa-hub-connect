import { describe, it, expect } from 'vitest';
import { Roles, isRole } from '@/constants/roles';

describe('Roles constant', () => {
  it('should contain expected role values', () => {
    expect(Roles.ADMIN).toBe('admin');
    expect(Roles.OWNER).toBe('owner');
    expect(Roles.MANAGER).toBe('manager');
    expect(Roles.BARISTA).toBe('barista');
    expect(Roles.USER).toBe('user');
  });
});

describe('isRole type guard', () => {
  it('returns true for valid roles', () => {
    Object.values(Roles).forEach(role => {
      expect(isRole(role)).toBe(true);
    });
  });

  it('returns false for invalid roles', () => {
    expect(isRole('invalid')).toBe(false);
    expect(isRole(null)).toBe(false);
  });
});
