package com.reparaciones.paginaweb.controllers;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import java.util.Map;

@RestController
@RequestMapping("/api/reniec")
public class ReniecController {

    private final RestTemplate restTemplate = new RestTemplate();
    
    // Tu token JWT de Factiliza protegido en el servidor
private final String TOKEN_FACTILIZA = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MDkwMiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.kuSMIJYD2_CirRFRXgNaG-unmpb1MAWT_-kgDyIQO3E";
    @GetMapping("/dni/{dni}")
    public ResponseEntity<?> consultarDni(@PathVariable String dni) {
        // 1. Limpiamos cualquier espacio invisible al final del DNI
        String dniLimpio = dni.trim();
        String url = "https://api.factiliza.com/v1/dni/info/" + dniLimpio;

        try {
            HttpHeaders headers = new HttpHeaders();
            
            headers.setBearerAuth(TOKEN_FACTILIZA.trim()); 
            
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json");

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            System.out.println("Intentando conectar con: " + url);

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            return ResponseEntity.ok(response.getBody());

        } catch (HttpClientErrorException.Unauthorized e) {
            // 4. Si vuelve a fallar el token, te imprimirá el mensaje real de Factiliza en la terminal
            System.out.println("Motivo del rechazo 401: " + e.getResponseBodyAsString());
            
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "El token del proveedor externo ha expirado o fue rechazado por seguridad. Revisa la consola."
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Error al procesar la consulta de DNI: " + e.getMessage()
            ));
        }
    }
}