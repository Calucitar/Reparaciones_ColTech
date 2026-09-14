package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.EvaluacionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;


public interface EvaluacionRepository extends JpaRepository<EvaluacionModel, Integer> {
    List<EvaluacionModel> findByOrdenTrabajoId(Integer ordenTrabajoId);
    List<EvaluacionModel> findByTecnicoId(Integer tecnicoId);
}