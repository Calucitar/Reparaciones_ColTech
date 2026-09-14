package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.NotificacionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificacionRepository extends JpaRepository<NotificacionModel, Integer> {
    
    List<NotificacionModel> findAllByOrderByFechaCreacionDesc();
    
    List<NotificacionModel> findByLeidoFalseOrderByFechaCreacionDesc();
    
    long countByLeidoFalse();
}