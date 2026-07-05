export const DEFAULT_USER_TYPE = 'landlord';

export function normalizeUserType(value) {
  if (value === 'broker') return 'broker';
  return DEFAULT_USER_TYPE;
}

export function getUserTypeLabel(value) {
  return normalizeUserType(value) === 'broker' ? 'Môi giới' : 'Chủ trọ';
}
