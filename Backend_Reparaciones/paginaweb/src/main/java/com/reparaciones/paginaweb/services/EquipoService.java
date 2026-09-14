package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.EquipoModel;
import com.reparaciones.paginaweb.repositories.EquipoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class EquipoService {

    private final EquipoRepository equipoRepository;

    public EquipoService(EquipoRepository equipoRepository) {
        this.equipoRepository = equipoRepository;
    }

    public List<EquipoModel> findAll() {
        return equipoRepository.findAll();
    }

    public EquipoModel findById(Integer id) {
        return equipoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipo no encontrado: " + id));
    }

    public List<EquipoModel> findByCliente(Integer idCliente) {
        return equipoRepository.findByClienteIdPersona(idCliente);
    }

    public EquipoModel save(EquipoModel equipo) {
        return equipoRepository.save(equipo);
    }

    public EquipoModel update(Integer id, EquipoModel equipo) {
        findById(id);
        equipo.setIdEquipo(id);
        return equipoRepository.save(equipo);
    }

    public void delete(Integer id) {
        findById(id);
        equipoRepository.deleteById(id);
    }
}