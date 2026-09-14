package com.reparaciones.paginaweb.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;

@Entity
@Table(name = "orden_trabajo")
public class OrdenTrabajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_orden")
    private Integer idOrden;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_reporte")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ReporteFallaModel reporte;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_equipo")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private EquipoModel equipo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_tecnico")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private TecnicoModel tecnico;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(name = "estado")
    private String estado;

    // ==================== NUEVOS CAMPOS ====================
    @Column(name = "id_cotizacion")
    private Integer idCotizacion;

    @Column(name = "id_reparacion")
    private Integer idReparacion;

    @Column(name = "puede_pagar")
    private Boolean puedePagar = false;

    public OrdenTrabajo() {}

    // Getters y Setters existentes
    public Integer getIdOrden() { return idOrden; }
    public void setIdOrden(Integer idOrden) { this.idOrden = idOrden; }

    public ReporteFallaModel getReporte() { return reporte; }
    public void setReporte(ReporteFallaModel reporte) { this.reporte = reporte; }

    public EquipoModel getEquipo() { return equipo; }
    public void setEquipo(EquipoModel equipo) { this.equipo = equipo; }

    public TecnicoModel getTecnico() { return tecnico; }
    public void setTecnico(TecnicoModel tecnico) { this.tecnico = tecnico; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    // ==================== NUEVOS GETTERS Y SETTERS ====================
    public Integer getIdCotizacion() { return idCotizacion; }
    public void setIdCotizacion(Integer idCotizacion) { this.idCotizacion = idCotizacion; }

    public Integer getIdReparacion() { return idReparacion; }
    public void setIdReparacion(Integer idReparacion) { this.idReparacion = idReparacion; }

    public Boolean getPuedePagar() { return puedePagar; }
    public void setPuedePagar(Boolean puedePagar) { this.puedePagar = puedePagar; }
}