import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface DevolucionEquipo {
  id: number;
  cliente: string;
  correoCliente: string;
  equipo: string;
  tecnico: string;
  motivoFalla: string;
  fechaDiagnostico: string;
  estadoNotificacion: 'Pendiente' | 'Notificado' | 'Devuelto';
  estado: string;
}

@Component({
  selector: 'app-devoluciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './administrador-devoluciones.html',
  styleUrls: ['./administrador-devoluciones.css'],
})
export class AdministradorDevoluciones implements OnInit {
  
  equiposIrreparables: DevolucionEquipo[] = [];
  cargando = false;
  error = '';
  exito = '';
  
  mostrarModalConfirmacion = false;
  mostrarModalDevolucion = false;
  clienteSeleccionado: DevolucionEquipo | null = null;
  
  mostrarToast = false;
  mensajeToast = '';
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDevoluciones();
  }

  get pendientesNotificar(): number {
    return this.equiposIrreparables.filter(e => e.estadoNotificacion === 'Pendiente').length;
  }

  get notificados(): number {
    return this.equiposIrreparables.filter(e => e.estadoNotificacion === 'Notificado').length;
  }

  get devueltos(): number {
    return this.equiposIrreparables.filter(e => e.estadoNotificacion === 'Devuelto').length;
  }

  cargarDevoluciones(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    console.log('🔍 Cargando devoluciones...');

    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (data) => {
        console.log('📦 Órdenes recibidas:', data?.length);
        
        // Filtrar órdenes que requieren devolución
        const devoluciones = (data || []).filter(ot => {
          const estado = (ot.estado || '').toUpperCase();
          return estado === 'DEVUELTO' || 
                 estado === 'COTIZACION_RECHAZADA' ||
                 estado === 'RECHAZADA' ||
                 estado === 'IRREPARABLE' ||
                 estado === 'PENDIENTE_DEVOLUCION' ||
                 estado === 'NOTIFICADO_DEVOLUCION' ||
                 estado === 'LISTO_DEVOLUCION';
        });

        console.log('🔍 Devoluciones encontradas:', devoluciones.length);
        console.log('📋 Estados:', devoluciones.map(d => d.estado));

        this.equiposIrreparables = devoluciones.map(ot => ({
          id: ot.idOrden || 0,
          cliente: this.extraerNombreCliente(ot),
          correoCliente: this.extraerCorreo(ot),
          equipo: this.extraerEquipo(ot),
          tecnico: this.extraerNombreTecnico(ot),
          motivoFalla: ot.descripcion || ot.descripcionFalla || ot.motivo || 'Cotización rechazada por el cliente',
          fechaDiagnostico: ot.fechaFin || ot.fecha_fin || ot.fechaInicio || '',
          estadoNotificacion: this.mapearEstadoDevolucion(ot.estado, ot.estadoNotificacion),
          estado: ot.estado || ''
        }));

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = '❌ No se pudieron cargar las devoluciones';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extraerNombreCliente(ot: any): string {
    if (ot.cliente?.nombre) {
      return `${ot.cliente.nombre} ${ot.cliente.apellido || ''}`.trim();
    }
    return ot.nombreCliente || ot.cliente || 'Sin cliente';
  }

  private extraerCorreo(ot: any): string {
    if (ot.cliente?.email) return ot.cliente.email;
    if (ot.cliente?.correo) return ot.cliente.correo;
    return ot.correo || ot.email || ot.correoCliente || 'No disponible';
  }

  private extraerEquipo(ot: any): string {
    if (ot.equipo?.marca) {
      return `${ot.equipo.marca} ${ot.equipo.modelo || ''}`.trim();
    }
    return ot.equipo || `${ot.marca || ''} ${ot.modelo || ''}`.trim() || 'Sin equipo';
  }

  private extraerNombreTecnico(ot: any): string {
    if (ot.tecnico?.nombre) {
      return `${ot.tecnico.nombre} ${ot.tecnico.apellido || ''}`.trim();
    }
    return ot.nombreTecnico || ot.tecnico || 'Sin técnico';
  }

  private mapearEstadoDevolucion(estado: string, estadoNotificacion: string): 'Pendiente' | 'Notificado' | 'Devuelto' {
    if (estadoNotificacion === 'Notificado' || estadoNotificacion === 'Devuelto') {
      return estadoNotificacion as 'Notificado' | 'Devuelto';
    }
    
    const estadoUpper = (estado || '').toUpperCase();
    if (estadoUpper.includes('DEVUELTO') || estadoUpper.includes('LISTO_DEVOLUCION')) return 'Devuelto';
    if (estadoUpper.includes('NOTIFICADO')) return 'Notificado';
    return 'Pendiente';
  }

  // ==================== NOTIFICAR CLIENTE ====================
  notificarCliente(id: number): void {
    this.clienteSeleccionado = this.equiposIrreparables.find(e => e.id === id) || null;
    if (this.clienteSeleccionado) {
      this.mostrarModalConfirmacion = true;
    }
  }

  confirmarNotificacion(): void {
    if (!this.clienteSeleccionado) return;
    
    const equipo = this.clienteSeleccionado;
    
    this.http.put(`${this.apiUrl}/ordenes-trabajo/${equipo.id}`, {
      estado: 'NOTIFICADO_DEVOLUCION',
      estadoNotificacion: 'Notificado'
    }).subscribe({
      next: () => {
        equipo.estadoNotificacion = 'Notificado';
        this.mostrarMensajeExito(`✅ Cliente ${equipo.cliente} notificado exitosamente`);
        this.cerrarModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al notificar:', err);
        this.mostrarMensajeExito('❌ Error al enviar la notificación');
        this.cerrarModal();
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModalConfirmacion = false;
    this.mostrarModalDevolucion = false;
    this.clienteSeleccionado = null;
    this.cdr.detectChanges();
  }

  // ==================== HABILITAR DEVOLUCIÓN ====================
  abrirModalDevolucion(item: DevolucionEquipo): void {
    this.clienteSeleccionado = item;
    this.mostrarModalDevolucion = true;
    this.cdr.detectChanges();
  }

  confirmarDevolucion(): void {
    if (!this.clienteSeleccionado) return;
    
    const equipo = this.clienteSeleccionado;
    
    this.http.put(`${this.apiUrl}/ordenes-trabajo/${equipo.id}`, {
      estado: 'LISTO_DEVOLUCION',
      estadoNotificacion: 'Devuelto'
    }).subscribe({
      next: () => {
        equipo.estadoNotificacion = 'Devuelto';
        this.mostrarMensajeExito(`✅ Equipo ${equipo.equipo} marcado como devuelto`);
        this.cerrarModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al confirmar devolución:', err);
        this.mostrarMensajeExito('❌ Error al confirmar la devolución');
        this.cerrarModal();
      }
    });
  }

  // ==================== UTILIDADES ====================
  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return fecha;
      return fechaObj.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  mostrarMensajeExito(mensaje: string): void {
    this.mensajeToast = mensaje;
    this.mostrarToast = true;
    setTimeout(() => {
      this.mostrarToast = false;
    }, 3000);
  }

  recargar(): void {
    this.cargarDevoluciones();
  }
}