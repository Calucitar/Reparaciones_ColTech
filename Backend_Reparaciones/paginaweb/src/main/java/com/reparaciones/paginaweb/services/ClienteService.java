package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.ClienteModel;
import com.reparaciones.paginaweb.repositories.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<ClienteModel> findAll() {
        return clienteRepository.findAll();
    }

    public ClienteModel findById(Integer id) {
        return clienteRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado: " + id));
    }

    public ClienteModel save(ClienteModel cliente) {
        return clienteRepository.save(cliente);
    }

    public ClienteModel update(Integer id, ClienteModel clienteActualizado) {
        ClienteModel clienteExistente = findById(id);
        // Solo actualizar si hay campos nuevos
        if (clienteActualizado.getIdPersona() != null) {
            clienteExistente.setIdPersona(clienteActualizado.getIdPersona());
        }
        return clienteRepository.save(clienteExistente);
    }

    public void delete(Integer id) {
        clienteRepository.deleteById(id);
    }
}