import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './administrador-gestion-pagos.html',
  styleUrls: ['./administrador-gestion-pagos.css'],
})
export class AdministradorGestionPagos implements OnInit {

  modalAbierto = false;
  pagoSeleccionado: any = null;

  pagos: any[] = [];
  pagosFiltrados: any[] = [];
  
  cargando = false;
  error = '';
  exito = '';
  procesando = false;
  
  filtroEstado = 'TODOS';
  busqueda = '';

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  cargarPagos(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    console.log('🔍 Cargando pagos...');

    this.http.get<any[]>(`${this.apiUrl}/pagos`).subscribe({
      next: (data) => {
        console.log('📦 Pagos recibidos:', data?.length || 0);
        
        if (data && data.length > 0) {
          console.log('🔍 Estructura del primer pago:', data[0]);
          
          this.pagos = data.map(pago => ({
            id: pago.idpagos || pago.id_pago || pago.id || 0,
            idOrden: pago.ordenTrabajo?.idOrden || pago.id_orden || null,
            cliente: this.obtenerNombreCliente(pago),
            ticket: this.obtenerTicket(pago),
            monto: pago.monto || 0,
            metodo: pago.metodoPago || pago.metodo_pago || 'No especificado',
            fecha: pago.fechaPago || pago.fecha_pago || pago.fechaCreacion || '',
            estado: this.mapearEstadoPago(pago.estado),
            comprobanteUrl: pago.comprobante_url || null,
            descripcion: pago.descripcion || 'Pago de reparación',
            izipayOrderId: pago.izipayOrderId || pago.izipay_order_id || '',
            tarjetaMarca: pago.tarjetaMarca || pago.tarjeta_marca || ''
          }));
          
          console.log('✅ Pagos procesados:', this.pagos.length);
        } else {
          this.pagos = [];
          console.log('ℹ️ No hay pagos registrados');
        }
        
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cargar pagos:', err);
        
        if (err.status === 0) {
          this.error = '❌ No se puede conectar al servidor';
        } else if (err.status === 404) {
          this.error = '❌ No se encontró el endpoint de pagos';
        } else {
          this.error = `❌ Error ${err.status}: ${err.message || 'Error desconocido'}`;
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
        
        // Intentar cargar desde órdenes con pagos
        this.cargarPagosDesdeOrdenes();
      }
    });
  }

  cargarPagosDesdeOrdenes(): void {
    console.log('🔄 Intentando cargar pagos desde órdenes...');
    
    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (ordenes) => {
        const pagosDesdeOrdenes = (ordenes || [])
          .filter(o => o.puedePagar || o.puede_pagar || o.idCotizacion)
          .map(o => ({
            id: o.idOrden || 0,
            idOrden: o.idOrden || 0,
            cliente: o.nombreCliente || o.cliente || 'Sin cliente',
            ticket: `OT-${o.idOrden || 0}`,
            monto: o.total || 0,
            metodo: 'Pendiente',
            fecha: o.fechaFin || o.fechaInicio || '',
            estado: 'Pendiente',
            comprobanteUrl: null,
            descripcion: o.descripcion || 'Pago pendiente',
            izipayOrderId: '',
            tarjetaMarca: ''
          }));
        
        if (pagosDesdeOrdenes.length > 0) {
          this.pagos = pagosDesdeOrdenes;
          this.exito = '✅ Pagos cargados desde órdenes';
          setTimeout(() => this.exito = '', 3000);
        }
        
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = '❌ No se pudieron cargar los pagos';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private obtenerNombreCliente(pago: any): string {
    if (pago.ordenTrabajo?.reporte?.persona?.nombre) {
      const p = pago.ordenTrabajo.reporte.persona;
      return `${p.nombre || ''} ${p.apellido || ''}`.trim();
    }
    if (pago.cliente?.persona?.nombre) {
      const p = pago.cliente.persona;
      return `${p.nombre || ''} ${p.apellido || ''}`.trim();
    }
    if (pago.cliente?.nombre) {
      return pago.cliente.nombre;
    }
    if (pago.nombreCliente) {
      return pago.nombreCliente;
    }
    if (pago.nombre_cliente) {
      return pago.nombre_cliente;
    }
    return 'Cliente no especificado';
  }

  private obtenerTicket(pago: any): string {
    if (pago.ordenTrabajo?.idOrden) {
      return `OT-${pago.ordenTrabajo.idOrden}`;
    }
    if (pago.id_orden) {
      return `OT-${pago.id_orden}`;
    }
    if (pago.solicitud?.ticket) {
      return pago.solicitud.ticket;
    }
    return `PAGO-${pago.idpagos || pago.id || 0}`;
  }

  private mapearEstadoPago(estado: string): string {
    if (!estado) return 'Pendiente';
    
    const estadoUpper = estado.toUpperCase().trim();
    
    if (estadoUpper === 'APROBADO' || estadoUpper === 'PAGADO' || estadoUpper === 'COMPLETADO') {
      return 'Aprobado';
    }
    if (estadoUpper === 'PENDIENTE' || estadoUpper === 'EN_PROCESO') {
      return 'Pendiente';
    }
    if (estadoUpper === 'RECHAZADO' || estadoUpper === 'CANCELADO') {
      return 'Rechazado';
    }
    
    return estado;
  }

  aplicarFiltros(): void {
    const texto = this.busqueda.toLowerCase().trim();
    
    this.pagosFiltrados = this.pagos.filter(pago => {
      const coincideEstado = this.filtroEstado === 'TODOS' || pago.estado === this.filtroEstado;
      const coincideBusqueda = !texto || 
        (pago.cliente || '').toLowerCase().includes(texto) ||
        (pago.ticket || '').toLowerCase().includes(texto) ||
        `#${pago.id}`.includes(texto);
      return coincideEstado && coincideBusqueda;
    });
    
    console.log('📊 Pagos filtrados:', this.pagosFiltrados.length);
    this.cdr.detectChanges();
  }

  filtrarPorEstado(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  // ESTADÍSTICAS
  get totalPagos(): number {
    return this.pagos.length;
  }

  get totalAprobados(): number {
    return this.pagos.filter(p => p.estado === 'Aprobado').length;
  }

  get totalPendientes(): number {
    return this.pagos.filter(p => p.estado === 'Pendiente').length;
  }

  get totalRechazados(): number {
    return this.pagos.filter(p => p.estado === 'Rechazado').length;
  }

  get montoTotalAprobado(): number {
    return this.pagos
      .filter(p => p.estado === 'Aprobado')
      .reduce((sum, p) => sum + (p.monto || 0), 0);
  }

  abrirDetalle(pago: any): void {
    this.pagoSeleccionado = { ...pago };
    this.modalAbierto = true;
    this.cdr.detectChanges();
  }

  cerrarDetalle(): void {
    this.modalAbierto = false;
    this.pagoSeleccionado = null;
    this.cdr.detectChanges();
  }

  aprobarPago(id: number): void {
    if (!confirm('¿Está seguro de aprobar este pago?')) return;
    
    this.procesando = true;
    
    this.http.put(`${this.apiUrl}/pagos/${id}/aprobar`, {}).subscribe({
      next: (response: any) => {
        const pago = this.pagos.find(p => p.id === id);
        if (pago) {
          pago.estado = 'Aprobado';
        }
        
        if (this.pagoSeleccionado && this.pagoSeleccionado.id === id) {
          this.pagoSeleccionado.estado = 'Aprobado';
        }
        
        this.exito = '✅ Pago aprobado exitosamente';
        console.log('✅ Pago #' + id + ' aprobado');
        
        this.aplicarFiltros();
        this.procesando = false;
        this.cdr.detectChanges();
        
        setTimeout(() => this.exito = '', 3000);
      },
      error: (err) => {
        console.error('❌ Error al aprobar pago:', err);
        this.error = '❌ Error al aprobar el pago';
        this.procesando = false;
        this.cdr.detectChanges();
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  rechazarPago(id: number): void {
    if (!confirm('¿Está seguro de rechazar este pago?')) return;

    this.procesando = true;

    this.http.put(`${this.apiUrl}/pagos/${id}/rechazar`, {
      motivo: 'Pago rechazado por administrador'
    }).subscribe({
      next: () => {
        const pago = this.pagos.find(p => p.id === id);
        if (pago) {
          pago.estado = 'Rechazado';
        }
        
        if (this.pagoSeleccionado && this.pagoSeleccionado.id === id) {
          this.pagoSeleccionado.estado = 'Rechazado';
        }
        
        this.exito = '❌ Pago rechazado';
        console.log('❌ Pago #' + id + ' rechazado');
        
        this.aplicarFiltros();
        this.procesando = false;
        this.cdr.detectChanges();
        
        setTimeout(() => this.exito = '', 3000);
      },
      error: (err) => {
        console.error('❌ Error al rechazar pago:', err);
        this.error = '❌ Error al rechazar el pago';
        this.procesando = false;
        this.cdr.detectChanges();
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  formatearMonto(monto: number): string {
    if (monto === null || monto === undefined || isNaN(monto)) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return fecha;
      return fechaObj.toLocaleDateString('es-PE', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  limpiarFiltros(): void {
    this.filtroEstado = 'TODOS';
    this.busqueda = '';
    this.aplicarFiltros();
  }

  recargar(): void {
    this.pagoSeleccionado = null;
    this.modalAbierto = false;
    this.error = '';
    this.exito = '';
    this.cdr.detectChanges();
    this.cargarPagos();
  }
}