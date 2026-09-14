package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.AdministradorModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdministradorRepository extends JpaRepository<AdministradorModel, Integer> {
}