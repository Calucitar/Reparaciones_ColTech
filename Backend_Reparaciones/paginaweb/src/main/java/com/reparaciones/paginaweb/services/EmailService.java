package com.reparaciones.paginaweb.services;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarCorreoBienvenida(String to, String nombre) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("¡Bienvenido a ZolutionsTic!");
        message.setText("Hola " + nombre + ",\n\n" +
            "Tu cuenta ha sido creada exitosamente.\n" +
            "Ya puedes iniciar sesión.\n\n" +
            "Saludos,\nEquipo ZolutionsTic");
        mailSender.send(message);
    }

    public void enviarCorreoRecuperacion(String to, String nombre, String token) {
        String enlace = "http://localhost:4200/recuperar?token=" + token;
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Recuperación de contraseña - ZolutionsTic");
        message.setText("Hola " + nombre + ",\n\n" +
            "Para restablecer tu contraseña haz clic aquí:\n" + enlace + "\n\n" +
            "Saludos,\nEquipo ZolutionsTic");
        mailSender.send(message);
    }
}