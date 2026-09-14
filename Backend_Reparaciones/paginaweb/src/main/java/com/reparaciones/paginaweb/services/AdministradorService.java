package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.AdministradorModel;
import com.reparaciones.paginaweb.repositories.AdministradorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AdministradorService {

    private final AdministradorRepository administradorRepository;

    public AdministradorService(AdministradorRepository administradorRepository) {
        this.administradorRepository = administradorRepository;
    }

    public List<AdministradorModel> findAll() {
        return administradorRepository.findAll();
    }

    public AdministradorModel findById(Integer id) {
        return administradorRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Administrador no encontrado: " + id));
    }

    public AdministradorModel save(AdministradorModel administrador) {
        if (administrador.getIdPersona() == null) {
            throw new RuntimeException("El administrador debe tener un idPersona");
        }
        return administradorRepository.save(administrador);
    }

    public void delete(Integer id) {
        administradorRepository.deleteById(id);
    }
}