package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.*;
import com.reparaciones.paginaweb.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ReporteFallaService {

    private final ReporteFallaRepository reporteFallaRepository;

    public ReporteFallaService(ReporteFallaRepository reporteFallaRepository) {
        this.reporteFallaRepository = reporteFallaRepository;
    }

    public ReporteFallaModel guardarReporte(ReporteFallaModel reporte) {
        if (reporte.getFechaReporte() == null) {
            reporte.setFechaReporte(LocalDateTime.now());
        }
        if (reporte.getEstado() == null) {
            reporte.setEstado("PENDIENTE");
        }
        return reporteFallaRepository.save(reporte);
    }

    public List<ReporteFallaModel> obtenerTodos() {
        return reporteFallaRepository.findAllByOrderByIdReporteDesc();
    }

    public ReporteFallaModel obtenerPorId(Integer id) {
        return reporteFallaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Reporte no encontrado: " + id));
    }

    public void eliminar(Integer id) {
        reporteFallaRepository.deleteById(id);
    }
}