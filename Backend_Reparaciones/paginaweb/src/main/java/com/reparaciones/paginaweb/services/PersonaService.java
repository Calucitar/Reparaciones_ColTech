package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.PersonaModel;
import com.reparaciones.paginaweb.repositories.PersonaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class PersonaService {

    private final PersonaRepository personaRepository;

    public PersonaService(PersonaRepository personaRepository) {
        this.personaRepository = personaRepository;
    }

    public List<PersonaModel> findAll() {
        return personaRepository.findAll();
    }

    public PersonaModel findById(Integer id) {
        return personaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada: " + id));
    }

    public PersonaModel save(PersonaModel persona) {
        return personaRepository.save(persona);
    }

    public PersonaModel update(Integer id, PersonaModel persona) {
        findById(id);
        persona.setIdPersona(id);
        return personaRepository.save(persona);
    }

    public void delete(Integer id) {
        findById(id);
        personaRepository.deleteById(id);
    }

    public PersonaModel findByDni(String dni) {
        return personaRepository.findByDni(dni)
                .orElseThrow(() -> new RuntimeException("Persona no encontrada con DNI: " + dni));
    }
}