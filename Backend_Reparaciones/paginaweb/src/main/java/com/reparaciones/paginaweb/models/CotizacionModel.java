// ==================== CotizacionModel.java ====================
package com.reparaciones.paginaweb.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cotizaciones")
public class CotizacionModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cotizacion")
    private Integer idCotizacion;

    @Column(name = "id_orden")
    private Integer idOrden;

    @Column(name = "id_tecnico")
    private Integer idTecnico;

    @Column(name = "estado")
    private String estado; // PENDIENTE, APROBADA, RECHAZADA

    @Column(name = "total_repuestos", precision = 10, scale = 2)
    private BigDecimal totalRepuestos = BigDecimal.ZERO;

    @Column(name = "mano_obra", precision = 10, scale = 2)
    private BigDecimal manoObra = BigDecimal.ZERO;

    @Column(name = "total", precision = 10, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_respuesta")
    private LocalDateTime fechaRespuesta;

    @OneToMany(mappedBy = "cotizacion", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JsonIgnoreProperties("cotizacion")
    private List<CotizacionRepuestoModel> repuestos = new ArrayList<>();

    @OneToMany(mappedBy = "cotizacion", cascade = CascadeType.ALL, fetch = FetchType.EAGER, orphanRemoval = true)
    @JsonIgnoreProperties("cotizacion")
    private List<CotizacionTrabajoModel> trabajos = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
        if (this.estado == null) this.estado = "PENDIENTE";
    }

    // Getters y Setters
    public Integer getIdCotizacion() { return idCotizacion; }
    public void setIdCotizacion(Integer idCotizacion) { this.idCotizacion = idCotizacion; }

    public Integer getIdOrden() { return idOrden; }
    public void setIdOrden(Integer idOrden) { this.idOrden = idOrden; }

    public Integer getIdTecnico() { return idTecnico; }
    public void setIdTecnico(Integer idTecnico) { this.idTecnico = idTecnico; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public BigDecimal getTotalRepuestos() { return totalRepuestos; }
    public void setTotalRepuestos(BigDecimal totalRepuestos) { this.totalRepuestos = totalRepuestos; }

    public BigDecimal getManoObra() { return manoObra; }
    public void setManoObra(BigDecimal manoObra) { this.manoObra = manoObra; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaRespuesta() { return fechaRespuesta; }
    public void setFechaRespuesta(LocalDateTime fechaRespuesta) { this.fechaRespuesta = fechaRespuesta; }

    public List<CotizacionRepuestoModel> getRepuestos() { return repuestos; }
    public void setRepuestos(List<CotizacionRepuestoModel> repuestos) { this.repuestos = repuestos; }

    public List<CotizacionTrabajoModel> getTrabajos() { return trabajos; }
    public void setTrabajos(List<CotizacionTrabajoModel> trabajos) { this.trabajos = trabajos; }
}