import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// ==================== INTERFACES ====================
interface OrdenApi {
  idOrden: number;
  idTecnico: number;
  idCliente: number;
  marca: string;
  modelo: string;
  estado: string;
  prioridad: string;
  fechaIngreso: string;
  fechaInicio: string;
  fechaPlazo: string;
  plazo: string;
  nombreCliente: string;
  tecnico: { idPersona: number };
  cliente: {
    persona: { nombre: string; apellido: string };
    nombreCompleto: string;
    nombres: string;
    apellidos: string;
    nombre: string;
  };
}

interface OrdenReciente {
  id: number;
  ticket: string;
  equipo: string;
  cliente: string;
  estado: string;
  prioridad: string;
}

interface Vencimiento {
  ticket: string;
  equipo: string;
  cliente: string;
  plazo: string;
  diasRestantes: number;
}

interface Cotizacion {
  id: number;
  ticket: string;
  equipo: string;
  cliente: string;
  estado: string;
  monto: number;
  fecha: string;
}

type EstadoReparacion = 'En recepción' | 'En diagnóstico' | 'En reparación' | 'En pruebas' | 'Listo para entrega';

@Component({
  selector: 'app-tecnico-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tecnico-dashboard.html',
  styleUrls: ['./tecnico-dashboard.css']
})
export class TecnicoDashboard implements OnInit {

  nombreTecnico = '';
  idTecnico: number = 0;
  cargando = false;
  error = '';

  // Estadísticas
  totalAsignadas = 0;
  enDiagnostico = 0;
  enReparacion = 0;
  enPruebas = 0;
  listosEntrega = 0;
  evaluacionesPendientes = 0;
  cotizacionesPendientes = 0;

  // Listas
  ordenesRecientes: OrdenReciente[] = [];
  proximosVencer: Vencimiento[] = [];
  cotizaciones: Cotizacion[] = [];

  // Pipeline de estados
  readonly estados: EstadoReparacion[] = [
    'En recepción', 'En diagnóstico', 'En reparación', 'En pruebas', 'Listo para entrega'
  ];

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================
  ngOnInit(): void {
    const usuario: Record<string, unknown> = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.idTecnico = Number(usuario['idPersona']) || 0;
    this.nombreTecnico = (usuario['nombreCompleto'] as string) || 
                         `${usuario['nombres'] || ''} ${usuario['apellidos'] || ''}`.trim() || 
                         'Técnico';

    if (this.idTecnico > 0) {
      this.cargarDashboard();
    } else {
      this.error = 'No se pudo identificar al técnico.';
    }
  }

  // ============================================================
  // CARGAR DASHBOARD
  // ============================================================
  cargarDashboard(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.http.get<OrdenApi[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (data: OrdenApi[]) => {
        const ordenes: OrdenApi[] = Array.isArray(data) ? data : [];

        const ordenesTecnico: OrdenApi[] = ordenes.filter((o: OrdenApi): boolean => {
          const idTecnicoOrden: number = Number(o.idTecnico || o.tecnico?.idPersona || 0);
          return idTecnicoOrden === this.idTecnico;
        });

        // Estadísticas
        this.totalAsignadas = ordenesTecnico.length;
        this.enDiagnostico = this.contarEstado(ordenesTecnico, ['PENDIENTE', 'EN_DIAGNOSTICO']);
        this.enReparacion = this.contarEstado(ordenesTecnico, ['EN_PROCESO', 'EN_REPARACION']);
        this.enPruebas = this.contarEstado(ordenesTecnico, ['EN_PRUEBAS']);
        this.listosEntrega = this.contarEstado(ordenesTecnico, ['TERMINADO', 'LISTO_ENTREGA', 'ENTREGADO']);
        this.evaluacionesPendientes = this.enDiagnostico;

        // Recientes
        this.ordenesRecientes = ordenesTecnico.slice(0, 5).map((o: OrdenApi): OrdenReciente => ({
          id: o.idOrden,
          ticket: `OT-${o.idOrden}`,
          equipo: `${o.marca || ''} ${o.modelo || ''}`.trim() || 'Sin equipo',
          cliente: this.obtenerCliente(o),
          estado: this.mapearEstado(o.estado),
          prioridad: o.prioridad || 'Media'
        }));

        // Vencimientos
        this.proximosVencer = ordenesTecnico
          .filter((o: OrdenApi): boolean => !!(o.fechaPlazo || o.plazo))
          .filter((o: OrdenApi): boolean =>
            !['TERMINADO', 'ENTREGADO', 'LISTO_ENTREGA', 'CANCELADO'].includes(o.estado)
          )
          .map((o: OrdenApi): Vencimiento => ({
            ticket: `OT-${o.idOrden}`,
            equipo: `${o.marca || ''} ${o.modelo || ''}`.trim() || 'Sin equipo',
            cliente: this.obtenerCliente(o),
            plazo: o.fechaPlazo || o.plazo || '',
            diasRestantes: this.calcularDias(o.fechaPlazo || o.plazo)
          }))
          .sort((a: Vencimiento, b: Vencimiento): number => a.diasRestantes - b.diasRestantes)
          .slice(0, 5);

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: Error & { status?: number; statusText?: string }): void => {
        console.error('❌ Error:', err);
        this.error = `Error ${err.status || ''}: ${err.statusText || 'Error de conexión'}`;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });

    // Cargar cotizaciones
    this.cargarCotizaciones();
  }

