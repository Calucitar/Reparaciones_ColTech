import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reparaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reparaciones.html',
  styleUrls: ['./reparaciones.css']
})
export class Reparaciones implements OnInit {
  
  ordenes: any[] = [];
  ordenSeleccionada: any = null;
  cargando = false;
  procesando = false;
  error = '';
  exito = '';
  idTecnico = 0;

  nuevoTrabajo = '';
  repuestos: any[] = [];
  notas = '';
  
  nuevoRepuesto = { nombre: '', cantidad: 1, precio: 0 };

  estados = ['En recepción', 'En diagnóstico', 'En reparación', 'En pruebas', 'Listo para entrega'];

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.idTecnico = Number(usuario.idPersona) || 0;
    this.cargarOrdenes();
  }

  cargarOrdenes(): void {
    this.cargando = true;
    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (data) => {
        this.ordenes = (data || []).filter(o => {
          const idTec = Number(o.idTecnico || o.tecnico?.idPersona || 0);
          return idTec === this.idTecnico;
        });
        this.cargando = false;
      },
      error: (err) => {
        this.error = 'Error al cargar órdenes';
        this.cargando = false;
      }
    });
  }

  seleccionarOrden(event: any): void {
    this.ordenSeleccionada = event.target.value;
    this.repuestos = [];
    this.nuevoTrabajo = '';
    this.notas = this.ordenSeleccionada?.notas || '';
    this.error = '';
    this.exito = '';
  }

  // ==================== TRABAJOS ====================
  get trabajosRealizados(): string[] {
    return this.ordenSeleccionada?.trabajosRealizados || [];
  }

  agregarTrabajo(): void {
    if (!this.nuevoTrabajo.trim() || !this.ordenSeleccionada) return;
    if (!this.ordenSeleccionada.trabajosRealizados) this.ordenSeleccionada.trabajosRealizados = [];
    this.ordenSeleccionada.trabajosRealizados.push(this.nuevoTrabajo.trim());
    this.nuevoTrabajo = '';
  }

  quitarTrabajo(index: number): void {
    this.ordenSeleccionada.trabajosRealizados.splice(index, 1);
  }

  // ==================== REPUESTOS ====================
  agregarRepuesto(): void {
    if (!this.nuevoRepuesto.nombre.trim() || !this.ordenSeleccionada) return;
    if (!this.ordenSeleccionada.repuestos) this.ordenSeleccionada.repuestos = [];
    this.ordenSeleccionada.repuestos.push({ ...this.nuevoRepuesto });
    this.nuevoRepuesto = { nombre: '', cantidad: 1, precio: 0 };
  }

  quitarRepuesto(index: number): void {
    this.ordenSeleccionada.repuestos.splice(index, 1);
  }

  get totalRepuestos(): number {
    if (!this.ordenSeleccionada?.repuestos) return 0;
    return this.ordenSeleccionada.repuestos.reduce((sum: number, r: any) => sum + (r.cantidad * r.precio), 0);
  }

  // ==================== ESTADO ====================
  get indiceEstado(): number {
    if (!this.ordenSeleccionada) return 0;
    const estado = this.mapearEstado(this.ordenSeleccionada.estado);
    return this.estados.indexOf(estado);
  }

  get estadoActual(): string {
    return this.mapearEstado(this.ordenSeleccionada?.estado || '');
  }

  get siguienteEstado(): string {
    const idx = this.indiceEstado;
    return idx < this.estados.length - 1 ? this.estados[idx + 1] : this.estados[idx];
  }

  avanzarEstado(): void {
    if (!this.ordenSeleccionada) return;
    const nuevoEstado = this.siguienteEstado;
    if (nuevoEstado === this.estadoActual) return;

    const estadoBackend = this.mapearEstadoBackend(nuevoEstado);
    this.procesando = true;

    this.http.put(`${this.apiUrl}/ordenes-trabajo/${this.ordenSeleccionada.idOrden}`, {
      estado: estadoBackend
    }).subscribe({
      next: () => {
        this.ordenSeleccionada.estado = estadoBackend;
        this.exito = `✅ Estado actualizado a "${nuevoEstado}"`;
        this.procesando = false;
        setTimeout(() => this.exito = '', 3000);
      },
      error: (err) => {
        this.error = 'Error al actualizar estado';
        this.procesando = false;
      }
    });
  }

  retrocederEstado(): void {
    if (!this.ordenSeleccionada || this.indiceEstado <= 0) return;
    const estadoAnterior = this.estados[this.indiceEstado - 1];
    const estadoBackend = this.mapearEstadoBackend(estadoAnterior);

    if (!confirm(`¿Retroceder a "${estadoAnterior}"?`)) return;
    this.procesando = true;

    this.http.put(`${this.apiUrl}/ordenes-trabajo/${this.ordenSeleccionada.idOrden}`, {
      estado: estadoBackend
    }).subscribe({
      next: () => {
        this.ordenSeleccionada.estado = estadoBackend;
        this.procesando = false;
      },
      error: (err) => {
        this.error = 'Error al retroceder';
        this.procesando = false;
      }
    });
  }

  // ==================== GUARDAR ====================
  guardarCambios(): void {
    if (!this.ordenSeleccionada) return;
    this.procesando = true;

    this.http.put(`${this.apiUrl}/ordenes-trabajo/${this.ordenSeleccionada.idOrden}`, {
      trabajosRealizados: this.ordenSeleccionada.trabajosRealizados,
      repuestos: this.ordenSeleccionada.repuestos,
      notas: this.notas
    }).subscribe({
      next: () => {
        this.exito = '✅ Cambios guardados correctamente';
        this.procesando = false;
        setTimeout(() => this.exito = '', 3000);
      },
      error: (err) => {
        this.error = 'Error al guardar cambios';
        this.procesando = false;
      }
    });
  }

  // ==================== UTILITARIOS ====================
  private mapearEstado(estado: string): string {
    const m: Record<string, string> = {
      'PENDIENTE': 'En recepción', 'RECEPCIONADO': 'En recepción',
      'EN_DIAGNOSTICO': 'En diagnóstico', 'EN_PROCESO': 'En reparación',
      'EN_REPARACION': 'En reparación', 'EN_PRUEBAS': 'En pruebas',
      'TERMINADO': 'Listo para entrega', 'LISTO_ENTREGA': 'Listo para entrega'
    };
    return m[estado] || estado || 'En recepción';
  }

  private mapearEstadoBackend(estado: string): string {
    const m: Record<string, string> = {
      'En recepción': 'RECEPCIONADO', 'En diagnóstico': 'EN_DIAGNOSTICO',
      'En reparación': 'EN_REPARACION', 'En pruebas': 'EN_PRUEBAS',
      'Listo para entrega': 'LISTO_ENTREGA'
    };
    return m[estado] || 'RECEPCIONADO';
  }

  claseEstado(estado: string): string {
    if (estado === 'En reparación') return 'reparacion';
    if (estado === 'En pruebas') return 'pruebas';
    if (estado === 'Listo para entrega') return 'listo';
    return 'recepcion';
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto || 0);
  }

  recargar(): void {
    this.ordenSeleccionada = null;
    this.cargarOrdenes();
  }
}