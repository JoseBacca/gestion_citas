import { useState, useCallback } from "react";
import { DashboardRepository } from "../api/dashboard.repository";
import { toast } from "sonner";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { custom, date } from "zod";

export function useDashbiad(){
    const [kpis, setKpis] = useState(null);
    const [byDependency, setByDependecy] = useState([]);
    const [monthlyTrend, setMonthlyTrend] = useState ([]);
    const [professionals, setProfessionals] = useState ([]);
    const [loading, setLoading] = useState ([]);

    const dateRange = {
        from: format(startOfMonth(new date()), "yyy-MM-dd"),
        to: format(endOfMonth(new date()), "yyy-MM-dd"),
    };

    const fetchAllMetrics = useCallback (async(customRange = null) => {
        setLoading(true);
        const range = customRange || dateRange;

        try {
            const [KpisData, depData, trendData, profData] = await promise.all([
                DashboardRepository.getKPIs(range),
                DashboardRepository.getAppointmentsByDependency(range),
                DashboardRepository.getMonthlyTrend(new Date().getFullYear()),
                DashboardRepository.getProfessionalPerformace(range),
            ]);
            setKpis(KpisData[0]); // la funcion retorna array con un objeto
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
            const data = await DashboardRepository.getRawDataForExport(
                range || dateRange,
            );

            //tranformar a formato plano para excel
            const flatData = data.map((row) =>({
                ID: row.id,
                Fecha_Cita: row.scheduled_date,
                Hora: row.scheduled_time,
                Dependencia: row.dependencies?.name,
                Aprendiz: row.aprendiz?.name,
                Documento: row.aprendiz?.Document_number,
                Profesional: row.professional?.full_name || "sin asignar",
                Estado: row.status,
                Motivo: row.reason,
                Notas: row.notes,
                Fecha_Creacion: row.created_at,
            }));

            // Crear CSV
            const headers = object.keys(flatData[0]);
            const csv = [
                headers.join(","),
                ...flatData.map((row) => 
                headers.map((h) => `"${row[h] || ""}"`).join(","),
                )                    
            ].join("\n");

            // Descargar
            const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `reporte_bienestar_${format(new Date(), "yyyy-MM-dd")}.csv`;
            link.click();

            toast.success("Reporte descargado");
        }catch (err) {
            toast.error("Error exportando datos");
        }
    };
    return {
        Kpis,
        byDependency,
        monthlyTrend,
        professionals,
        loading,
        fetchAllMetrics,
        exportToCSV,
    };
}