  // ============================================================
  // CARGAR COTIZACIONES
  // ============================================================
  cargarCotizaciones(): void {
    this.http.get<any[]>(`${this.apiUrl}/cotizaciones/tecnico/${this.idTecnico}`).subscribe({
      next: (data) => {
        const cotizacionesArray = Array.isArray(data) ? data : (data as any)?.data || [];
        
        this.cotizaciones = cotizacionesArray
          .filter((c: any) => c.estado === 'PENDIENTE' || c.estado === 'EN_REVISION')
          .slice(0, 5)
          .map((c: any): Cotizacion => ({
            id: c.idCotizacion || c.id,
            ticket: c.ticket || `COT-${c.idCotizacion || c.id}`,
            equipo: c.equipo || `${c.marca || ''} ${c.modelo || ''}`.trim() || 'Sin equipo',
            cliente: c.cliente?.nombre || c.cliente?.nombreCompleto || c.nombreCliente || 'Sin cliente',
            estado: c.estado === 'PENDIENTE' ? 'Pendiente' : 'En revisión',
            monto: c.montoTotal || c.total || 0,
            fecha: c.fechaCreacion || c.fecha || ''
          }));

        this.cotizacionesPendientes = this.cotizaciones.length;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('⚠️ No se pudieron cargar cotizaciones:', err);
      }
    });
  }

  // ============================================================
  // UTILITARIOS
  // ============================================================
  private contarEstado(ordenes: OrdenApi[], estados: string[]): number {
    return ordenes.filter((o: OrdenApi): boolean => estados.includes(o.estado)).length;
  }

  private obtenerCliente(o: OrdenApi): string {
    const c = o.cliente;
    if (c?.persona?.nombre) {
      return `${c.persona.nombre} ${c.persona.apellido || ''}`.trim();
    }
    if (c?.nombreCompleto) return c.nombreCompleto;
    if (c?.nombres) {
      return `${c.nombres} ${c.apellidos || ''}`.trim();
    }
    if (c?.nombre) return c.nombre;
    if (o.nombreCliente) return o.nombreCliente;
    if (typeof c === 'string') return c;
    return o.idCliente ? `Cliente #${o.idCliente}` : 'Sin cliente';
  }

  mapearEstado(estado: string): string {
    const m: Record<string, string> = {
      'PENDIENTE': 'En recepción',
      'RECEPCIONADO': 'En recepción',
      'EN_DIAGNOSTICO': 'En diagnóstico',
      'EN_PROCESO': 'En reparación',
      'EN_REPARACION': 'En reparación',
      'EN_PRUEBAS': 'En pruebas',
      'TERMINADO': 'Listo para entrega',
      'LISTO_ENTREGA': 'Listo para entrega',
      'ENTREGADO': 'Listo para entrega'
    };
    return m[estado] || estado || 'En recepción';
  }

  private calcularDias(fecha: string): number {
    if (!fecha) return 0;
    const hoy: Date = new Date();
    hoy.setHours(0, 0, 0, 0);
    const plazo: Date = new Date(fecha);
    plazo.setHours(0, 0, 0, 0);
    return Math.ceil((plazo.getTime() - hoy.getTime()) / 86400000);
  }

  // ============================================================
  // PIPELINE
  // ============================================================
  getIndiceEstado(estado: string): number {
    return this.estados.indexOf(estado as EstadoReparacion);
  }

  // ============================================================
  // CLASES CSS
  // ============================================================
  claseEstado(estado: string): string {
    const c: Record<string, string> = {
      'En recepción': 'recepcion',
      'En diagnóstico': 'diagnostico',
      'En reparación': 'reparacion',
      'En pruebas': 'pruebas',
      'Listo para entrega': 'terminado'
    };
    return c[estado] || '';
  }

  claseUrgencia(dias: number): string {
    if (dias <= 0) return 'vencido';
    if (dias <= 2) return 'urgente';
    if (dias <= 5) return 'proximo';
    return 'normal';
  }

  // ============================================================
  // FORMATEAR MONTO
  // ============================================================
  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'PEN',
      minimumFractionDigits: 2 
    }).format(monto);
  }

  // ============================================================
  // RECARGAR
  // ============================================================
  recargarDatos(): void {
    this.cargarDashboard();
  }
}