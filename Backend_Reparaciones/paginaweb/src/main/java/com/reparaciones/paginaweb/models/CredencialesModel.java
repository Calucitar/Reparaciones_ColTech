package com.reparaciones.paginaweb.models;

import jakarta.persistence.*;

@Entity
@Table(name = "credenciales")
public class CredencialesModel {
    
    @Id
    @Column(name = "id_persona")
    private Integer idPersona;
    
    @Column(name = "usuario", length = 45)
    private String usuario;
    
    @Column(name = "contrasena", length = 16)
    private String contrasena;
    
    @Column(name = "rol")
    private String rol;
    
    @Column(name = "estado")
    private Integer estado;

    public CredencialesModel() {}

    public Integer getIdPersona()
     { return idPersona; }
    public void setIdPersona(Integer idPersona) 
    { this.idPersona = idPersona; }
    public String getUsuario() 
    { return usuario; }
    public void setUsuario(String usuario) 
    { this.usuario = usuario; }
    public String getContrasena()
     { return contrasena; }
    public void setContrasena(String contrasena)
     { this.contrasena = contrasena; }
    public String getRol() 
    { return rol; }
    public void setRol(String rol)
     { this.rol = rol; }
    public Integer getEstado() 
    { return estado; }
    public void setEstado(Integer estado)
     { this.estado = estado; }
    public Integer getId() 
    { return idPersona; }
    public void setId(Integer id) 
    { this.idPersona = id; }
}