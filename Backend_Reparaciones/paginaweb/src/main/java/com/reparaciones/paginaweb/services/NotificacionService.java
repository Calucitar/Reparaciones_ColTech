package com.reparaciones.paginaweb.services;

import com.reparaciones.paginaweb.models.NotificacionModel;
import com.reparaciones.paginaweb.repositories.NotificacionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;

    public NotificacionService(NotificacionRepository notificacionRepository) {
        this.notificacionRepository = notificacionRepository;
    }

    public List<NotificacionModel> obtenerTodas() {
        return notificacionRepository.findAllByOrderByFechaCreacionDesc();
    }

    public List<NotificacionModel> obtenerNoLeidas() {
        return notificacionRepository.findByLeidoFalseOrderByFechaCreacionDesc();
    }

    public long contarNoLeidas() {
        return notificacionRepository.countByLeidoFalse();
    }

    public NotificacionModel crearNotificacion(String tipo, String titulo, String descripcion, Integer idReferencia) {
        NotificacionModel notificacion = new NotificacionModel();
        notificacion.setTipo(tipo);
        notificacion.setTitulo(titulo);
        notificacion.setDescripcion(descripcion);
        notificacion.setIdReferencia(idReferencia);
        return notificacionRepository.save(notificacion);
    }

    public void marcarComoLeida(Integer id) {
        notificacionRepository.findById(id).ifPresent(noti -> {
            noti.setLeido(true);
            notificacionRepository.save(noti);
        });
    }

    public void marcarTodasComoLeidas() {
        List<NotificacionModel> todas = notificacionRepository.findAll();
        todas.forEach(noti -> noti.setLeido(true));
        notificacionRepository.saveAll(todas);
    }
}