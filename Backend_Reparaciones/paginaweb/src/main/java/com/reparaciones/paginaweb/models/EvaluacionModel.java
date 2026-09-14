package com.reparaciones.paginaweb.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluaciones")
public class EvaluacionModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "orden_trabajo_id")
    private Integer ordenTrabajoId;

    @Column(name = "tecnico_id")
    private Integer tecnicoId;

    @Column(name = "procesador")
    private String procesador;

    @Column(name = "ram")
    private String ram;

    @Column(name = "almacenamiento")
    private String almacenamiento;

    @Column(name = "sistema_operativo")
    private String sistemaOperativo;

    @Column(name = "detalles_revision", columnDefinition = "TEXT")
    private String detallesRevision;

    @Column(name = "fecha_evaluacion")
    private LocalDateTime fechaEvaluacion;

    public EvaluacionModel() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getOrdenTrabajoId() { return ordenTrabajoId; }
    public void setOrdenTrabajoId(Integer ordenTrabajoId) { this.ordenTrabajoId = ordenTrabajoId; }

    public Integer getTecnicoId() { return tecnicoId; }
    public void setTecnicoId(Integer tecnicoId) { this.tecnicoId = tecnicoId; }

    public String getProcesador() { return procesador; }
    public void setProcesador(String procesador) { this.procesador = procesador; }

    public String getRam() { return ram; }
    public void setRam(String ram) { this.ram = ram; }

    public String getAlmacenamiento() { return almacenamiento; }
    public void setAlmacenamiento(String almacenamiento) { this.almacenamiento = almacenamiento; }

    public String getSistemaOperativo() { return sistemaOperativo; }
    public void setSistemaOperativo(String sistemaOperativo) { this.sistemaOperativo = sistemaOperativo; }

    public String getDetallesRevision() { return detallesRevision; }
    public void setDetallesRevision(String detallesRevision) { this.detallesRevision = detallesRevision; }

    public LocalDateTime getFechaEvaluacion() { return fechaEvaluacion; }
    public void setFechaEvaluacion(LocalDateTime fechaEvaluacion) { this.fechaEvaluacion = fechaEvaluacion; }
}