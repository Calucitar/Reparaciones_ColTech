package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.ReporteFallaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReporteFallaRepository extends JpaRepository<ReporteFallaModel, Integer> {
    List<ReporteFallaModel> findAllByOrderByIdReporteDesc();
}