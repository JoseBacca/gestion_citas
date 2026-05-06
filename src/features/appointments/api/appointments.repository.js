import { supabase } from "../../../lib/supabase";
import { addDays, isWednesday,format } from "date-fns";

//clase Repository: encapsula todo el acceso a datos de citas 
//Principio SOLID: dependency inversion (dependemos de abstracciones)
export class AppointmentRepository{
    //CREATE:crear nueva cita 
    static async create(appointmenData){
        const { data, error } = await supabase
            .from("appointments")
            .insert([appointmentData])
            .select(
                    `
                    *,
                    dependencies (name, color),
                    profiles!professional_id (full_name)
                `)
        
                .single(); 
                
        if (error) throw new Error(`Error creando cita: ${error.message}`);
        return data;
    }  


}