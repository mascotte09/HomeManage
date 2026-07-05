import { DEFAULT_USER_TYPE, normalizeUserType, getUserTypeLabel } from './userType';

describe('userType helpers', () => {
  it('defaults unknown values to landlord', () => {
    expect(normalizeUserType('')).toBe(DEFAULT_USER_TYPE);
    expect(normalizeUserType(undefined)).toBe(DEFAULT_USER_TYPE);
    expect(normalizeUserType('unknown')).toBe(DEFAULT_USER_TYPE);
  });

  it('preserves broker values and returns the correct label', () => {
    expect(normalizeUserType('broker')).toBe('broker');
    expect(getUserTypeLabel('broker')).toBe('Môi giới');
    expect(getUserTypeLabel('landlord')).toBe('Chủ trọ');
  });
});
