package com.reparaciones.paginaweb.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;

@Entity
@Table(name = "cotizacion_trabajos")
public class CotizacionTrabajoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cot_trabajo")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cotizacion")
    @JsonIgnore
    private CotizacionModel cotizacion;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "costo", precision = 10, scale = 2)
    private BigDecimal costo = BigDecimal.ZERO;

    public CotizacionTrabajoModel() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public CotizacionModel getCotizacion() { return cotizacion; }
    public void setCotizacion(CotizacionModel cotizacion) { this.cotizacion = cotizacion; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getCosto() { return costo; }
    public void setCosto(BigDecimal costo) { this.costo = costo; }
}