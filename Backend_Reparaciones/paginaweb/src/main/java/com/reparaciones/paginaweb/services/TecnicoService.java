package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.TecnicoModel;
import com.reparaciones.paginaweb.repositories.TecnicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TecnicoService {

    private final TecnicoRepository tecnicoRepository;

    public TecnicoService(TecnicoRepository tecnicoRepository) {
        this.tecnicoRepository = tecnicoRepository;
    }

    @Transactional(readOnly = true)
    public List<TecnicoModel> findAll() {
        return tecnicoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public TecnicoModel findById(Integer id) {
        return tecnicoRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Técnico no encontrado con ID: " + id));
    }

    @Transactional
    public TecnicoModel save(TecnicoModel tecnico) {
        if (tecnico.getIdPersona() == null) {
            throw new RuntimeException("El técnico debe tener un idPersona");
        }
        return tecnicoRepository.save(tecnico);
    }

    @Transactional
    public TecnicoModel update(Integer id, TecnicoModel tecnicoActualizado) {
        TecnicoModel existente = findById(id);
        // Solo actualiza el idPersona si cambia
        if (tecnicoActualizado.getIdPersona() != null) {
            existente.setIdPersona(tecnicoActualizado.getIdPersona());
        }
        return tecnicoRepository.save(existente);
    }

    @Transactional
    public void delete(Integer id) {
        TecnicoModel tecnico = findById(id);
        tecnicoRepository.delete(tecnico);
    }
}