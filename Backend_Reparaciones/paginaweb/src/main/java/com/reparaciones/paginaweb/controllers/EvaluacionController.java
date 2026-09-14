package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.EvaluacionModel;
import com.reparaciones.paginaweb.repositories.EvaluacionRepository;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/evaluaciones")
@CrossOrigin(origins = "*")
public class EvaluacionController {

    private final EvaluacionRepository evaluacionRepository;

    public EvaluacionController(EvaluacionRepository evaluacionRepository) {
        this.evaluacionRepository = evaluacionRepository;
    }

    @PostMapping
    public ResponseEntity<?> crearEvaluacion(@RequestBody Map<String, Object> datos) {
        try {
            EvaluacionModel evaluacion = new EvaluacionModel();
            evaluacion.setOrdenTrabajoId(Integer.parseInt(datos.get("orden_trabajo_id").toString()));
            evaluacion.setTecnicoId(Integer.parseInt(datos.get("tecnico_id").toString()));
            evaluacion.setProcesador(datos.get("procesador") != null ? datos.get("procesador").toString() : "");
            evaluacion.setRam(datos.get("ram") != null ? datos.get("ram").toString() : "");
            evaluacion.setAlmacenamiento(datos.get("almacenamiento") != null ? datos.get("almacenamiento").toString() : "");
            evaluacion.setSistemaOperativo(datos.get("sistema_operativo") != null ? datos.get("sistema_operativo").toString() : "");
            evaluacion.setDetallesRevision(datos.get("detalles_revision").toString());
            evaluacion.setFechaEvaluacion(LocalDateTime.now());

            EvaluacionModel saved = evaluacionRepository.save(evaluacion);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Evaluación guardada",
                "id", saved.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<EvaluacionModel>> findAll() {
        return ResponseEntity.ok(evaluacionRepository.findAll());
    }

    @GetMapping("/orden/{idOrden}")
    public ResponseEntity<?> findByOrden(@PathVariable Integer idOrden) {
        List<EvaluacionModel> evaluaciones = evaluacionRepository.findByOrdenTrabajoId(idOrden);
        return ResponseEntity.ok(evaluaciones);
    }

    @GetMapping("/tecnico/{idTecnico}")
    public ResponseEntity<?> findByTecnico(@PathVariable Integer idTecnico) {
        List<EvaluacionModel> evaluaciones = evaluacionRepository.findByTecnicoId(idTecnico);
        return ResponseEntity.ok(evaluaciones);
    }
}