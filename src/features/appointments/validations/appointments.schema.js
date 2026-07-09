import { z } from "zod";

export const appointmentSchema = z.object({
  dependency_id: z.number({ required_error: "Selecciona una dependencia" }),
  scheduled_date: z.string().min(1, "Selecciona una fecha"),
  scheduled_time: z.string().min(1, "Selecciona una hora"),
  reason: z.string().min(10, "Describe el motivo (mín. 10 caracteres)").max(500, "Máximo 500 caracteres"),
  professional_id: z.string().nullable().optional(),
});
