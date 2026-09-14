package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.TecnicoModel;
import org.springframework.data.jpa.repository.JpaRepository;




public interface TecnicoRepository extends JpaRepository<TecnicoModel, Integer> {
}