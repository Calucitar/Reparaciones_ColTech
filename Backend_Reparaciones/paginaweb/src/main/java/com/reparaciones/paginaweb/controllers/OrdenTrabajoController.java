package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.*;
import com.reparaciones.paginaweb.services.*;
import com.reparaciones.paginaweb.repositories.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@RestController
@RequestMapping("/api/ordenes-trabajo")
@CrossOrigin(origins = "*")
public class OrdenTrabajoController {

    private final OrdenTrabajoService ordenTrabajoService;
    private final CotizacionRepository cotizacionRepository;
    private final NotificacionService notificacionService;

    public OrdenTrabajoController(OrdenTrabajoService ordenTrabajoService,
                                   CotizacionRepository cotizacionRepository,
                                   NotificacionService notificacionService) {
        this.ordenTrabajoService = ordenTrabajoService;
        this.cotizacionRepository = cotizacionRepository;
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> findAll() {
        List<OrdenTrabajo> ordenes = ordenTrabajoService.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();
        
        for (OrdenTrabajo ot : ordenes) {
            resultado.add(convertirOrdenAMapa(ot));
        }
        
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Integer id) {
        try {
            OrdenTrabajo ot = ordenTrabajoService.findById(id);
            return ResponseEntity.ok(convertirOrdenAMapa(ot));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<Map<String, Object>>> findByEstado(@PathVariable String estado) {
        List<OrdenTrabajo> ordenes = ordenTrabajoService.findByEstado(estado);
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (OrdenTrabajo ot : ordenes) {
            resultado.add(convertirOrdenAMapa(ot));
        }
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/tecnico/{idTecnico}")
    public ResponseEntity<List<Map<String, Object>>> findByTecnico(@PathVariable Integer idTecnico) {
        List<OrdenTrabajo> ordenes = ordenTrabajoService.findByTecnico(idTecnico);
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (OrdenTrabajo ot : ordenes) {
            resultado.add(convertirOrdenAMapa(ot));
        }
        return ResponseEntity.ok(resultado);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> datos) {
        try {
            System.out.println("📥 [POST] Datos recibidos: " + datos);
            
            OrdenTrabajo orden = new OrdenTrabajo();
            
            Object idTicket = getValue(datos, "idTicket", "id_ticket", "idReporte", "id_reporte");
            if (idTicket != null && !idTicket.toString().isEmpty()) {
                ReporteFallaModel r = new ReporteFallaModel();
                r.setIdReporte(Integer.parseInt(idTicket.toString()));
                orden.setReporte(r);
            }
            
            Object idEquipo = getValue(datos, "idEquipo", "id_equipo");
            if (idEquipo != null && !idEquipo.toString().isEmpty()) {
                EquipoModel e = new EquipoModel();
                e.setIdEquipo(Integer.parseInt(idEquipo.toString()));
                orden.setEquipo(e);
            }
            
            Object idTecnico = getValue(datos, "idTecnico", "id_tecnico");
            if (idTecnico != null && !idTecnico.toString().isEmpty() && !idTecnico.toString().equals("null")) {
                TecnicoModel t = new TecnicoModel();
                t.setIdPersona(Integer.parseInt(idTecnico.toString()));
                orden.setTecnico(t);
            }
            
            String estado = getString(datos, "estado");
            orden.setEstado(estado != null && !estado.isEmpty() ? estado : "PENDIENTE");
            
            String fechaStr = getString(datos, "fechaInicio", "fecha_inicio", "fecha_ingreso");
            if (fechaStr != null && !fechaStr.isEmpty()) {
                orden.setFechaInicio(parseFecha(fechaStr));
            }
            
            String fechaFinStr = getString(datos, "fechaFin", "fecha_fin");
            if (fechaFinStr != null && !fechaFinStr.isEmpty()) {
                orden.setFechaFin(parseFecha(fechaFinStr));
            }
            
            OrdenTrabajo saved = ordenTrabajoService.save(orden);
            
            // 🔔 NOTIFICACIÓN: Nueva orden creada
            notificacionService.crearNotificacion(
                "TICKET",
                "Nueva Orden de Trabajo",
                "Se ha creado la orden OT-" + saved.getIdOrden() + " con estado: " + orden.getEstado(),
                saved.getIdOrden()
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Orden creada exitosamente");
            response.put("idOrden", saved.getIdOrden());
            
            System.out.println("✅ [POST] Orden creada: " + saved.getIdOrden());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Formato de número inválido: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error al crear orden: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Map<String, Object> datos) {
        try {
            System.out.println("📥 [PUT] ID: " + id + " Datos: " + datos);
            
            OrdenTrabajo orden = ordenTrabajoService.findById(id);
            String estadoAnterior = orden.getEstado();
            
            Object idTecnico = getValue(datos, "idTecnico", "id_tecnico");
            if (idTecnico != null) {
                String idStr = idTecnico.toString();
                if (!idStr.isEmpty() && !idStr.equals("null")) {
                    TecnicoModel t = new TecnicoModel();
                    t.setIdPersona(Integer.parseInt(idStr));
                    orden.setTecnico(t);
                }
            }
            
            String estado = getString(datos, "estado");
            if (estado != null && !estado.isEmpty()) {
                orden.setEstado(estado);
            }
            
            String fechaInicioStr = getString(datos, "fechaInicio", "fecha_inicio");
            if (fechaInicioStr != null && !fechaInicioStr.isEmpty()) {
                orden.setFechaInicio(parseFecha(fechaInicioStr));
            }
            
            String fechaFinStr = getString(datos, "fechaFin", "fecha_fin");
            if (fechaFinStr != null && !fechaFinStr.isEmpty()) {
                orden.setFechaFin(parseFecha(fechaFinStr));
            }
            
            Object idCotizacion = getValue(datos, "idCotizacion", "id_cotizacion");
            if (idCotizacion != null) {
                orden.setIdCotizacion(Integer.parseInt(idCotizacion.toString()));
            }
            
            Object puedePagar = getValue(datos, "puedePagar", "puede_pagar");
            if (puedePagar != null) {
                orden.setPuedePagar(Boolean.parseBoolean(puedePagar.toString()));
            }
            
            ordenTrabajoService.update(id, orden);
            
            // 🔔 NOTIFICACIÓN: Cambio de estado
            if (estado != null && !estado.isEmpty() && !estado.equals(estadoAnterior)) {
                String nombreCliente = "Cliente";
                if (orden.getReporte() != null && orden.getReporte().getPersona() != null) {
                    nombreCliente = orden.getReporte().getPersona().getNombre() + " " +
                                   (orden.getReporte().getPersona().getApellido() != null ? 
                                    orden.getReporte().getPersona().getApellido() : "");
                }
                
                notificacionService.crearNotificacion(
                    "REPARACION",
                    "Cambio de Estado",
                    "OT-" + id + " de " + nombreCliente + " cambió de '" + 
                    estadoAnterior + "' a '" + estado + "'",
                    id
                );
            }
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Orden actualizada exitosamente",
                "idOrden", id
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error al actualizar: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            ordenTrabajoService.delete(id);
            return ResponseEntity.ok(Map.of("mensaje", "Orden eliminada exitosamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error al eliminar: " + e.getMessage()));
        }
    }

    @PostMapping("/crear-desde-reporte/{idReporte}")
    public ResponseEntity<?> crearDesdeReporte(@PathVariable Integer idReporte) {
        try {
            OrdenTrabajo orden = ordenTrabajoService.crearDesdeReporte(idReporte);
            
            // 🔔 NOTIFICACIÓN
            notificacionService.crearNotificacion(
                "TICKET",
                "Orden Creada desde Reporte",
                "Se ha creado la orden OT-" + orden.getIdOrden() + " desde el reporte #" + idReporte,
                orden.getIdOrden()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                        "mensaje", "Orden creada exitosamente desde reporte",
                        "idOrden", orden.getIdOrden()
                    ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error: " + e.getMessage()));
        }
    }

    // ==================== CONVERTIR ORDEN A MAPA ====================
    private Map<String, Object> convertirOrdenAMapa(OrdenTrabajo ot) {
        Map<String, Object> data = new LinkedHashMap<>();
        
        data.put("idOrden", ot.getIdOrden());
        data.put("id_orden", ot.getIdOrden());
        data.put("estado", ot.getEstado() != null ? ot.getEstado() : "PENDIENTE");
        data.put("fechaInicio", ot.getFechaInicio() != null ? ot.getFechaInicio().toString() : null);
        data.put("fecha_inicio", ot.getFechaInicio() != null ? ot.getFechaInicio().toString() : null);
        data.put("fechaFin", ot.getFechaFin() != null ? ot.getFechaFin().toString() : null);
        data.put("fecha_fin", ot.getFechaFin() != null ? ot.getFechaFin().toString() : null);
        
        data.put("idCotizacion", ot.getIdCotizacion());
        data.put("id_cotizacion", ot.getIdCotizacion());
        data.put("idReparacion", ot.getIdReparacion());
        data.put("id_reparacion", ot.getIdReparacion());
        data.put("puedePagar", ot.getPuedePagar());
        data.put("puede_pagar", ot.getPuedePagar());
        
        if (ot.getIdCotizacion() != null) {
            try {
                Optional<CotizacionModel> cotOpt = cotizacionRepository.findById(ot.getIdCotizacion());
                if (cotOpt.isPresent()) {
                    CotizacionModel cot = cotOpt.get();
                    data.put("total", cot.getTotal() != null ? cot.getTotal() : BigDecimal.ZERO);
                    data.put("totalRepuestos", cot.getTotalRepuestos() != null ? cot.getTotalRepuestos() : BigDecimal.ZERO);
                    data.put("manoObra", cot.getManoObra() != null ? cot.getManoObra() : BigDecimal.ZERO);
                    data.put("notas", cot.getNotas() != null ? cot.getNotas() : "");
                    if (cot.getEstado() != null) {
                        data.put("estado", cot.getEstado());
                    }
                }
            } catch (Exception e) {
                data.put("total", 0);
                data.put("totalRepuestos", 0);
                data.put("manoObra", 0);
            }
        } else {
            data.put("total", 0);
            data.put("totalRepuestos", 0);
            data.put("manoObra", 0);
        }
        
        if (ot.getReporte() != null) {
            data.put("idTicket", ot.getReporte().getIdReporte());
            data.put("id_ticket", ot.getReporte().getIdReporte());
            data.put("idReporte", ot.getReporte().getIdReporte());
            data.put("id_reporte", ot.getReporte().getIdReporte());
            data.put("descripcion", ot.getReporte().getDescripcionFalla() != null ? ot.getReporte().getDescripcionFalla() : "");
            data.put("descripcionFalla", ot.getReporte().getDescripcionFalla() != null ? ot.getReporte().getDescripcionFalla() : "");
            data.put("descripcion_falla", ot.getReporte().getDescripcionFalla() != null ? ot.getReporte().getDescripcionFalla() : "");
            data.put("idCliente", ot.getReporte().getIdPersona());
            data.put("id_cliente", ot.getReporte().getIdPersona());
            data.put("idPersona", ot.getReporte().getIdPersona());
            data.put("id_persona", ot.getReporte().getIdPersona());
            
            if (ot.getReporte().getPersona() != null) {
                PersonaModel cliente = ot.getReporte().getPersona();
                String nombreCliente = (cliente.getNombre() != null ? cliente.getNombre() : "") + 
                                       " " + 
                                       (cliente.getApellido() != null ? cliente.getApellido() : "");
                data.put("nombreCliente", nombreCliente.trim());
                data.put("nombre_cliente", nombreCliente.trim());
                data.put("cliente", nombreCliente.trim());
            } else {
                String nombreDefault = "Cliente #" + ot.getReporte().getIdPersona();
                data.put("nombreCliente", nombreDefault);
                data.put("nombre_cliente", nombreDefault);
                data.put("cliente", nombreDefault);
            }
            
            data.put("marca", ot.getReporte().getMarca() != null ? ot.getReporte().getMarca() : "");
            data.put("modelo", ot.getReporte().getModelo() != null ? ot.getReporte().getModelo() : "");
        }
        
        if (ot.getEquipo() != null) {
            data.put("idEquipo", ot.getEquipo().getIdEquipo());
            data.put("id_equipo", ot.getEquipo().getIdEquipo());
        }
        
        if (ot.getTecnico() != null) {
            data.put("idTecnico", ot.getTecnico().getIdPersona());
            data.put("id_tecnico", ot.getTecnico().getIdPersona());
            
            if (ot.getTecnico().getPersona() != null) {
                PersonaModel p = ot.getTecnico().getPersona();
                String nombreCompleto = (p.getNombre() != null ? p.getNombre() : "") + 
                                       " " + 
                                       (p.getApellido() != null ? p.getApellido() : "");
                data.put("nombreTecnico", nombreCompleto.trim());
                data.put("nombre_tecnico", nombreCompleto.trim());
                data.put("tecnico", nombreCompleto.trim());
            }
        }
        
        return data;
    }

    private Object getValue(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            if (map.containsKey(key) && map.get(key) != null) {
                return map.get(key);
            }
        }
        return null;
    }

    private String getString(Map<String, Object> map, String... keys) {
        Object value = getValue(map, keys);
        return value != null ? value.toString() : null;
    }

    private LocalDate parseFecha(String fechaStr) {
        if (fechaStr == null || fechaStr.isEmpty()) {
            return LocalDate.now();
        }
        
        fechaStr = fechaStr.trim();
        if (fechaStr.contains("T")) {
            fechaStr = fechaStr.substring(0, fechaStr.indexOf('T'));
        }
        if (fechaStr.contains(" ")) {
            fechaStr = fechaStr.substring(0, fechaStr.indexOf(' '));
        }
        
        DateTimeFormatter[] formatters = {
            DateTimeFormatter.ISO_LOCAL_DATE,
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd")
        };
        
        for (DateTimeFormatter formatter : formatters) {
            try {
                return LocalDate.parse(fechaStr, formatter);
            } catch (DateTimeParseException e) {}
        }
        
        return LocalDate.now();
    }
}