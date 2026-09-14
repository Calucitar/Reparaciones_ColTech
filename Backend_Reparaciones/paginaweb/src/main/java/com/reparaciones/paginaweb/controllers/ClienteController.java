package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.*;
import com.reparaciones.paginaweb.services.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    private final ClienteService clienteService;
    private final PersonaService personaService;

    public ClienteController(ClienteService clienteService, PersonaService personaService) {
        this.clienteService = clienteService;
        this.personaService = personaService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Integer id) {
        try {
            ClienteModel cliente = clienteService.findById(id);
            PersonaModel persona = personaService.findById(cliente.getIdPersona());
            
            Map<String, Object> response = new HashMap<>();
            response.put("idPersona", cliente.getIdPersona());
            
            Map<String, String> personaMap = new HashMap<>();
            personaMap.put("nombre", persona.getNombre());
            personaMap.put("apellido", persona.getApellido());
            personaMap.put("dni", persona.getDni());
            personaMap.put("telefono", persona.getTelefono());
            personaMap.put("correo", persona.getCorreo());
            response.put("persona", personaMap);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Cliente no encontrado"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Map<String, Object> datos) {
        try {
            ClienteModel cliente = clienteService.findById(id);
            PersonaModel persona = personaService.findById(cliente.getIdPersona());
            
            @SuppressWarnings("unchecked")
            Map<String, Object> personaDatos = (Map<String, Object>) datos.get("persona");
            if (personaDatos != null) {
                if (personaDatos.get("telefono") != null) {
                    persona.setTelefono(personaDatos.get("telefono").toString());
                }
                if (personaDatos.get("correo") != null) {
                    persona.setCorreo(personaDatos.get("correo").toString());
                }
                personaService.save(persona);
            }
            
            return ResponseEntity.ok(Map.of("mensaje", "Actualizado"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}