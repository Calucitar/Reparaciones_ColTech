package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.OrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;


public interface OrdenTrabajoRepository extends JpaRepository<OrdenTrabajo, Integer> {
    
    List<OrdenTrabajo> findByEstado(String estado);
    
    List<OrdenTrabajo> findByTecnicoIdPersona(Integer idTecnico);
    
    // Contar por estado
    long countByEstado(String estado);
    
    // Buscar por ID de reporte
    @Query("SELECT o FROM OrdenTrabajo o WHERE o.reporte.idReporte = :idReporte")
    List<OrdenTrabajo> findByReporteId(Integer idReporte);
}