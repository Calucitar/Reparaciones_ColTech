import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: 'estado' | 'entrega' | 'devolucion' | 'cotizacion';
}

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente-notificacion.html',
  styleUrls: ['./cliente-notificacion.css']
})
export class ClienteNotificacion implements OnInit {

  notificaciones = signal<Notificacion[]>([]);
  cargando = signal(true);
  error = signal('');

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.cargando.set(true);
    this.error.set('');

    // Obtener el ID del cliente logueado
    const clienteData = localStorage.getItem('clienteData') || localStorage.getItem('userData') || localStorage.getItem('usuario');
    
    if (!clienteData) {
      console.warn('⚠️ No hay datos de cliente en localStorage');
      this.cargarDesdeLocalStorage();
      return;
    }

    try {
      const cliente = JSON.parse(clienteData);
      const idCliente = cliente.idPersona || cliente.id_persona || cliente.id;
      
      if (!idCliente) {
        console.warn('⚠️ No se encontró ID de cliente');
        this.cargarDesdeLocalStorage();
        return;
      }

      console.log('🔍 Cargando órdenes para cliente #' + idCliente);

      // Cargar órdenes del cliente desde el backend
      this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
        next: (ordenes) => {
          console.log('📦 Órdenes recibidas:', ordenes?.length);
          
          // Filtrar órdenes de este cliente
          const ordenesCliente = (ordenes || []).filter(o => {
            const idPersona = o.idPersona || o.id_persona || o.idCliente || o.id_cliente;
            const reporteIdPersona = o.reporte?.idPersona || o.reporte?.id_persona;
            return idPersona == idCliente || reporteIdPersona == idCliente;
          });

          console.log('📋 Órdenes del cliente:', ordenesCliente.length);

          if (ordenesCliente.length > 0) {
            const notificacionesGeneradas = this.generarNotificaciones(ordenesCliente);
            const estadoLeidas = this.cargarEstadoLeidas();
            
            const notificacionesFinales = notificacionesGeneradas.map(n => ({
              ...n,
              leida: estadoLeidas[n.id] || false
            }));

            notificacionesFinales.sort((a, b) => {
              if (a.leida !== b.leida) return a.leida ? 1 : -1;
              return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
            });

            this.notificaciones.set(notificacionesFinales);
          } else {
            this.notificaciones.set([]);
          }
          
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('❌ Error al cargar órdenes:', err);
          // Intentar cargar desde localStorage como fallback
          this.cargarDesdeLocalStorage();
        }
      });

    } catch (e) {
      console.error('❌ Error al parsear datos del cliente:', e);
      this.cargarDesdeLocalStorage();
    }
  }

  private cargarDesdeLocalStorage(): void {
    console.log('🔄 Cargando desde localStorage...');
    
    const reportesCliente = localStorage.getItem('reportesCliente');
    const ordenesCliente = localStorage.getItem('ordenesCliente');
    
    let datos: any[] = [];
    
    if (reportesCliente) {
      try { datos = JSON.parse(reportesCliente); } catch (e) {}
    }
    
    if (datos.length === 0 && ordenesCliente) {
      try { datos = JSON.parse(ordenesCliente); } catch (e) {}
    }

    if (datos.length === 0) {
      console.log('ℹ️ No hay datos en localStorage');
      this.notificaciones.set([]);
      this.cargando.set(false);
      return;
    }

    const notificacionesGeneradas = this.generarNotificaciones(datos);
    const estadoLeidas = this.cargarEstadoLeidas();
    
    const notificacionesFinales = notificacionesGeneradas.map(n => ({
      ...n,
      leida: estadoLeidas[n.id] || false
    }));

    notificacionesFinales.sort((a, b) => {
      if (a.leida !== b.leida) return a.leida ? 1 : -1;
      return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    });

    this.notificaciones.set(notificacionesFinales);
    this.cargando.set(false);
  }

  private generarNotificaciones(ordenes: any[]): Notificacion[] {
    const notificaciones: Notificacion[] = [];
    
    ordenes.forEach(orden => {
      const estado = (orden.estado || 'PENDIENTE').toUpperCase();
      const idOrden = orden.idOrden || orden.id_orden || 0;
      const idReporte = orden.idReporte || orden.id_reporte || orden.reporte?.idReporte || idOrden;
      const equipo = orden.equipo || `${orden.marca || ''} ${orden.modelo || ''}`.trim() || 'Equipo';
      
      // 1. Solicitud registrada (siempre)
      notificaciones.push({
        id: idOrden * 100 + 1,
        titulo: '📝 Solicitud Registrada',
        mensaje: `Tu solicitud OT-${idOrden} (${equipo}) ha sido registrada. Te notificaremos cuando haya actualizaciones.`,
        fecha: orden.fechaInicio || orden.fecha_inicio || orden.fechaCreacion || new Date().toISOString(),
        leida: false,
        tipo: 'estado'
      });

      // 2. Cotización pendiente
      if (estado === 'COTIZACION_ENVIADA' || estado === 'PENDIENTE') {
        notificaciones.push({
          id: idOrden * 100 + 2,
          titulo: '💰 Cotización Pendiente',
          mensaje: `Se ha enviado una cotización para tu ${equipo} (OT-${idOrden}). Revisa y aprueba o rechaza.`,
          fecha: orden.fechaCotizacion || orden.fechaActualizacion || new Date().toISOString(),
          leida: false,
          tipo: 'cotizacion'
        });
      }

      // 3. Cotización rechazada
      if (estado === 'COTIZACION_RECHAZADA' || estado === 'DEVUELTO' || estado === 'RECHAZADA') {
        notificaciones.push({
          id: idOrden * 100 + 3,
          titulo: '❌ Cotización Rechazada',
          mensaje: `Has rechazado la cotización para tu ${equipo} (OT-${idOrden}). El equipo será preparado para devolución.`,
          fecha: orden.fechaRespuesta || new Date().toISOString(),
          leida: false,
          tipo: 'cotizacion'
        });
      }

      // 4. Equipo listo para devolución
      if (estado === 'NOTIFICADO_DEVOLUCION' || estado === 'LISTO_DEVOLUCION') {
        notificaciones.push({
          id: idOrden * 100 + 4,
          titulo: '📦 Equipo Listo para Recoger',
          mensaje: `Tu ${equipo} (OT-${idOrden}) está listo para ser recogido. Acércate a nuestras instalaciones. Horario: L-V 9:00-18:00.`,
          fecha: orden.fechaDevolucion || orden.fechaActualizacion || new Date().toISOString(),
          leida: false,
          tipo: 'devolucion'
        });
      }

      // 5. Equipo en reparación
      if (estado === 'COTIZACION_APROBADA' || estado === 'EN_REPARACION' || estado === 'EN_PROCESO') {
        notificaciones.push({
          id: idOrden * 100 + 5,
          titulo: '🔧 Equipo en Reparación',
          mensaje: `Tu ${equipo} (OT-${idOrden}) está siendo reparado. Te notificaremos cuando esté listo.`,
          fecha: orden.fechaActualizacion || new Date().toISOString(),
          leida: false,
          tipo: 'estado'
        });
      }

      // 6. Reparación completada
      if (estado === 'TERMINADO' || estado === 'LISTO_ENTREGA') {
        notificaciones.push({
          id: idOrden * 100 + 6,
          titulo: '✅ Reparación Completada',
          mensaje: `¡Buenas noticias! Tu ${equipo} (OT-${idOrden}) está reparado y listo para ser recogido.`,
          fecha: orden.fechaFin || orden.fechaActualizacion || new Date().toISOString(),
          leida: false,
          tipo: 'entrega'
        });
      }

      // 7. Equipo entregado
      if (estado === 'ENTREGADO') {
        notificaciones.push({
          id: idOrden * 100 + 7,
          titulo: '🏠 Equipo Entregado',
          mensaje: `Tu ${equipo} (OT-${idOrden}) ha sido entregado. ¡Gracias por confiar en nosotros!`,
          fecha: orden.fechaFin || new Date().toISOString(),
          leida: false,
          tipo: 'entrega'
        });
      }
    });

    return notificaciones;
  }

  private cargarEstadoLeidas(): Record<number, boolean> {
    const guardado = localStorage.getItem('notificacionesLeidas');
    if (guardado) {
      try { return JSON.parse(guardado); } catch (e) {}
    }
    return {};
  }

  private guardarEstadoLeidas(): void {
    const estado: Record<number, boolean> = {};
    this.notificaciones().forEach(n => estado[n.id] = n.leida);
    localStorage.setItem('notificacionesLeidas', JSON.stringify(estado));
  }

  noLeidas = computed(() => 
    this.notificaciones().filter(n => !n.leida).length
  );

  marcarLeida(id: number): void {
    this.notificaciones.update(lista =>
      lista.map(n => n.id === id ? { ...n, leida: true } : n)
    );
    this.guardarEstadoLeidas();
  }

  marcarTodasLeidas(): void {
    this.notificaciones.update(lista =>
      lista.map(n => ({ ...n, leida: true }))
    );
    this.guardarEstadoLeidas();
  }

  eliminarNotificacion(id: number): void {
    this.notificaciones.update(lista =>
      lista.filter(n => n.id !== id)
    );
    this.guardarEstadoLeidas();
  }

  iconoTipo(tipo: Notificacion['tipo']): string {
    switch (tipo) {
      case 'entrega': return '📦';
      case 'devolucion': return '📦';
      case 'cotizacion': return '💰';
      default: return '🔄';
    }
  }

  claseTipo(tipo: Notificacion['tipo']): string {
    switch (tipo) {
      case 'entrega': return 'tipo-entrega';
      case 'devolucion': return 'tipo-devolucion';
      case 'cotizacion': return 'tipo-cotizacion';
      default: return 'tipo-estado';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const ahora = new Date();
    const fechaNot = new Date(fecha);
    
    if (isNaN(fechaNot.getTime())) return fecha;
    
    const diff = ahora.getTime() - fechaNot.getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas} h`;
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    
    return fechaNot.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}