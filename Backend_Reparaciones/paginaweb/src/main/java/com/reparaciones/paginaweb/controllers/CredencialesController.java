package com.reparaciones.paginaweb.controllers;

import com.reparaciones.paginaweb.models.*;
import com.reparaciones.paginaweb.services.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class CredencialesController {

    private final CredencialesService credencialesService;
    private final PersonaService personaService;
    private final ClienteService clienteService;
    private final TecnicoService tecnicoService;
    private final AdministradorService administradorService;

    public CredencialesController(CredencialesService credencialesService,
                                   PersonaService personaService,
                                   ClienteService clienteService,
                                   TecnicoService tecnicoService,
                                   AdministradorService administradorService) {
        this.credencialesService = credencialesService;
        this.personaService = personaService;
        this.clienteService = clienteService;
        this.tecnicoService = tecnicoService;
        this.administradorService = administradorService;
    }

    // ==================== LOGIN ====================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String usuario = credentials.get("usuario");
            String contrasena = credentials.get("contrasena");
            
            System.out.println(">>> [LOGIN] Intento: " + usuario);
            
            Optional<CredencialesModel> credOpt = credencialesService.login(usuario, contrasena);
            
            if (!credOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Credenciales incorrectas"));
            }
            
            CredencialesModel cred = credOpt.get();
            
            // Validar estado: 1 = ACTIVO, 0 = INACTIVO
            if (cred.getEstado() == null || cred.getEstado() == 0) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Cuenta desactivada"));
            }
            
            PersonaModel persona = personaService.findById(cred.getIdPersona());
            
            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Login exitoso");
            response.put("idPersona", cred.getIdPersona());
            response.put("usuario", cred.getUsuario());
            response.put("rol", cred.getRol());
            response.put("estado", cred.getEstado());
            response.put("nombre", persona.getNombre());
            response.put("apellido", persona.getApellido());
            response.put("dni", persona.getDni());
            response.put("telefono", persona.getTelefono());
            response.put("correo", persona.getCorreo());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al iniciar sesión: " + e.getMessage()));
        }
    }

    // ==================== REGISTRO PÚBLICO (SIEMPRE CLIENTE) ====================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> datos) {
        try {
            String dniStr = datos.get("dni");
            String nombre = datos.get("nombre");
            String apellido = datos.get("apellido");
            String telefono = datos.getOrDefault("telefono", "");
            String usuario = datos.get("usuario");
            String contrasena = datos.get("contrasena");
            
            // FORZAR SIEMPRE A CLIENTE en registro público
            String rol = "CLIENTE";

            System.out.println(">>> [REGISTRO PÚBLICO] Creando CLIENTE: " + usuario);

            // Validaciones
            if (dniStr == null || dniStr.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "El DNI es obligatorio"));
            }
            
            if (usuario == null || usuario.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "El correo/usuario es obligatorio"));
            }

            if (contrasena == null || contrasena.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "La contraseña es obligatoria"));
            }

            if (credencialesService.existsByUsuario(usuario.trim())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "El correo ya está registrado"));
            }

            // 1. Guardar Persona
            PersonaModel persona = new PersonaModel();
            persona.setDni(dniStr.trim());
            persona.setNombre(nombre != null ? nombre.trim() : "");
            persona.setApellido(apellido != null ? apellido.trim() : "");
            persona.setTelefono(telefono != null ? telefono.trim() : "");
            persona.setCorreo(usuario.trim());
            
            PersonaModel personaGuardada = personaService.save(persona);
            System.out.println(">>> [REGISTRO] Persona ID: " + personaGuardada.getIdPersona());

            // 2. Guardar Credenciales
            CredencialesModel cred = new CredencialesModel();
            cred.setIdPersona(personaGuardada.getIdPersona());
            cred.setUsuario(usuario.trim());
            cred.setContrasena(contrasena);
            cred.setRol(rol);
            cred.setEstado(1);  // 1 = ACTIVO
            
            credencialesService.save(cred);
            System.out.println(">>> [REGISTRO] Credencial guardada: " + usuario);

            // 3. Crear Cliente (SIEMPRE)
            ClienteModel cliente = new ClienteModel();
            cliente.setIdPersona(personaGuardada.getIdPersona());
            clienteService.save(cliente);
            System.out.println(">>> [REGISTRO] Cliente creado exitosamente");

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                        "mensaje", "Cliente registrado exitosamente",
                        "idPersona", personaGuardada.getIdPersona(),
                        "usuario", usuario,
                        "rol", rol
                    ));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al registrar: " + e.getMessage()));
        }
    }

    // ==================== CREAR USUARIO POR ADMIN ====================
    @PostMapping("/admin/crear-usuario")
    public ResponseEntity<?> crearUsuarioAdmin(@RequestBody Map<String, String> datos) {
        try {
            String dniStr = datos.get("dni");
            String nombre = datos.get("nombre");
            String apellido = datos.get("apellido");
            String telefono = datos.getOrDefault("telefono", "");
            String usuario = datos.get("usuario");
            String contrasena = datos.get("contrasena");
            String rol = datos.get("rol").toUpperCase();

            System.out.println(">>> [ADMIN] Creando " + rol + ": " + usuario);

            // Validar rol permitido
            if (!rol.equals("CLIENTE") && !rol.equals("TECNICO") && 
                !rol.equals("TÉCNICO") && !rol.equals("ADMINISTRADOR") && 
                !rol.equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Rol no válido. Use: CLIENTE, TECNICO, ADMINISTRADOR"));
            }

            // Normalizar rol
            if (rol.equals("TÉCNICO")) rol = "TECNICO";
            if (rol.equals("ADMIN")) rol = "ADMINISTRADOR";

            // Validaciones básicas
            if (dniStr == null || dniStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "DNI requerido"));
            }
            if (usuario == null || usuario.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Usuario requerido"));
            }
            if (credencialesService.existsByUsuario(usuario.trim())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "El correo ya está registrado"));
            }

            // 1. Guardar Persona
            PersonaModel persona = new PersonaModel();
            persona.setDni(dniStr.trim());
            persona.setNombre(nombre.trim());
            persona.setApellido(apellido.trim());
            persona.setTelefono(telefono.trim());
            persona.setCorreo(usuario.trim());
            PersonaModel personaGuardada = personaService.save(persona);

            // 2. Guardar Credenciales
            CredencialesModel cred = new CredencialesModel();
            cred.setIdPersona(personaGuardada.getIdPersona());
            cred.setUsuario(usuario.trim());
            cred.setContrasena(contrasena);
            cred.setRol(rol);
            cred.setEstado(1);
            credencialesService.save(cred);

            // 3. Crear según rol
            switch (rol) {
                case "CLIENTE":
                    ClienteModel cliente = new ClienteModel();
                    cliente.setIdPersona(personaGuardada.getIdPersona());
                    clienteService.save(cliente);
                    break;
                    
                case "TECNICO":
                    TecnicoModel tecnico = new TecnicoModel();
                    tecnico.setIdPersona(personaGuardada.getIdPersona());
                    tecnicoService.save(tecnico);
                    break;
                    
                case "ADMINISTRADOR":
                    AdministradorModel admin = new AdministradorModel();
                    admin.setIdPersona(personaGuardada.getIdPersona());
                    administradorService.save(admin);
                    break;
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                        "mensaje", rol + " creado exitosamente",
                        "idPersona", personaGuardada.getIdPersona(),
                        "usuario", usuario,
                        "rol", rol
                    ));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error: " + e.getMessage()));
        }
    }

    // ==================== OLVIDO CONTRASEÑA ====================
    @PostMapping("/olvide-contrasena")
    public ResponseEntity<?> olvideContrasena(@RequestBody Map<String, String> request) {
        String correo = request.get("correo");
        
        if (correo == null || correo.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "El correo es obligatorio"));
        }
        
        try {
            if (credencialesService.existsByUsuario(correo.trim())) {
                return ResponseEntity.ok(Map.of("mensaje", "Se ha enviado un enlace a " + correo));
            } else {
                return ResponseEntity.ok(Map.of("mensaje", "Si el correo existe, recibirás instrucciones"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al procesar la solicitud"));
        }
    }
}