package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.PagoModel;
import com.reparaciones.paginaweb.repositories.PagoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class PagoService {

    private final PagoRepository pagoRepository;

    public PagoService(PagoRepository pagoRepository) {
        this.pagoRepository = pagoRepository;
    }

    public List<PagoModel> findAll() {
        return pagoRepository.findAll();
    }

    public PagoModel findById(Integer id) {
        return pagoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado: " + id));
    }

    public List<PagoModel> findByEstado(String estado) {
        return pagoRepository.findByEstado(estado);
    }

    public List<PagoModel> findByOrdenTrabajo(Integer idOrden) {
        return pagoRepository.findByOrdenTrabajoIdOrden(idOrden);
    }

    public PagoModel save(PagoModel pago) {
        return pagoRepository.save(pago);
    }

    public PagoModel update(Integer id, PagoModel pago) {
        findById(id);
        pago.setIdpagos(id);
        return pagoRepository.save(pago);
    }

    public void delete(Integer id) {
        findById(id);
        pagoRepository.deleteById(id);
    }

    // NUEVO MÉTODO
    public Optional<PagoModel> findByIzipayOrderId(String izipayOrderId) {
        return pagoRepository.findByIzipayOrderId(izipayOrderId);
    }
}