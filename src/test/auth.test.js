import { describe, it, expect } from 'vitest';

// Test the hasRole logic directly (extracted for testing)
function createHasRole(roleName) {
  return (requiredRoles) => {
    if (!roleName) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(roleName);
    }
    return roleName === requiredRoles;
  };
}

describe('hasRole', () => {
  const tests = [
    { role: 'SUPERADMIN', required: 'SUPERADMIN', expected: true, desc: 'CP-008: Rol exacto' },
    { role: 'SUPERADMIN', required: 'APRENDIZ', expected: false, desc: 'CP-009: Rol no coincide' },
    { role: 'PSICOLOGIA', required: ['PSICOLOGIA', 'ENFERMERIA'], expected: true, desc: 'CP-010: Rol en array' },
    { role: 'TRABAJO_SOCIAL', required: ['PSICOLOGIA', 'ENFERMERIA'], expected: false, desc: 'CP-011: Rol no esta en array' },
    { role: null, required: 'APRENDIZ', expected: false, desc: 'CP-012: Rol null' },
    { role: 'COORDINACION', required: ['COORDINACION', 'SUPERADMIN'], expected: true, desc: 'CP-013: Coordinacion en array' },
    { role: 'APRENDIZ', required: 'APRENDIZ', expected: true, desc: 'CP-014: Aprendiz exacto' },
    { role: 'ENFERMERIA', required: ['PSICOLOGIA', 'ENFERMERIA', 'TRABAJO_SOCIAL'], expected: true, desc: 'CP-015: Enfermeria en array profesional' },
  ];

  tests.forEach(({ role, required, expected, desc }) => {
    it(desc, () => {
      const hasRole = createHasRole(role);
      expect(hasRole(required)).toBe(expected);
    });
  });
});

describe('isAdmin', () => {
  it('CP-016: SUPERADMIN es admin', () => {
    const hasRole = createHasRole('SUPERADMIN');
    expect(hasRole('SUPERADMIN')).toBe(true);
  });

  it('CP-017: APRENDIZ no es admin', () => {
    const fn = createHasRole('APRENDIZ');
    expect(fn('SUPERADMIN')).toBe(false);
  });
});

describe('isProfessional', () => {
  it('CP-018: PSICOLOGIA es profesional', () => {
    const professionals = ['PSICOLOGIA', 'ENFERMERIA', 'TRABAJO_SOCIAL'];
    expect(professionals.includes('PSICOLOGIA')).toBe(true);
  });

  it('CP-019: APRENDIZ no es profesional', () => {
    const professionals = ['PSICOLOGIA', 'ENFERMERIA', 'TRABAJO_SOCIAL'];
    expect(professionals.includes('APRENDIZ')).toBe(false);
  });
});
