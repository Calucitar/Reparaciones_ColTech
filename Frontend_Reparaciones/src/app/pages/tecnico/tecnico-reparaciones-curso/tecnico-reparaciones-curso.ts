import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export type EstadoReparacion = 'En recepción' | 'En diagnóstico' | 'En reparación' | 'En pruebas' | 'Listo para entrega';

export interface Repuesto {
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface Reparacion {
  id: number;
  ticket: string;
  equipo: string;
  cliente: string;
  estado: EstadoReparacion;
  plazo: string;
  fechaIngreso: string;
  prioridad: string;
  modelo: string;
  serie: string;
  trabajosRealizados: string[];
  repuestos: Repuesto[];
  notas: string;
  idCotizacion?: number;
  puedePagar?: boolean;
}

@Component({
  selector: 'app-reparaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnico-reparaciones-curso.html',
  styleUrls: ['./tecnico-reparaciones-curso.css']
})
export class TecnicoReparacionesCurso implements OnInit {

  readonly estados: EstadoReparacion[] = [
    'En recepción', 'En diagnóstico', 'En reparación', 'En pruebas', 'Listo para entrega'
  ];

  reparaciones: Reparacion[] = [];
  reparacionesFiltradas: Reparacion[] = [];
  ordenSeleccionada: Reparacion | null = null;
  cargando = true;
  error = '';
  exito = '';
  procesando = false;
  mostrarModalRepuesto = false;
  filtroActivo = 'todas';

  nuevoTrabajo = '';
  nuevoRepuesto = { nombre: '', cantidad: 1, precio: 0 };

  private apiUrl = 'http://localhost:8080/api';
  idTecnico = 0;

  get ciclo(): Record<EstadoReparacion, EstadoReparacion> {
    return {
      'En recepción': 'En diagnóstico', 'En diagnóstico': 'En reparación',
      'En reparación': 'En pruebas', 'En pruebas': 'Listo para entrega',
      'Listo para entrega': 'Listo para entrega'
    };
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.idTecnico = Number(usuario.idPersona) || 0;
    if (this.idTecnico > 0) { this.cargarReparaciones(); }
    else { this.cargando = false; this.error = '❌ No se pudo identificar al técnico'; this.cdr.detectChanges(); }
  }

