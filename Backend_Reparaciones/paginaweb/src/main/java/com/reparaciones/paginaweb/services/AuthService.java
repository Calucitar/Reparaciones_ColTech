package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.*;
import com.reparaciones.paginaweb.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional
public class AuthService {

    private final PersonaRepository personaRepository;
    private final CredencialesRepository credencialesRepository;
    private final ClienteRepository clienteRepository;
    private final TecnicoRepository tecnicoRepository;
    private final AdministradorRepository administradorRepository;

    public AuthService(PersonaRepository personaRepository,
                       CredencialesRepository credencialesRepository,
                       ClienteRepository clienteRepository,
                       TecnicoRepository tecnicoRepository,
                       AdministradorRepository administradorRepository) {
        this.personaRepository = personaRepository;
        this.credencialesRepository = credencialesRepository;
        this.clienteRepository = clienteRepository;
        this.tecnicoRepository = tecnicoRepository;
        this.administradorRepository = administradorRepository;
    }

    // ==================== REGISTRAR USUARIO ====================
    public Map<String, Object> registrarUsuario(PersonaModel persona, String usuario, 
                                                 String contrasena, String rol) {
        if (personaRepository.existsByDni(persona.getDni())) {
            throw new RuntimeException("El DNI ya está registrado");
        }

        if (credencialesRepository.existsByUsuario(usuario)) {
            throw new RuntimeException("El correo/usuario ya está registrado");
        }

        PersonaModel personaGuardada = personaRepository.save(persona);

        CredencialesModel credenciales = new CredencialesModel();
        credenciales.setIdPersona(personaGuardada.getIdPersona());
        credenciales.setUsuario(usuario);
        credenciales.setContrasena(contrasena);
        credenciales.setRol(rol.toUpperCase());
        credenciales.setEstado(1);
        credencialesRepository.save(credenciales);

        switch (rol.toUpperCase()) {
            case "CLIENTE":
                ClienteModel cliente = new ClienteModel();
                cliente.setIdPersona(personaGuardada.getIdPersona());
                clienteRepository.save(cliente);
                break;
                
            case "TECNICO":
            case "TÉCNICO":
                TecnicoModel tecnico = new TecnicoModel();
                tecnico.setIdPersona(personaGuardada.getIdPersona());
                tecnicoRepository.save(tecnico);
                break;
                
            case "ADMIN":
            case "ADMINISTRADOR":
                AdministradorModel admin = new AdministradorModel();
                admin.setIdPersona(personaGuardada.getIdPersona());
                administradorRepository.save(admin);
                break;
                
            default:
                throw new RuntimeException("Rol no válido: " + rol);
        }

        return Map.of(
            "idPersona", personaGuardada.getIdPersona(),
            "nombre", personaGuardada.getNombre(),
            "apellido", personaGuardada.getApellido(),
            "correo", personaGuardada.getCorreo(),
            "telefono", personaGuardada.getTelefono(),
            "dni", personaGuardada.getDni(),
            "rol", rol.toUpperCase(),
            "mensaje", "Usuario registrado exitosamente como " + rol
        );
    }

    // ==================== OBTENER TODOS LOS USUARIOS ====================
    public List<Map<String, Object>> obtenerTodosUsuarios() {
        List<PersonaModel> personas = personaRepository.findAll();
        List<Map<String, Object>> usuarios = new ArrayList<>();
        
        for (PersonaModel persona : personas) {
            Map<String, Object> usuarioData = new HashMap<>();
            usuarioData.put("idPersona", persona.getIdPersona());
            usuarioData.put("nombre", persona.getNombre());
            usuarioData.put("apellido", persona.getApellido());
            usuarioData.put("dni", persona.getDni());
            usuarioData.put("telefono", persona.getTelefono());
            usuarioData.put("correo", persona.getCorreo());
            
            Optional<CredencialesModel> credOpt = 
                credencialesRepository.findByUsuario(persona.getCorreo());
            
            if (credOpt.isPresent()) {
                CredencialesModel cred = credOpt.get();
                usuarioData.put("rol", cred.getRol());
                usuarioData.put("estado", cred.getEstado());
                usuarioData.put("usuario", cred.getUsuario());
            } else {
                usuarioData.put("rol", "SIN_ROL");
                usuarioData.put("estado", 0);
                usuarioData.put("usuario", persona.getCorreo());
            }
            
            usuarios.add(usuarioData);
        }
        
        return usuarios;
    }

