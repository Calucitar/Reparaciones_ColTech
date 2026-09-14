package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.EquipoModel;
import com.reparaciones.paginaweb.services.EquipoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/equipos")
@CrossOrigin(origins = "*")
public class EquipoController {

    private final EquipoService equipoService;

    public EquipoController(EquipoService equipoService) {
        this.equipoService = equipoService;
    }

    @GetMapping
    public ResponseEntity<List<EquipoModel>> findAll() {
        return ResponseEntity.ok(equipoService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipoModel> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(equipoService.findById(id));
    }
@GetMapping("/cliente/{idCliente}")
public ResponseEntity<List<EquipoModel>> findByCliente(@PathVariable Integer idCliente) {
    return ResponseEntity.ok(equipoService.findByCliente(idCliente));
}

    @PostMapping
    public ResponseEntity<EquipoModel> create(@Valid @RequestBody EquipoModel equipo) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipoService.save(equipo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EquipoModel> update(@PathVariable Integer id, @Valid @RequestBody EquipoModel equipo) {
        return ResponseEntity.ok(equipoService.update(id, equipo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        equipoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}