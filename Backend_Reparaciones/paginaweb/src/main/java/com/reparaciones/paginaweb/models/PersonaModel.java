package com.reparaciones.paginaweb.models;

import jakarta.persistence.*;

@Entity
@Table(name = "persona")
public class PersonaModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_persona")
    private Integer idPersona;

    @Column(name = "nombres", length = 100)
    private String nombre;  // En BD es "nombres"

    @Column(name = "apellidos", length = 100)
    private String apellido;  // En BD es "apellidos"

    @Column(length = 255)
    private String correo;

    @Column(length = 8)
    private String dni;

    @Column(length = 9)
    private String telefono;

    @Column(name = "fecha_nacimiento")
    private String fechaNacimiento;

    @Column(length = 255)
    private String estado;

    public PersonaModel() {}

    public Integer getIdPersona() { return idPersona; }
    public void setIdPersona(Integer idPersona) { this.idPersona = idPersona; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellido() { return apellido; }
    public void setApellido(String apellido) { this.apellido = apellido; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(String fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}