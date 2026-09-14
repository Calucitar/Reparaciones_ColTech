package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.*;
import com.reparaciones.paginaweb.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class OrdenTrabajoService {

    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final ReporteFallaRepository reporteFallaRepository;
    private final EquipoRepository equipoRepository;

    public OrdenTrabajoService(OrdenTrabajoRepository ordenTrabajoRepository,
                                ReporteFallaRepository reporteFallaRepository,
                                EquipoRepository equipoRepository) {
        this.ordenTrabajoRepository = ordenTrabajoRepository;
        this.reporteFallaRepository = reporteFallaRepository;
        this.equipoRepository = equipoRepository;
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajo> findAll() {
        return ordenTrabajoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public OrdenTrabajo findById(Integer id) {
        return ordenTrabajoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada: " + id));
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajo> findByEstado(String estado) {
        return ordenTrabajoRepository.findByEstado(estado);
    }

    @Transactional(readOnly = true)
    public List<OrdenTrabajo> findByTecnico(Integer idTecnico) {
        return ordenTrabajoRepository.findByTecnicoIdPersona(idTecnico);
    }

    @Transactional
    public OrdenTrabajo save(OrdenTrabajo orden) {
        // Si no tiene fecha de inicio, asignar la fecha actual
        if (orden.getFechaInicio() == null) {
            orden.setFechaInicio(LocalDate.now());
        }
        // Si no tiene estado, asignar PENDIENTE
        if (orden.getEstado() == null || orden.getEstado().isEmpty()) {
            orden.setEstado("PENDIENTE");
        }
        return ordenTrabajoRepository.save(orden);
    }

    @Transactional
    public OrdenTrabajo update(Integer id, OrdenTrabajo ordenActualizada) {
        OrdenTrabajo ordenExistente = findById(id);
        
        if (ordenActualizada.getEstado() != null) {
            ordenExistente.setEstado(ordenActualizada.getEstado());
        }
        if (ordenActualizada.getTecnico() != null) {
            ordenExistente.setTecnico(ordenActualizada.getTecnico());
        }
        if (ordenActualizada.getFechaInicio() != null) {
            ordenExistente.setFechaInicio(ordenActualizada.getFechaInicio());
        }
        if (ordenActualizada.getFechaFin() != null) {
            ordenExistente.setFechaFin(ordenActualizada.getFechaFin());
        }
        if (ordenActualizada.getEquipo() != null) {
            ordenExistente.setEquipo(ordenActualizada.getEquipo());
        }
        
        return ordenTrabajoRepository.save(ordenExistente);
    }

    @Transactional
    public void delete(Integer id) {
        OrdenTrabajo orden = findById(id);
        ordenTrabajoRepository.delete(orden);
    }

    @Transactional(readOnly = true)
    public long count() {
        return ordenTrabajoRepository.count();
    }

    @Transactional(readOnly = true)
    public long countByEstado(String estado) {
        return ordenTrabajoRepository.countByEstado(estado);
    }

    @Transactional
    public OrdenTrabajo crearDesdeReporte(Integer idReporte) {
        ReporteFallaModel reporte = reporteFallaRepository.findById(idReporte)
                .orElseThrow(() -> new RuntimeException("Reporte no encontrado con ID: " + idReporte));

        // Crear equipo basado en los datos del reporte
        EquipoModel equipo = new EquipoModel();
        equipo.setMarca(reporte.getMarca());
        equipo.setModelo(reporte.getModelo());
        equipo.setTipo(reporte.getTipoEquipo());
        equipo.setSerie(reporte.getNumeroSerie());
        equipo = equipoRepository.save(equipo);

        // Crear orden de trabajo
        OrdenTrabajo orden = new OrdenTrabajo();
        orden.setReporte(reporte);
        orden.setEquipo(equipo);
        orden.setEstado("PENDIENTE");
        orden.setFechaInicio(LocalDate.now());

        return ordenTrabajoRepository.save(orden);
    }
}