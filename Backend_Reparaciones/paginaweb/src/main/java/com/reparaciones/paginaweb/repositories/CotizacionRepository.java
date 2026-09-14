// ==================== CotizacionRepository.java ====================
package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.CotizacionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;


public interface CotizacionRepository extends JpaRepository<CotizacionModel, Integer> {
    
    List<CotizacionModel> findByIdOrden(Integer idOrden);
    
    List<CotizacionModel> findByIdTecnico(Integer idTecnico);
    
    List<CotizacionModel> findByEstado(String estado);
}