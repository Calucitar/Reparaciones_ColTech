package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.PagoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

public interface PagoRepository extends JpaRepository<PagoModel, Integer> {
    
    List<PagoModel> findByEstado(String estado);
    
    List<PagoModel> findByOrdenTrabajoIdOrden(Integer idOrden);
    
    Optional<PagoModel> findByIzipayOrderId(String izipayOrderId);
    
    @Query("SELECT p FROM PagoModel p WHERE p.izipayUuid = :izipayUuid")
    Optional<PagoModel> findByIzipayUuid(String izipayUuid);
}