  cargarReparaciones(): void {
    this.cargando = true; this.error = ''; this.cdr.detectChanges();
    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (data) => {
        const delTecnico = (data || []).filter(ot => {
          const idTecnicoOrden = Number(ot.idTecnico || ot.tecnico?.idPersona || ot.id_tecnico || 0);
          const estado = ot.estado || '';
          return idTecnicoOrden === this.idTecnico && 
            (estado === 'COTIZACION_APROBADA' || estado === 'APROBADA' ||
             estado === 'EN_REPARACION' || estado === 'EN_PROCESO' ||
             estado === 'EN_PRUEBAS' || estado === 'LISTO_ENTREGA' || estado === 'TERMINADO');
        });
        this.reparaciones = [];
        delTecnico.forEach(ot => {
          const reparacion: Reparacion = {
            id: ot.idOrden, ticket: 'OT-' + ot.idOrden,
            equipo: (ot.marca || '') + ' ' + (ot.modelo || ''),
            cliente: this.obtenerNombreCliente(ot),
            estado: this.mapearEstado(ot.estado),
            plazo: ot.fechaFin || '', fechaIngreso: ot.fechaInicio || ot.fecha_inicio || '',
            prioridad: ot.prioridad || 'Media', modelo: ot.modelo || '', serie: ot.serie || '',
            trabajosRealizados: ot.trabajosRealizados || [], repuestos: ot.repuestos || [],
            notas: ot.notas || '', idCotizacion: ot.idCotizacion || ot.id_cotizacion || null,
            puedePagar: ot.puedePagar || ot.puede_pagar || false
          };
          if (reparacion.idCotizacion) {
            this.http.get<any>(`${this.apiUrl}/cotizaciones/${reparacion.idCotizacion}`).subscribe({
              next: (cot) => {
                if (cot.repuestos?.length > 0) {
                  reparacion.repuestos = cot.repuestos.map((r: any) => ({
                    nombre: r.nombre || '', cantidad: r.cantidad || 1, precio: r.precioUnitario || r.precio || 0
                  }));
                }
                if (cot.trabajos?.length > 0 && reparacion.trabajosRealizados.length === 0) {
                  reparacion.trabajosRealizados = cot.trabajos.map((t: any) => t.descripcion || '');
                }
                this.cdr.detectChanges();
              }
            });
          }
          this.reparaciones.push(reparacion);
        });
        this.reparacionesFiltradas = [...this.reparaciones];
        this.cargando = false; this.cdr.detectChanges();
      },
      error: () => { this.error = '❌ Error al cargar reparaciones'; this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  filtrarPorEstado(filtro: string): void {
    this.filtroActivo = filtro;
    if (filtro === 'todas') this.reparacionesFiltradas = [...this.reparaciones];
    else if (filtro === 'en-proceso') this.reparacionesFiltradas = this.reparaciones.filter(r => r.estado !== 'Listo para entrega');
    else if (filtro === 'listas') this.reparacionesFiltradas = this.reparaciones.filter(r => r.estado === 'Listo para entrega');
    this.cdr.detectChanges();
  }

  seleccionarOrden(orden: any): void {
    this.ordenSeleccionada = orden;
    this.nuevoTrabajo = ''; this.nuevoRepuesto = { nombre: '', cantidad: 1, precio: 0 };
    this.error = ''; this.exito = ''; this.cdr.detectChanges();
  }

  cerrarModal(): void { this.ordenSeleccionada = null; this.error = ''; this.cdr.detectChanges(); }

  abrirModalRepuesto(): void {
    this.nuevoRepuesto = { nombre: '', cantidad: 1, precio: 0 };
    this.mostrarModalRepuesto = true; this.cdr.detectChanges();
  }
  cerrarModalRepuesto(): void { this.mostrarModalRepuesto = false; this.cdr.detectChanges(); }

  agregarTrabajo(): void {
    if (!this.ordenSeleccionada || !this.nuevoTrabajo.trim()) return;
    if (!this.ordenSeleccionada.trabajosRealizados) this.ordenSeleccionada.trabajosRealizados = [];
    this.ordenSeleccionada.trabajosRealizados.push(this.nuevoTrabajo.trim());
    this.nuevoTrabajo = ''; this.cdr.detectChanges();
  }
  quitarTrabajo(index: number): void { if (!this.ordenSeleccionada) return; this.ordenSeleccionada.trabajosRealizados.splice(index, 1); this.cdr.detectChanges(); }

  agregarRepuesto(): void {
    if (!this.ordenSeleccionada || !this.nuevoRepuesto.nombre.trim()) return;
    if (!this.ordenSeleccionada.repuestos) this.ordenSeleccionada.repuestos = [];
    this.ordenSeleccionada.repuestos.push({ ...this.nuevoRepuesto });
    this.nuevoRepuesto = { nombre: '', cantidad: 1, precio: 0 };
    this.mostrarModalRepuesto = false; this.cdr.detectChanges();
  }
  quitarRepuesto(index: number): void { if (!this.ordenSeleccionada) return; this.ordenSeleccionada.repuestos.splice(index, 1); this.cdr.detectChanges(); }

  calcularTotalRepuestos(): number {
    if (!this.ordenSeleccionada?.repuestos) return 0;
    return this.ordenSeleccionada.repuestos.reduce((t, r) => t + (r.cantidad * r.precio), 0);
  }

  guardarCambios(): void {
    if (!this.ordenSeleccionada) return;
    this.procesando = true; this.error = ''; this.exito = ''; this.cdr.detectChanges();
    this.http.put(`${this.apiUrl}/ordenes-trabajo/${this.ordenSeleccionada.id}`, {
      trabajosRealizados: this.ordenSeleccionada.trabajosRealizados,
      repuestos: this.ordenSeleccionada.repuestos, notas: this.ordenSeleccionada.notas
    }).subscribe({
      next: () => {
        const nuevoEstado = this.ciclo[this.ordenSeleccionada!.estado];
        if (nuevoEstado !== this.ordenSeleccionada!.estado) {
          const datos: any = { estado: this.mapearEstadoBackend(nuevoEstado) };
          if (nuevoEstado === 'Listo para entrega') datos.puedePagar = true;
          this.http.put(`${this.apiUrl}/ordenes-trabajo/${this.ordenSeleccionada!.id}`, datos).subscribe({
            next: () => {
              this.ordenSeleccionada!.estado = nuevoEstado;
              if (nuevoEstado === 'Listo para entrega') {
                this.ordenSeleccionada!.puedePagar = true;
                this.exito = '✅ ¡Reparación completada! Pago habilitado.';
              } else { this.exito = `✅ Guardado. Avanzó a "${nuevoEstado}"`; }
              this.procesando = false; this.cdr.detectChanges();
              setTimeout(() => { this.exito = ''; this.cdr.detectChanges(); }, 5000);
            },
            error: () => { this.exito = '✅ Guardado, pero no se pudo avanzar'; this.procesando = false; this.cdr.detectChanges(); }
          });
        } else { this.exito = '✅ Cambios guardados'; this.procesando = false; this.cdr.detectChanges(); }
      },
      error: () => { this.error = '❌ Error al guardar'; this.procesando = false; this.cdr.detectChanges(); }
    });
  }

  habilitarPago(): void {
    if (!this.ordenSeleccionada || !confirm('¿Habilitar pago?')) return;
    this.procesando = true; this.cdr.detectChanges();
    this.http.put(`${this.apiUrl}/ordenes-trabajo/${this.ordenSeleccionada.id}`, { puedePagar: true, estado: 'LISTO_ENTREGA' }).subscribe({
      next: () => { this.ordenSeleccionada!.puedePagar = true; this.ordenSeleccionada!.estado = 'Listo para entrega'; this.exito = '✅ Pago habilitado'; this.procesando = false; this.cdr.detectChanges(); },
      error: () => { this.error = '❌ Error'; this.procesando = false; this.cdr.detectChanges(); }
    });
  }

  private obtenerNombreCliente(ot: any): string {
    if (ot.nombreCliente) return ot.nombreCliente;
    if (ot.cliente?.persona?.nombre) return `${ot.cliente.persona.nombre} ${ot.cliente.persona.apellido || ''}`.trim();
    if (ot.cliente?.nombreCompleto) return ot.cliente.nombreCompleto;
    if (ot.cliente?.nombre) return ot.cliente.nombre;
    return ot.idCliente ? `Cliente #${ot.idCliente}` : 'Sin cliente';
  }

  private mapearEstado(estado: string): EstadoReparacion {
    const m: Record<string, EstadoReparacion> = {
      'PENDIENTE': 'En recepción', 'RECEPCIONADO': 'En recepción', 'EN_DIAGNOSTICO': 'En diagnóstico',
      'COTIZACION_ENVIADA': 'En diagnóstico', 'COTIZACION_APROBADA': 'En diagnóstico', 'APROBADA': 'En diagnóstico',
      'EN_PROCESO': 'En reparación', 'EN_REPARACION': 'En reparación', 'EN_PRUEBAS': 'En pruebas',
      'TERMINADO': 'Listo para entrega', 'LISTO_ENTREGA': 'Listo para entrega', 'ENTREGADO': 'Listo para entrega'
    };
    return m[estado] || 'En recepción';
  }

  private mapearEstadoBackend(estado: EstadoReparacion): string {
    const m: Record<EstadoReparacion, string> = {
      'En recepción': 'RECEPCIONADO', 'En diagnóstico': 'EN_DIAGNOSTICO',
      'En reparación': 'EN_REPARACION', 'En pruebas': 'EN_PRUEBAS', 'Listo para entrega': 'LISTO_ENTREGA'
    };
    return m[estado] || 'RECEPCIONADO';
  }

  claseEstado(estado: EstadoReparacion): string {
    const m: Record<string, string> = { 'En recepción': 'recepcion', 'En diagnóstico': 'diagnostico', 'En reparación': 'reparacion', 'En pruebas': 'pruebas', 'Listo para entrega': 'terminado' };
    return m[estado] || '';
  }

  formatearMonto(monto: number): string { return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto || 0); }
  recargarDatos(): void { this.ordenSeleccionada = null; this.error = ''; this.exito = ''; this.cargarReparaciones(); }
}