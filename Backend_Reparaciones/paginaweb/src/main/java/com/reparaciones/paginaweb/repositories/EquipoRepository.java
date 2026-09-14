package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.EquipoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EquipoRepository extends JpaRepository<EquipoModel, Integer> {
    List<EquipoModel> findByClienteIdPersona(Integer idPersona);
}