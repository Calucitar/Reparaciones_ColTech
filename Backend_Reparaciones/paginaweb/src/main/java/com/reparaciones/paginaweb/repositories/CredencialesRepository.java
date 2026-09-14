package com.reparaciones.paginaweb.repositories;

import com.reparaciones.paginaweb.models.CredencialesModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CredencialesRepository extends JpaRepository<CredencialesModel, Integer> {
    
    // Buscar por usuario
    Optional<CredencialesModel> findByUsuario(String usuario);
    
    // Buscar por usuario y contraseña (para login)
    Optional<CredencialesModel> findByUsuarioAndContrasena(String usuario, String contrasena);
    
    // Verificar si existe un usuario
    boolean existsByUsuario(String usuario);
}