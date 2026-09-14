package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.PersonaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PersonaRepository extends JpaRepository<PersonaModel, Integer> {  
    Optional<PersonaModel> findByDni(String dni);
    boolean existsByDni(String dni);
}