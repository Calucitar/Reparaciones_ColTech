package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.CredencialesModel;
import com.reparaciones.paginaweb.repositories.CredencialesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CredencialesService {

    private final CredencialesRepository credencialesRepository;

    public CredencialesService(CredencialesRepository credencialesRepository) {
        this.credencialesRepository = credencialesRepository;
    }

    // Obtener todas las credenciales
    public List<CredencialesModel> findAll() {
        return credencialesRepository.findAll();
    }

    // Buscar por ID (idPersona)
    public CredencialesModel findById(Integer id) {
        return credencialesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Credenciales no encontradas: " + id));
    }

    // Buscar por usuario
    public Optional<CredencialesModel> findByUsuario(String usuario) {
        return credencialesRepository.findByUsuario(usuario);
    }

    // Login: buscar por usuario y contraseña
    public Optional<CredencialesModel> login(String usuario, String contrasena) {
        return credencialesRepository.findByUsuarioAndContrasena(usuario, contrasena);
    }

    // Verificar si existe un usuario
    public boolean existsByUsuario(String usuario) {
        return credencialesRepository.existsByUsuario(usuario);
    }

    // Guardar nueva credencial
    public CredencialesModel save(CredencialesModel credenciales) {
        if (credencialesRepository.existsByUsuario(credenciales.getUsuario())) {
            throw new RuntimeException("El usuario ya existe");
        }
        return credencialesRepository.save(credenciales);
    }

    // Actualizar credencial
    public CredencialesModel update(Integer id, CredencialesModel credenciales) {
        CredencialesModel existente = findById(id);
        
        if (credenciales.getUsuario() != null) {
            existente.setUsuario(credenciales.getUsuario());
        }
        if (credenciales.getContrasena() != null) {
            existente.setContrasena(credenciales.getContrasena());
        }
        if (credenciales.getRol() != null) {
            existente.setRol(credenciales.getRol());
        }
        if (credenciales.getEstado() != null) {
            existente.setEstado(credenciales.getEstado());
        }
        
        return credencialesRepository.save(existente);
    }

    // Eliminar credencial
    public void delete(Integer id) {
        findById(id); // Verifica que existe
        credencialesRepository.deleteById(id);
    }
}