import { useState, useCallback } from "react";
import { DashboardRepository } from "../dashboard.repository";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format } from "date-fns";

export function useDashboard(){
    const [kpis, setKpis] = useState(null);
    const [byDependency, setByDependency] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAllMetrics = useCallback(async (customRange = null) => {
        setLoading(true);
        const dateRange = {
            from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
            to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
        };
        const range = customRange || dateRange;

        try {
            const [kpisData, depData, trendData, profData] = await Promise.all([
                DashboardRepository.getKPIs(range),
                DashboardRepository.getAppointmentsByDependency(range),
                DashboardRepository.getMonthlyTrend(new Date().getFullYear()),
                DashboardRepository.getProfessionalPerformance(range),
            ]);
            setKpis(kpisData);
            setByDependency(depData);
            setMonthlyTrend(trendData);
            setProfessionals(profData);
        }catch (err){
            toast.error("Error cargando métricas");
            console.error(err);
        }finally {
            setLoading(false);
        }
    }, []);

    const exportToCSV = async (range = null) => {
        try {
            const defaultRange = {
                from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
            };
            const data = await DashboardRepository.getRawDataForExport(
                range || defaultRange,
            );

            if (!data || data.length === 0) {
                toast.error("No hay datos para exportar");
                return;
            }

            const flatData = data.map((row) =>({
                ID: row.id,
                Fecha_Cita: row.scheduled_date,
                Hora: row.scheduled_time,
                Dependencia: row.dependencies?.name,
                Aprendiz: row.aprendiz?.full_name,
                Documento: row.aprendiz?.document_number,
                Profesional: row.professional?.full_name || "sin asignar",
                Estado: row.status,
                Motivo: row.reason,
                Notas: row.notes,
                Fecha_Creacion: row.created_at,
            }));

            const headers = Object.keys(flatData[0]);
            const csv = [
                headers.join(","),
                ...flatData.map((row) => 
                    headers.map((h) => `"${row[h] || ""}"`).join(",")
                )
            ].join("\n");

            const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `reporte_bienestar_${format(new Date(), "yyyy-MM-dd")}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            toast.success("Reporte descargado");
        }catch {
            toast.error("Error exportando datos");
        }
    };
    return {
        kpis,
        byDependency,
        monthlyTrend,
        professionals,
        loading,
        fetchAllMetrics,
        exportToCSV,
    };
}