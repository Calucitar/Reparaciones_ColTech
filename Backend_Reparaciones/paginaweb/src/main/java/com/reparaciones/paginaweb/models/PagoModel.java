package com.reparaciones.paginaweb.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagos")
public class PagoModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Requiere AUTO_INCREMENT en BD
    @Column(name = "idpagos")
    private Integer idpagos;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_orden_trabajo", nullable = false)
    private OrdenTrabajo ordenTrabajo;

    @Column(name = "moneda")
    private String moneda;

    @Column(name = "monto", precision = 10, scale = 2)
    private BigDecimal monto;

    @Column(name = "estado")
    private String estado;

    @Column(name = "metodo_pago")
    private String metodoPago;

    @Column(name = "izipay_order_id", length = 50)
    private String izipayOrderId;

    @Column(name = "izipay_uuid", length = 100)
    private String izipayUuid;

    @Column(name = "tarjeta_marca", length = 20)
    private String tarjetaMarca;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_pago")
    private LocalDateTime fechaPago;

    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }

    public Integer getIdpagos() {
        return idpagos;
    }

    public void setIdpagos(Integer idpagos) {
        this.idpagos = idpagos;
    }

    public OrdenTrabajo getOrdenTrabajo() {
        return ordenTrabajo;
    }

    public void setOrdenTrabajo(OrdenTrabajo ordenTrabajo) {
        this.ordenTrabajo = ordenTrabajo;
    }

    public String getMoneda() {
        return moneda;
    }

    public void setMoneda(String moneda) {
        this.moneda = moneda;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public String getIzipayOrderId() {
        return izipayOrderId;
    }

    public void setIzipayOrderId(String izipayOrderId) {
        this.izipayOrderId = izipayOrderId;
    }

    public String getIzipayUuid() {
        return izipayUuid;
    }

    public void setIzipayUuid(String izipayUuid) {
        this.izipayUuid = izipayUuid;
    }

    public String getTarjetaMarca() {
        return tarjetaMarca;
    }

    public void setTarjetaMarca(String tarjetaMarca) {
        this.tarjetaMarca = tarjetaMarca;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }
  
}
