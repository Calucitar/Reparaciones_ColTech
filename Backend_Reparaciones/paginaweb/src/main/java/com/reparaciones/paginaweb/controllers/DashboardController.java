package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.repositories.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ClienteRepository clienteRepository;
    private final TecnicoRepository tecnicoRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final PagoRepository pagoRepository;

    public DashboardController(ClienteRepository clienteRepository,
                               TecnicoRepository tecnicoRepository,
                               OrdenTrabajoRepository ordenTrabajoRepository,
                               PagoRepository pagoRepository) {
        this.clienteRepository = clienteRepository;
        this.tecnicoRepository = tecnicoRepository;
        this.ordenTrabajoRepository = ordenTrabajoRepository;
        this.pagoRepository = pagoRepository;
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<?> getEstadisticas() {
        long clientes = clienteRepository.count();
        long tecnicos = tecnicoRepository.count();
        long reparaciones = ordenTrabajoRepository.count();
        long pendientes = ordenTrabajoRepository.findByEstado("PENDIENTE").size();
        
        // Calcular ingresos de pagos aprobados
        double ingresos = pagoRepository.findAll().stream()
                .filter(p -> "APROBADO".equals(p.getEstado()))
                .mapToDouble(p -> p.getMonto() != null ? p.getMonto().doubleValue() : 0)
                .sum();

        return ResponseEntity.ok(Map.of(
            "clientes", clientes,
            "tecnicos", tecnicos,
            "reparaciones", reparaciones,
            "pendientes", pendientes,
            "ingresos", ingresos
        ));
    }
}