package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.ClienteModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<ClienteModel, Integer> {
}