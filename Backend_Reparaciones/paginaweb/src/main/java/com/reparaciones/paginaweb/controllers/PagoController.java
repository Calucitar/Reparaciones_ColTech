package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.PagoModel;
import com.reparaciones.paginaweb.models.OrdenTrabajo;
import com.reparaciones.paginaweb.services.PagoService;
import com.reparaciones.paginaweb.services.NotificacionService;
import com.reparaciones.paginaweb.repositories.OrdenTrabajoRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/pagos")
@CrossOrigin(origins = "*")
public class PagoController {

    private final PagoService pagoService;
    private final OrdenTrabajoRepository ordenTrabajoRepository;
    private final NotificacionService notificacionService;

    public PagoController(PagoService pagoService, 
                           OrdenTrabajoRepository ordenTrabajoRepository,
                           NotificacionService notificacionService) {
        this.pagoService = pagoService;
        this.ordenTrabajoRepository = ordenTrabajoRepository;
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public ResponseEntity<List<PagoModel>> findAll() {
        return ResponseEntity.ok(pagoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PagoModel> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(pagoService.findById(id));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<PagoModel>> findByEstado(@PathVariable String estado) {
        return ResponseEntity.ok(pagoService.findByEstado(estado));
    }

    @GetMapping("/orden/{idOrden}")
    public ResponseEntity<List<PagoModel>> findByOrdenTrabajo(@PathVariable Integer idOrden) {
        return ResponseEntity.ok(pagoService.findByOrdenTrabajo(idOrden));
    }

    @PostMapping
    public ResponseEntity<PagoModel> create(@Valid @RequestBody PagoModel pago) {
        return ResponseEntity.status(HttpStatus.CREATED).body(pagoService.save(pago));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PagoModel> update(@PathVariable Integer id, @Valid @RequestBody PagoModel pago) {
        return ResponseEntity.ok(pagoService.update(id, pago));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        pagoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/pagos/cliente/{idCliente}
    @GetMapping("/cliente/{idCliente}")
    public ResponseEntity<List<Map<String, Object>>> getPagosCliente(
            @PathVariable Integer idCliente,
            @RequestParam(required = false) String estado) {
        
        List<OrdenTrabajo> ordenes = ordenTrabajoRepository.findAll();
        List<Integer> ordenesCliente = new ArrayList<>();
        
        for (OrdenTrabajo ot : ordenes) {
            if (ot.getReporte() != null && 
                ot.getReporte().getIdPersona() != null && 
                ot.getReporte().getIdPersona().equals(idCliente)) {
                ordenesCliente.add(ot.getIdOrden());
            }
        }

        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Integer idOrden : ordenesCliente) {
            List<PagoModel> pagos = pagoService.findByOrdenTrabajo(idOrden);
            for (PagoModel p : pagos) {
                if (estado == null || estado.equals(p.getEstado())) {
                    resultado.add(pagoToMap(p));
                }
            }
        }
        
        return ResponseEntity.ok(resultado);
    }

    // GET /api/pagos/cliente/{idCliente}/historial
    @GetMapping("/cliente/{idCliente}/historial")
    public ResponseEntity<List<Map<String, Object>>> getHistorialPagos(
            @PathVariable Integer idCliente) {
        
        List<OrdenTrabajo> ordenes = ordenTrabajoRepository.findAll();
        List<Integer> ordenesCliente = new ArrayList<>();
        
        for (OrdenTrabajo ot : ordenes) {
            if (ot.getReporte() != null && 
                ot.getReporte().getIdPersona() != null && 
                ot.getReporte().getIdPersona().equals(idCliente)) {
                ordenesCliente.add(ot.getIdOrden());
            }
        }

        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Integer idOrden : ordenesCliente) {
            List<PagoModel> pagos = pagoService.findByOrdenTrabajo(idOrden);
            for (PagoModel p : pagos) {
                resultado.add(pagoToMap(p));
            }
        }
        
        return ResponseEntity.ok(resultado);
    }

    // POST /api/pagos/iniciar
    @PostMapping("/iniciar")
    public ResponseEntity<?> iniciarPago(@RequestBody Map<String, Object> datos) {
        try {
            PagoModel pago = new PagoModel();
            Integer idOrden = Integer.parseInt(datos.get("pago_id").toString());
            OrdenTrabajo ot = ordenTrabajoRepository.findById(idOrden)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
            
            pago.setOrdenTrabajo(ot);
            pago.setMonto(new BigDecimal(datos.get("monto").toString()));
            pago.setMoneda("PEN");
            pago.setEstado("PENDIENTE");
            pago.setMetodoPago("TARJETA");
            pago.setIzipayOrderId(datos.get("transaction_id").toString());
            pago.setFechaCreacion(LocalDateTime.now());
            
            PagoModel saved = pagoService.save(pago);
            
            // 🔔 NOTIFICACIÓN: Pago iniciado
            notificacionService.crearNotificacion(
                "PAGO",
                "Pago Iniciado",
                "Se ha iniciado un pago por S/." + saved.getMonto() + " para OT-" + idOrden,
                saved.getIdpagos()
            );
            
            return ResponseEntity.ok(Map.of("mensaje", "Pago iniciado", "id_pago", saved.getIdpagos()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/pagos/procesar
    @PostMapping("/procesar")
    public ResponseEntity<?> procesarPago(@RequestBody Map<String, Object> datos) {
        try {
            Integer idOrden = Integer.parseInt(datos.get("pago_id").toString());
            OrdenTrabajo ot = ordenTrabajoRepository.findById(idOrden)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
            
            PagoModel pago = new PagoModel();
            pago.setOrdenTrabajo(ot);
            pago.setMonto(new BigDecimal(datos.get("monto").toString()));
            pago.setMoneda("PEN");
            pago.setEstado("PAGADO");
            pago.setMetodoPago(datos.get("metodo_pago").toString());
            pago.setFechaPago(LocalDateTime.now());
            pago.setFechaCreacion(LocalDateTime.now());
            
            PagoModel saved = pagoService.save(pago);
            
            // 🔔 NOTIFICACIÓN: Pago procesado
            String nombreCliente = "Cliente";
            if (ot.getReporte() != null && ot.getReporte().getPersona() != null) {
                nombreCliente = ot.getReporte().getPersona().getNombre() + " " + 
                               (ot.getReporte().getPersona().getApellido() != null ? 
                                ot.getReporte().getPersona().getApellido() : "");
            }
            
            notificacionService.crearNotificacion(
                "PAGO",
                "Nuevo Pago Registrado",
                nombreCliente + " ha realizado un pago por S/." + saved.getMonto() + 
                " para OT-" + idOrden + " mediante " + saved.getMetodoPago(),
                saved.getIdpagos()
            );
            
            // Actualizar orden
            ot.setPuedePagar(false);
            ot.setEstado("ENTREGADO");
            ordenTrabajoRepository.save(ot);
            
            return ResponseEntity.ok(Map.of("mensaje", "Pago procesado", "id_pago", saved.getIdpagos()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/pagos/{id}/aprobar
    @PutMapping("/{id}/aprobar")
    public ResponseEntity<?> aprobarPago(@PathVariable Integer id) {
        try {
            PagoModel pago = pagoService.findById(id);
            pago.setEstado("APROBADO");
            pago.setFechaPago(LocalDateTime.now());
            pagoService.save(pago);
            
            // 🔔 NOTIFICACIÓN: Pago aprobado
            notificacionService.crearNotificacion(
                "PAGO",
                "Pago Aprobado",
                "El pago #" + id + " por S/." + pago.getMonto() + " ha sido aprobado.",
                id
            );
            
            return ResponseEntity.ok(Map.of("mensaje", "Pago aprobado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/pagos/{id}/rechazar
    @PutMapping("/{id}/rechazar")
    public ResponseEntity<?> rechazarPago(@PathVariable Integer id, 
                                           @RequestBody(required = false) Map<String, String> datos) {
        try {
            PagoModel pago = pagoService.findById(id);
            pago.setEstado("RECHAZADO");
            pagoService.save(pago);
            
            String motivo = (datos != null && datos.get("motivo") != null) ? 
                datos.get("motivo") : "Sin motivo especificado";
            
            // 🔔 NOTIFICACIÓN: Pago rechazado
            notificacionService.crearNotificacion(
                "PAGO",
                "Pago Rechazado",
                "El pago #" + id + " por S/." + pago.getMonto() + 
                " ha sido rechazado. Motivo: " + motivo,
                id
            );
            
            return ResponseEntity.ok(Map.of("mensaje", "Pago rechazado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/pagos/verificar/{transactionId}
    @GetMapping("/verificar/{transactionId}")
    public ResponseEntity<?> verificarPago(@PathVariable String transactionId) {
        Optional<PagoModel> pagoOpt = pagoService.findByIzipayOrderId(transactionId);
        if (pagoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Pago no encontrado"));
        }
        PagoModel pago = pagoOpt.get();
        return ResponseEntity.ok(Map.of(
            "estado", pago.getEstado() != null ? pago.getEstado() : "PENDIENTE",
            "transactionId", pago.getIzipayOrderId(),
            "monto", pago.getMonto()
        ));
    }

    // POST /api/pagos/comprobante
    @PostMapping("/comprobante")
    public ResponseEntity<?> subirComprobante(@RequestParam("comprobante") MultipartFile file,
                                               @RequestParam("cliente_id") Integer clienteId) {
        String url = "/uploads/comprobantes/" + file.getOriginalFilename();
        return ResponseEntity.ok(Map.of("url", url));
    }

    // POST /api/pagos/notificacion
    @PostMapping("/notificacion")
    public ResponseEntity<?> notificacionIzipay(@RequestBody Map<String, Object> datos) {
        String transactionId = datos.get("transactionId") != null ? 
            datos.get("transactionId").toString() : "";
        String estado = datos.get("status") != null ? 
            datos.get("status").toString() : "";
        
        Optional<PagoModel> pagoOpt = pagoService.findByIzipayOrderId(transactionId);
        if (pagoOpt.isPresent()) {
            PagoModel pago = pagoOpt.get();
            if ("SUCCESS".equalsIgnoreCase(estado)) {
                pago.setEstado("APROBADO");
                pago.setFechaPago(LocalDateTime.now());
                
                // 🔔 NOTIFICACIÓN: Pago confirmado por Izipay
                notificacionService.crearNotificacion(
                    "PAGO",
                    "Pago Confirmado",
                    "Izipay confirmó el pago #" + pago.getIdpagos() + " por S/." + pago.getMonto(),
                    pago.getIdpagos()
                );
            } else {
                pago.setEstado("RECHAZADO");
                
                // 🔔 NOTIFICACIÓN: Pago rechazado por Izipay
                notificacionService.crearNotificacion(
                    "PAGO",
                    "Pago Rechazado por Izipay",
                    "Izipay rechazó el pago #" + pago.getIdpagos(),
                    pago.getIdpagos()
                );
            }
            pagoService.save(pago);
        }
        return ResponseEntity.ok(Map.of("mensaje", "Notificación recibida"));
    }

    private Map<String, Object> pagoToMap(PagoModel p) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", p.getIdpagos());
        data.put("id_pago", p.getIdpagos());
        data.put("monto", p.getMonto());
        data.put("descripcion", "Reparación de equipo");
        data.put("estado", p.getEstado());
        data.put("metodo_pago", p.getMetodoPago());
        data.put("fecha_pago", p.getFechaPago() != null ? p.getFechaPago().toString() : null);
        data.put("ticket", p.getOrdenTrabajo() != null ? "OT-" + p.getOrdenTrabajo().getIdOrden() : "");
        data.put("id_orden", p.getOrdenTrabajo() != null ? p.getOrdenTrabajo().getIdOrden() : null);
        data.put("izipay_order_id", p.getIzipayOrderId());
        data.put("tarjeta_marca", p.getTarjetaMarca());
        return data;
    }
}