import { supabase } from "../../../lib/supabase";

function joinApprentices(appointments, profilesMap) {
  return appointments.map((a) => ({
    ...a,
    aprendiz: a.user_id ? profilesMap[a.user_id] : null,
    professional: a.professional_id ? profilesMap[a.professional_id] : null,
  }));
}

export class AppointmentRepository {
  static async create(appointmentData) {
    const { data, error } = await supabase
      .from("appointments")
      .insert([appointmentData])
      .select("*, dependencies(name, color)")
      .single();

    if (error) throw new Error(`Error creando cita: ${error.message}`);
    return data;
  }

  static async fetch(filters = {}) {
    let query = supabase.from("appointments").select("*, dependencies(name, color)");

    if (filters.userId) query = query.eq("user_id", filters.userId);
    if (filters.professionalId) query = query.eq("professional_id", filters.professionalId);
    if (filters.dependencyId) query = query.eq("dependency_id", filters.dependencyId);
    if (filters.status) query = query.eq("status", filters.status);

    query = query.order("scheduled_date", { ascending: true });

    const { data: appointments, error } = await query;
    if (error) throw error;
    if (!appointments?.length) return [];

    const userIds = [
      ...new Set(appointments.flatMap((a) => [a.user_id, a.professional_id].filter(Boolean))),
    ];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, document_number, ficha")
      .in("id", userIds);

    const profilesMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

    return joinApprentices(appointments, profilesMap);
  }

  static async update(appointmentId, updates) {
    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", appointmentId)
      .select("*, dependencies(name, color)")
      .single();

    if (error) throw new Error(`Error actualizando cita: ${error.message}`);

    if (data?.user_id || data?.professional_id) {
      const userIds = [data.user_id, data.professional_id].filter(Boolean);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, document_number, ficha")
        .in("id", userIds);
      const profilesMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      return joinApprentices([data], profilesMap)[0];
    }

    return data;
  }

  static async countPending(userId) {
    const { count, error } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending");

    if (error) throw error;
    return count;
  }

  static async checkAvailability(dependencyId, date, time) {
    const { data, error } = await supabase
      .from("appointments")
      .select("id")
      .eq("dependency_id", dependencyId)
      .eq("scheduled_date", date)
      .eq("scheduled_time", time)
      .not("status", "eq", "cancelled");

    if (error) throw error;
    return data.length === 0;
  }
}
