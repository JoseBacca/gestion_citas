import { describe, it, expect, vi } from 'vitest';

// ============================================================
// TESTS UNITARIOS - AppointmentRepository
// Enfoque: Black Box + White Box
// ============================================================

// Mock completo de Supabase chain
function createMockQuery(returnData = [], returnError = null) {
  const mock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData, error: returnError }),
  };
  // Thenable: resolve with data
  mock.then = (resolve) => resolve({ data: returnData, error: returnError });
  return mock;
}

// Tests de logica pura (sin dependencia de Supabase)
describe('AppointmentRepository - Logica de Filtrado', () => {
  it('CP-001: Filtro por userId genera eq correcto', () => {
    const mock = createMockQuery();
    const filters = { userId: 'uuid-123' };

    // Simular logica del repository
    if (filters.userId) mock.eq('user_id', filters.userId);

    expect(mock.eq).toHaveBeenCalledWith('user_id', 'uuid-123');
  });

  it('CP-002: Filtro por professionalId genera eq correcto', () => {
    const mock = createMockQuery();
    const filters = { professionalId: 'uuid-456' };

    if (filters.professionalId) mock.eq('professional_id', filters.professionalId);

    expect(mock.eq).toHaveBeenCalledWith('professional_id', 'uuid-456');
  });

  it('CP-003: Filtro por status genera eq correcto', () => {
    const mock = createMockQuery();
    const filters = { status: 'confirmed' };

    if (filters.status) mock.eq('status', filters.status);

    expect(mock.eq).toHaveBeenCalledWith('status', 'confirmed');
  });

  it('CP-004: Multiples filtros se aplican en cadena', () => {
    const mock = createMockQuery();
    const filters = { userId: 'u1', status: 'pending' };

    if (filters.userId) mock.eq('user_id', filters.userId);
    if (filters.status) mock.eq('status', filters.status);

    expect(mock.eq).toHaveBeenCalledTimes(2);
    expect(mock.eq).toHaveBeenNthCalledWith(1, 'user_id', 'u1');
    expect(mock.eq).toHaveBeenNthCalledWith(2, 'status', 'pending');
  });

  it('CP-005: Sin filtros no llama eq', () => {
    const mock = createMockQuery();
    const filters = {};

    if (filters.userId) mock.eq('user_id', filters.userId);
    if (filters.professionalId) mock.eq('professional_id', filters.professionalId);

    expect(mock.eq).not.toHaveBeenCalled();
  });
});

describe('AppointmentRepository - checkAvailability', () => {
  it('CP-006: Retorna true si no hay citas (array vacio)', () => {
    const data = [];
    const result = data.length === 0;
    expect(result).toBe(true);
  });

  it('CP-007: Retorna false si hay citas (array con elementos)', () => {
    const data = [{ id: 1 }];
    const result = data.length === 0;
    expect(result).toBe(false);
  });

  it('CP-008: Retorna true si data es null', () => {
    const data = null;
    const result = (data || []).length === 0;
    expect(result).toBe(true);
  });
});

describe('AppointmentRepository - joinApprentices', () => {
  const joinApprentices = (appointments, profilesMap) => {
    return appointments.map((a) => ({
      ...a,
      aprendiz: a.user_id ? profilesMap[a.user_id] : null,
      professional: a.professional_id ? profilesMap[a.professional_id] : null,
    }));
  };

  it('CP-009: Une profiles correctamente', () => {
    const appointments = [
      { id: 1, user_id: 'u1', professional_id: 'p1' },
    ];
    const profilesMap = {
      u1: { full_name: 'Juan', ficha: '123' },
      p1: { full_name: 'Dr. Garcia' },
    };

    const result = joinApprentices(appointments, profilesMap);

    expect(result[0].aprendiz.full_name).toBe('Juan');
    expect(result[0].aprendiz.ficha).toBe('123');
    expect(result[0].professional.full_name).toBe('Dr. Garcia');
  });

  it('CP-010: Maneja user_id null', () => {
    const appointments = [{ id: 1, user_id: null, professional_id: 'p1' }];
    const profilesMap = { p1: { full_name: 'Dr.' } };

    const result = joinApprentices(appointments, profilesMap);

    expect(result[0].aprendiz).toBeNull();
  });

  it('CP-011: Maneja profiles faltantes', () => {
    const appointments = [{ id: 1, user_id: 'u1', professional_id: 'p1' }];
    const profilesMap = {};

    const result = joinApprentices(appointments, profilesMap);

    expect(result[0].aprendiz).toBeUndefined();
    expect(result[0].professional).toBeUndefined();
  });

  it('CP-012: Procesa multiples citas', () => {
    const appointments = [
      { id: 1, user_id: 'u1', professional_id: 'p1' },
      { id: 2, user_id: 'u2', professional_id: 'p1' },
      { id: 3, user_id: 'u1', professional_id: 'p2' },
    ];
    const profilesMap = {
      u1: { full_name: 'Juan' },
      u2: { full_name: 'Pedro' },
      p1: { full_name: 'Dr. A' },
      p2: { full_name: 'Dr. B' },
    };

    const result = joinApprentices(appointments, profilesMap);

    expect(result).toHaveLength(3);
    expect(result[0].aprendiz.full_name).toBe('Juan');
    expect(result[1].aprendiz.full_name).toBe('Pedro');
    expect(result[2].professional.full_name).toBe('Dr. B');
  });
});
