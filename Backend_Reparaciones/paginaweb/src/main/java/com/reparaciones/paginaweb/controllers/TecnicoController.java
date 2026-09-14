package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.TecnicoModel;
import com.reparaciones.paginaweb.models.PersonaModel;
import com.reparaciones.paginaweb.services.TecnicoService;
import com.reparaciones.paginaweb.services.PersonaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/tecnicos")
@CrossOrigin(origins = "http://localhost:4200")
public class TecnicoController {

    private final TecnicoService tecnicoService;
    private final PersonaService personaService;

    public TecnicoController(TecnicoService tecnicoService, PersonaService personaService) {
        this.tecnicoService = tecnicoService;
        this.personaService = personaService;
    }

    // Obtener todos los técnicos con datos de persona
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        List<TecnicoModel> tecnicos = tecnicoService.findAll();
        List<Map<String, Object>> resultado = new ArrayList<>();
        
        for (TecnicoModel tecnico : tecnicos) {
            try {
                PersonaModel persona = personaService.findById(tecnico.getIdPersona());
                
                Map<String, Object> tecnicoData = new HashMap<>();
                tecnicoData.put("id", persona.getIdPersona());
                tecnicoData.put("idPersona", persona.getIdPersona());
                tecnicoData.put("nombre", persona.getNombre());
                tecnicoData.put("apellido", persona.getApellido());
                tecnicoData.put("nombreCompleto", persona.getNombre() + " " + persona.getApellido());
                tecnicoData.put("dni", persona.getDni());
                tecnicoData.put("telefono", persona.getTelefono());
                tecnicoData.put("correo", persona.getCorreo());
                
                resultado.add(tecnicoData);
            } catch (Exception e) {
                Map<String, Object> tecnicoData = new HashMap<>();
                tecnicoData.put("id", tecnico.getIdPersona());
                tecnicoData.put("idPersona", tecnico.getIdPersona());
                tecnicoData.put("nombreCompleto", "Técnico #" + tecnico.getIdPersona());
                resultado.add(tecnicoData);
            }
        }
        
        return ResponseEntity.ok(resultado);
    }

    // Obtener técnico por ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        try {
            TecnicoModel tecnico = tecnicoService.findById(id);
            PersonaModel persona = personaService.findById(tecnico.getIdPersona());
            
            Map<String, Object> tecnicoData = new HashMap<>();
            tecnicoData.put("id", persona.getIdPersona());
            tecnicoData.put("idPersona", persona.getIdPersona());
            tecnicoData.put("nombre", persona.getNombre());
            tecnicoData.put("apellido", persona.getApellido());
            tecnicoData.put("nombreCompleto", persona.getNombre() + " " + persona.getApellido());
            tecnicoData.put("dni", persona.getDni());
            tecnicoData.put("telefono", persona.getTelefono());
            tecnicoData.put("correo", persona.getCorreo());
            
            return ResponseEntity.ok(tecnicoData);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Crear técnico
    @PostMapping
    public ResponseEntity<?> create(@RequestBody TecnicoModel tecnico) {
        try {
            TecnicoModel saved = tecnicoService.save(tecnico);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Actualizar técnico
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody TecnicoModel tecnico) {
        try {
            TecnicoModel updated = tecnicoService.update(id, tecnico);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Eliminar técnico
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            tecnicoService.delete(id);
            return ResponseEntity.ok(Map.of("mensaje", "Técnico eliminado correctamente"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}