package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.NotificacionModel;
import com.reparaciones.paginaweb.services.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/notificaciones")
@CrossOrigin(origins = "*")
public class NotificacionController {

    private final NotificacionService notificacionService;

    public NotificacionController(NotificacionService notificacionService) {
        this.notificacionService = notificacionService;
    }

    @GetMapping
    public ResponseEntity<?> obtenerTodas() {
        List<NotificacionModel> notificaciones = notificacionService.obtenerTodas();
        List<Map<String, Object>> resultado = new ArrayList<>();
        
        for (NotificacionModel n : notificaciones) {
            resultado.add(formatearNotificacion(n));
        }
        
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/no-leidas")
    public ResponseEntity<?> obtenerNoLeidas() {
        List<NotificacionModel> notificaciones = notificacionService.obtenerNoLeidas();
        return ResponseEntity.ok(Map.of(
            "cantidad", notificaciones.size(),
            "notificaciones", notificaciones
        ));
    }

    @GetMapping("/contador")
    public ResponseEntity<?> contadorNoLeidas() {
        long cantidad = notificacionService.contarNoLeidas();
        return ResponseEntity.ok(Map.of("noLeidas", cantidad));
    }

    @PutMapping("/{id}/leer")
    public ResponseEntity<?> marcarComoLeida(@PathVariable Integer id) {
        notificacionService.marcarComoLeida(id);
        return ResponseEntity.ok(Map.of("mensaje", "Notificación marcada como leída"));
    }

    @PutMapping("/leer-todas")
    public ResponseEntity<?> marcarTodasComoLeidas() {
        notificacionService.marcarTodasComoLeidas();
        return ResponseEntity.ok(Map.of("mensaje", "Todas las notificaciones marcadas como leídas"));
    }

    private Map<String, Object> formatearNotificacion(NotificacionModel n) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", n.getIdNotificacion());
        data.put("tipo", n.getTipo() != null ? n.getTipo().toLowerCase() : "ticket");
        data.put("titulo", n.getTitulo());
        data.put("descripcion", n.getDescripcion());
        data.put("leido", n.getLeido());
        
        if (n.getFechaCreacion() != null) {
            java.time.LocalDate fecha = n.getFechaCreacion().toLocalDate();
            java.time.LocalDate hoy = java.time.LocalDate.now();
            java.time.LocalDate ayer = hoy.minusDays(1);
            
            if (fecha.equals(hoy)) {
                data.put("fecha", "Hoy");
            } else if (fecha.equals(ayer)) {
                data.put("fecha", "Ayer");
            } else {
                data.put("fecha", fecha.toString());
            }
            
            data.put("hora", n.getFechaCreacion().toLocalTime().toString().substring(0, 5));
        }
        
        data.put("idReferencia", n.getIdReferencia());
        
        return data;
    }
}