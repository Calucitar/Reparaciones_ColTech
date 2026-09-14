package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.*;
import com.reparaciones.paginaweb.repositories.*;
import com.reparaciones.paginaweb.services.NotificacionService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/cotizaciones")
@CrossOrigin(origins = "*")
@SuppressWarnings("unchecked")
public class CotizacionController {

    private final CotizacionRepository cotizacionRepository;
    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final PersonaRepository personaRepository;
    private final NotificacionService notificacionService;

    public CotizacionController(CotizacionRepository cotizacionRepository,
                                 OrdenTrabajoRepository ordenTrabajoRepository,
                                 PersonaRepository personaRepository,
                                 NotificacionService notificacionService) {
        this.cotizacionRepository = cotizacionRepository;
        this.ordenTrabajoRepository = ordenTrabajoRepository;
        this.personaRepository = personaRepository;
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        try {
            List<CotizacionModel> cotizaciones = cotizacionRepository.findAll();
            List<Map<String, Object>> resultado = cotizaciones.stream()
                .map(this::formatearCotizacionCompleta)
                .collect(Collectors.toList());
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        try {
            Optional<CotizacionModel> opt = cotizacionRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Cotización no encontrada"));
            }
            return ResponseEntity.ok(formatearCotizacionCompleta(opt.get()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Map<String, Object> datos) {
        try {
            CotizacionModel cot = new CotizacionModel();
            cot.setIdOrden(Integer.parseInt(datos.get("idOrden").toString()));
            cot.setIdTecnico(Integer.parseInt(datos.get("idTecnico").toString()));
            cot.setManoObra(new BigDecimal(datos.getOrDefault("manoObra", "0").toString()));
            cot.setNotas((String) datos.getOrDefault("notas", ""));
            cot.setEstado("PENDIENTE");

            BigDecimal totalRepuestos = BigDecimal.ZERO;
            List<Map<String, Object>> repuestosList = (List<Map<String, Object>>) datos.get("repuestos");
            if (repuestosList != null && !repuestosList.isEmpty()) {
                for (Map<String, Object> r : repuestosList) {
                    CotizacionRepuestoModel cr = new CotizacionRepuestoModel();
                    cr.setNombre(r.get("nombre").toString());
                    cr.setCantidad(Integer.parseInt(r.getOrDefault("cantidad", "1").toString()));
                    cr.setPrecioUnitario(new BigDecimal(r.get("precioUnitario").toString()));
                    cr.setCotizacion(cot);
                    cot.getRepuestos().add(cr);
                    BigDecimal subtotal = cr.getPrecioUnitario().multiply(BigDecimal.valueOf(cr.getCantidad()));
                    totalRepuestos = totalRepuestos.add(subtotal);
                }
            }

            List<Map<String, Object>> trabajosList = (List<Map<String, Object>>) datos.get("trabajos");
            if (trabajosList != null && !trabajosList.isEmpty()) {
                for (Map<String, Object> t : trabajosList) {
                    CotizacionTrabajoModel ct = new CotizacionTrabajoModel();
                    ct.setDescripcion(t.get("descripcion").toString());
                    ct.setCosto(new BigDecimal(t.getOrDefault("costo", "0").toString()));
                    ct.setCotizacion(cot);
                    cot.getTrabajos().add(ct);
                }
            }

            cot.setTotalRepuestos(totalRepuestos);
            cot.setTotal(totalRepuestos.add(cot.getManoObra()));
            CotizacionModel saved = cotizacionRepository.save(cot);

            OrdenTrabajo ot = ordenTrabajoRepository.findById(cot.getIdOrden())
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
            ot.setIdCotizacion(saved.getIdCotizacion());
            ot.setEstado("COTIZACION_ENVIADA");
            ordenTrabajoRepository.save(ot);

            // 🔔 NOTIFICACIÓN: Nueva cotización creada
            notificacionService.crearNotificacion(
                "TICKET",
                "Nueva Cotización Creada",
                "El técnico ha creado la cotización #" + saved.getIdCotizacion() + 
                " para la orden OT-" + cot.getIdOrden() + " por un total de S/." + saved.getTotal(),
                saved.getIdCotizacion()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Cotización creada exitosamente");
            response.put("idCotizacion", saved.getIdCotizacion());
            response.put("total", saved.getTotal());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/tecnico/{idTecnico}")
    public ResponseEntity<?> getPorTecnico(@PathVariable Integer idTecnico) {
        List<CotizacionModel> cotizaciones = cotizacionRepository.findByIdTecnico(idTecnico);
        List<Map<String, Object>> resultado = cotizaciones.stream()
            .map(this::formatearCotizacionCompleta)
            .collect(Collectors.toList());
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/orden/{idOrden}")
    public ResponseEntity<?> getPorOrden(@PathVariable Integer idOrden) {
        List<CotizacionModel> cotizaciones = cotizacionRepository.findByIdOrden(idOrden);
        if (cotizaciones.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }
        return ResponseEntity.ok(formatearCotizacionCompleta(cotizaciones.get(0)));
    }

    @PutMapping("/{id}/aprobar")
    public ResponseEntity<?> aprobar(@PathVariable Integer id) {
        try {
            CotizacionModel cot = cotizacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cotización no encontrada"));
            cot.setEstado("APROBADA");
            cot.setFechaRespuesta(java.time.LocalDateTime.now());
            cotizacionRepository.save(cot);

            OrdenTrabajo ot = ordenTrabajoRepository.findById(cot.getIdOrden()).orElse(null);
            if (ot != null) {
                ot.setEstado("COTIZACION_APROBADA");
                ordenTrabajoRepository.save(ot);
            }

            // 🔔 NOTIFICACIÓN: Cotización aprobada
            notificacionService.crearNotificacion(
                "TICKET",
                "Cotización Aprobada",
                "La cotización #" + id + " ha sido aprobada. La orden OT-" + cot.getIdOrden() + 
                " por S/." + cot.getTotal() + " pasará a reparación.",
                id
            );

            return ResponseEntity.ok(Map.of(
                "mensaje", "Cotización aprobada correctamente",
                "cotizacion", formatearCotizacionCompleta(cot)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/rechazar")
    public ResponseEntity<?> rechazar(@PathVariable Integer id) {
        try {
            CotizacionModel cot = cotizacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cotización no encontrada"));
            cot.setEstado("RECHAZADA");
            cot.setFechaRespuesta(java.time.LocalDateTime.now());
            cotizacionRepository.save(cot);

            OrdenTrabajo ot = ordenTrabajoRepository.findById(cot.getIdOrden()).orElse(null);
            if (ot != null) {
                ot.setEstado("DEVUELTO");
                ordenTrabajoRepository.save(ot);
            }

            // 🔔 NOTIFICACIÓN: Cotización rechazada
            notificacionService.crearNotificacion(
                "TICKET",
                "Cotización Rechazada",
                "La cotización #" + id + " ha sido rechazada. La orden OT-" + cot.getIdOrden() + 
                " será devuelta al cliente.",
                id
            );

            return ResponseEntity.ok(Map.of(
                "mensaje", "Cotización rechazada",
                "cotizacion", formatearCotizacionCompleta(cot)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Map<String, Object> formatearCotizacionCompleta(CotizacionModel cot) {
        Map<String, Object> data = new LinkedHashMap<>();
        
        data.put("idCotizacion", cot.getIdCotizacion());
        data.put("idOrden", cot.getIdOrden());
        data.put("idTecnico", cot.getIdTecnico());
        data.put("estado", cot.getEstado() != null ? cot.getEstado() : "PENDIENTE");
        data.put("totalRepuestos", cot.getTotalRepuestos());
        data.put("manoObra", cot.getManoObra());
        data.put("total", cot.getTotal());
        data.put("notas", cot.getNotas() != null ? cot.getNotas() : "");
        data.put("fechaCreacion", cot.getFechaCreacion());
        data.put("fechaRespuesta", cot.getFechaRespuesta());
        
        if (cot.getIdOrden() != null) {
            ordenTrabajoRepository.findById(cot.getIdOrden()).ifPresent(orden -> {
                if (orden.getReporte() != null) {
                    ReporteFallaModel reporte = orden.getReporte();
                    data.put("marca", reporte.getMarca() != null ? reporte.getMarca() : "");
                    data.put("modelo", reporte.getModelo() != null ? reporte.getModelo() : "");
                    data.put("tipoEquipo", reporte.getTipoEquipo() != null ? reporte.getTipoEquipo() : "");
                    data.put("numeroSerie", reporte.getNumeroSerie() != null ? reporte.getNumeroSerie() : "");
                    data.put("equipo", String.format("%s %s", 
                        reporte.getMarca() != null ? reporte.getMarca() : "",
                        reporte.getModelo() != null ? reporte.getModelo() : "").trim());
                    data.put("descripcionFalla", reporte.getDescripcionFalla());
                    
                    if (reporte.getPersona() != null) {
                        data.put("nombreCliente", String.format("%s %s", 
                            reporte.getPersona().getNombre() != null ? reporte.getPersona().getNombre() : "",
                            reporte.getPersona().getApellido() != null ? reporte.getPersona().getApellido() : "").trim());
                    } else if (reporte.getIdPersona() != null) {
                        personaRepository.findById(reporte.getIdPersona()).ifPresent(persona -> {
                            data.put("nombreCliente", String.format("%s %s", 
                                persona.getNombre() != null ? persona.getNombre() : "",
                                persona.getApellido() != null ? persona.getApellido() : "").trim());
                        });
                    }
                }
            });
        }
        
        if (cot.getIdTecnico() != null) {
            personaRepository.findById(cot.getIdTecnico()).ifPresent(tecnico -> {
                data.put("nombreTecnico", String.format("%s %s", 
                    tecnico.getNombre() != null ? tecnico.getNombre() : "",
                    tecnico.getApellido() != null ? tecnico.getApellido() : "").trim());
            });
        }
        
        data.putIfAbsent("nombreCliente", "Sin cliente");
        data.putIfAbsent("nombreTecnico", "Sin técnico");
        data.putIfAbsent("equipo", "Sin equipo");
        
        if (cot.getRepuestos() != null && !cot.getRepuestos().isEmpty()) {
            data.put("repuestos", cot.getRepuestos().stream().map(r -> {
                Map<String, Object> rep = new LinkedHashMap<>();
                rep.put("id", r.getId());
                rep.put("nombre", r.getNombre());
                rep.put("cantidad", r.getCantidad());
                rep.put("precioUnitario", r.getPrecioUnitario());
                rep.put("subtotal", r.getPrecioUnitario().multiply(BigDecimal.valueOf(r.getCantidad())));
                return rep;
            }).collect(Collectors.toList()));
        } else {
            data.put("repuestos", new ArrayList<>());
        }
        
        if (cot.getTrabajos() != null && !cot.getTrabajos().isEmpty()) {
            data.put("trabajos", cot.getTrabajos().stream().map(t -> {
                Map<String, Object> trab = new LinkedHashMap<>();
                trab.put("id", t.getId());
                trab.put("descripcion", t.getDescripcion());
                trab.put("costo", t.getCosto());
                return trab;
            }).collect(Collectors.toList()));
        } else {
            data.put("trabajos", new ArrayList<>());
        }
        
        return data;
    }
}