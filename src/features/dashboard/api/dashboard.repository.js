import { supabase } from "../../../lib/supabase";

export class DashboardRepository{
    static async getKPIs(dateRange) {
        const { data, error } = await supabase.rpc("get_dashboard_kpis", {
            start_date: dateRange.from,
            end_date: dateRange.to,
        });
        if (!error && data) return data;

        const { data: appts } = await supabase
            .from("appointments")
            .select("status")
            .gte("scheduled_date", dateRange.from)
            .lte("scheduled_date", dateRange.to);

        const { count: totalUsers } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true });

        const list = appts || [];
        return {
            total_appointments: list.length,
            pending_appointments: list.filter((a) => a.status === "pending").length,
            completed_appointments: list.filter((a) => a.status === "completed").length,
            total_users: totalUsers || 0,
        };
    }

    static async getAppointmentsByDependency(dateRange){
        const { data, error } = await supabase
        .from("appointments")
        .select("dependency_id, dependencies(name, color), status")
        .gte("scheduled_date", dateRange.from)
        .lte("scheduled_date", dateRange.to);

        if (error) throw error;

        const grouped = (data || []).reduce((acc, curr) => {
            const depName = curr.dependencies?.name || "Sin dependencia";
            const color = curr.dependencies?.color || "#6b7280";

            if (!acc[depName]){
                acc[depName] = {
                    name: depName,
                    color,
                    total: 0,
                    completed: 0,
                    cancelled: 0,
                };
            }

            acc[depName].total++;
            if (curr.status === "completed") acc[depName].completed++;
            if (curr.status === "cancelled") acc[depName].cancelled++;

            return acc;
        }, {});

        return Object.values(grouped);
    }

    static async getMonthlyTrend(year){
        const { data, error } = await supabase.rpc("get_monthly_appointments", {
            year_param: year,
        });
        if (!error && data) return data;

        const { data: appts } = await supabase
            .from("appointments")
            .select("scheduled_date")
            .gte("scheduled_date", `${year}-01-01`)
            .lte("scheduled_date", `${year}-12-31`);

        const months = {};
        for (let m = 1; m <= 12; m++) {
            months[String(m).padStart(2, "0")] = 0;
        }
        (appts || []).forEach((a) => {
            const m = new Date(a.scheduled_date).getMonth() + 1;
            months[String(m).padStart(2, "0")]++;
        });
        return Object.entries(months).map(([k, v]) => ({
            month: `${year}-${k}`,
            total: v,
        }));
    }

    static async getProfessionalPerformance(dateRange) {
        const { data, error } = await supabase
        .from("appointments")
        .select("professional_id, status, scheduled_date")
        .not("professional_id", "is", null)
        .gte("scheduled_date", dateRange.from)
        .lte("scheduled_date", dateRange.to);

        if (error) return [];

        const profIds = [...new Set((data || []).map((d) => d.professional_id).filter(Boolean))];
        let profilesMap = {};
        if (profIds.length > 0) {
            const { data: profs } = await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", profIds);
            profilesMap = Object.fromEntries((profs || []).map((p) => [p.id, p.full_name]));
        }

        const grouped = (data || []).reduce((acc, curr) => {
            const profId = curr.professional_id;
            const name = profilesMap[profId] || "sin asignar";

            if (!acc[profId]) {
                acc[profId] = { id: profId, name, total: 0, completed: 0 };
            }

            acc[profId].total++;
            if (curr.status === "completed") acc[profId].completed++;

            return acc;
        }, {});

        return Object.values(grouped)
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 10);
    }

    static async getRawDataForExport(dateRange) {
        const { data, error } = await supabase
        .from("appointments")
        .select("*, dependencies(name)")
        .gte("scheduled_date", dateRange.from)
        .lte("scheduled_date", dateRange.to)
        .order("created_at", { ascending: false});

        if (error) throw error;

        const userIds = [...new Set((data || []).flatMap((a) => [a.user_id, a.professional_id].filter(Boolean)))];
        let profilesMap = {};
        if (userIds.length > 0) {
            const { data: profs } = await supabase
                .from("profiles")
                .select("id, full_name, document_number")
                .in("id", userIds);
            profilesMap = Object.fromEntries((profs || []).map((p) => [p.id, p]));
        }

        return (data || []).map((a) => ({
            ...a,
            dependencies: a.dependencies,
            aprendiz: profilesMap[a.user_id] || null,
            professional: profilesMap[a.professional_id] || null,
        }));
    }
}
    