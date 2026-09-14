package com.reparaciones.paginaweb.models;

import jakarta.persistence.*;

@Entity
@Table(name = "cliente")
public class ClienteModel {

    @Id
    @Column(name = "id_persona")
    private Integer idPersona;

    public ClienteModel() {}

    public Integer getIdPersona() { return idPersona; }
    public void setIdPersona(Integer idPersona) { this.idPersona = idPersona; }
}