package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.PersonaModel;
import com.reparaciones.paginaweb.services.PersonaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/personas")
@CrossOrigin(origins = "*")
public class PersonaController {

    private final PersonaService personaService;

    public PersonaController(PersonaService personaService) {
        this.personaService = personaService;
    }

    @GetMapping
    public ResponseEntity<List<PersonaModel>> findAll() {
        return ResponseEntity.ok(personaService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PersonaModel> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(personaService.findById(id));
    }

    @GetMapping("/dni/{dni}")
    public ResponseEntity<PersonaModel> findByDni(@PathVariable String dni) {
        return ResponseEntity.ok(personaService.findByDni(dni));
    }

    @PostMapping
    public ResponseEntity<PersonaModel> create(@Valid @RequestBody PersonaModel persona) {
        return ResponseEntity.status(HttpStatus.CREATED).body(personaService.save(persona));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PersonaModel> update(@PathVariable Integer id, @Valid @RequestBody PersonaModel persona) {
        return ResponseEntity.ok(personaService.update(id, persona));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        personaService.delete(id);
        return ResponseEntity.noContent().build();
    }
}