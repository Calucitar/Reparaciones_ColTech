package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.services.AuthService;
import com.reparaciones.paginaweb.services.NotificacionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdministradorController {

    private final AuthService authService;
    private final NotificacionService notificacionService;

    public AdministradorController(AuthService authService,
                                    NotificacionService notificacionService) {
        this.authService = authService;
        this.notificacionService = notificacionService;
    }

    @GetMapping("/usuarios")
    public ResponseEntity<?> getAllUsuarios() {
        try {
            List<Map<String, Object>> usuarios = authService.obtenerTodosUsuarios();
            return ResponseEntity.ok(usuarios);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error: " + e.getMessage()));
        }
    }

    @PutMapping("/usuarios/{id}/estado")
    public ResponseEntity<?> cambiarEstado(@PathVariable Integer id, 
                                            @RequestBody Map<String, Integer> body) {
        try {
            Map<String, Object> resultado = authService.cambiarEstado(id, body.get("estado"));
            
            // 🔔 NOTIFICACIÓN: Cambio de estado de usuario
            Integer nuevoEstado = body.get("estado");
            String estadoStr = (nuevoEstado != null && nuevoEstado == 1) ? "Activado" : "Desactivado";
            notificacionService.crearNotificacion(
                "USUARIO",
                "Usuario " + estadoStr,
                "El usuario #" + id + " ha sido " + estadoStr.toLowerCase() + " por el administrador.",
                id
            );
            
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/usuarios/{id}/rol")
    public ResponseEntity<?> cambiarRol(@PathVariable Integer id, 
                                         @RequestBody Map<String, String> body) {
        try {
            Map<String, Object> resultado = authService.cambiarRol(id, body.get("rol"));
            
            // 🔔 NOTIFICACIÓN: Cambio de rol
            notificacionService.crearNotificacion(
                "USUARIO",
                "Rol de Usuario Cambiado",
                "El usuario #" + id + " ahora tiene el rol: " + body.get("rol"),
                id
            );
            
            return ResponseEntity.ok(resultado);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}