    // ==================== CAMBIAR ESTADO (ACTIVAR/DESACTIVAR) ====================
    public Map<String, Object> cambiarEstado(Integer idPersona, Integer estado) {
        Optional<CredencialesModel> credOpt = credencialesRepository.findById(idPersona);
        
        if (credOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado con ID: " + idPersona);
        }
        
        CredencialesModel cred = credOpt.get();
        cred.setEstado(estado);
        credencialesRepository.save(cred);
        
        return Map.of(
            "mensaje", estado == 1 ? "Usuario activado" : "Usuario desactivado",
            "idPersona", idPersona,
            "estado", estado
        );
    }

    // ==================== CAMBIAR ROL ====================
    public Map<String, Object> cambiarRol(Integer idPersona, String nuevoRol) {
        Optional<CredencialesModel> credOpt = credencialesRepository.findById(idPersona);
        
        if (credOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado con ID: " + idPersona);
        }
        
        CredencialesModel cred = credOpt.get();
        String rolAnterior = cred.getRol();
        nuevoRol = nuevoRol.toUpperCase();
        
        // Si es el mismo rol, no hacer nada
        if (rolAnterior.equalsIgnoreCase(nuevoRol)) {
            return Map.of("mensaje", "El usuario ya tiene ese rol");
        }
        
        // Actualizar credencial
        cred.setRol(nuevoRol);
        credencialesRepository.save(cred);
        
        // Eliminar de tabla anterior
        eliminarDeTablaRol(idPersona, rolAnterior);
        
        // Agregar a nueva tabla
        agregarATablaRol(idPersona, nuevoRol);
        
        return Map.of(
            "mensaje", "Rol cambiado de " + rolAnterior + " a " + nuevoRol,
            "idPersona", idPersona,
            "rol", nuevoRol
        );
    }

    // ==================== MÉTODOS AUXILIARES ====================
    private void eliminarDeTablaRol(Integer idPersona, String rol) {
        try {
            switch (rol.toUpperCase()) {
                case "CLIENTE":
                    if (clienteRepository.existsById(idPersona)) {
                        clienteRepository.deleteById(idPersona);
                    }
                    break;
                case "TECNICO":
                case "TÉCNICO":
                    if (tecnicoRepository.existsById(idPersona)) {
                        tecnicoRepository.deleteById(idPersona);
                    }
                    break;
                case "ADMINISTRADOR":
                case "ADMIN":
                    if (administradorRepository.existsById(idPersona)) {
                        administradorRepository.deleteById(idPersona);
                    }
                    break;
            }
        } catch (Exception e) {
            System.out.println("Error al eliminar de tabla " + rol + ": " + e.getMessage());
        }
    }

    private void agregarATablaRol(Integer idPersona, String rol) {
        switch (rol.toUpperCase()) {
            case "CLIENTE":
                ClienteModel cliente = new ClienteModel();
                cliente.setIdPersona(idPersona);
                clienteRepository.save(cliente);
                break;
            case "TECNICO":
            case "TÉCNICO":
                TecnicoModel tecnico = new TecnicoModel();
                tecnico.setIdPersona(idPersona);
                tecnicoRepository.save(tecnico);
                break;
            case "ADMINISTRADOR":
            case "ADMIN":
                AdministradorModel admin = new AdministradorModel();
                admin.setIdPersona(idPersona);
                administradorRepository.save(admin);
                break;
        }
    }
}