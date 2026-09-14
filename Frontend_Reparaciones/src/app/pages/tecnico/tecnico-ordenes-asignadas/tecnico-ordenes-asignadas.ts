import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ordenes-asignadas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnico-ordenes-asignadas.html',
  styleUrls: ['./tecnico-ordenes-asignadas.css']
})
export class TecnicoOrdenesAsignadas implements OnInit {

  ordenes: any[] = [];
  cargando = true;
  error = '';
  exito = '';
  filtroEstado = 'TODOS';
  busqueda = '';
  idTecnico = 0;

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient, public cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.obtenerIdTecnico();
    if (this.idTecnico > 0) {
      this.cargarOrdenes();
    } else {
      this.cargando = false;
      this.error = '❌ No se pudo identificar al técnico. Inicie sesión nuevamente.';
      this.cdr.detectChanges();
    }
  }

  obtenerIdTecnico(): void {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      this.idTecnico = Number(usuario.idPersona || usuario.id || 0);
    } catch (e) {
      this.idTecnico = 0;
    }
    console.log('🔧 ID Técnico:', this.idTecnico);
  }

  cargarOrdenes(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    // Estados válidos para órdenes de trabajo
    const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'ENTREGADO'];

    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (data) => {
        console.log('✅ Órdenes recibidas:', data?.length);

        // Filtrar por técnico Y solo estados válidos de orden de trabajo
        this.ordenes = (data || []).filter(o => {
          const idTec = Number(o.idTecnico || o.tecnico?.idPersona || o.id_tecnico || 0);
          return idTec === this.idTecnico && estadosValidos.includes(o.estado);
        });

        console.log('📦 Órdenes del técnico:', this.ordenes.length);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = '❌ Error al cargar las órdenes. Verifique la conexión.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get ordenesFiltradas(): any[] {
    let resultado = this.ordenes;
    if (this.filtroEstado !== 'TODOS') resultado = resultado.filter(o => o.estado === this.filtroEstado);
    if (this.busqueda?.trim()) {
      const q = this.busqueda.toLowerCase().trim();
      resultado = resultado.filter(o => {
        const ticket = `OT-${o.idOrden}`.toLowerCase();
        const cliente = (o.nombreCliente || o.cliente || '').toLowerCase();
        const equipo = `${o.marca || ''} ${o.modelo || ''}`.toLowerCase();
        const descripcion = (o.descripcion || o.descripcionFalla || '').toLowerCase();
        return ticket.includes(q) || cliente.includes(q) || equipo.includes(q) || descripcion.includes(q) || String(o.idOrden).includes(q);
      });
    }
    return resultado;
  }

  get totalPendientes(): number { return this.ordenes.filter(o => o.estado === 'PENDIENTE').length; }
  get totalEnProceso(): number { return this.ordenes.filter(o => o.estado === 'EN_PROCESO').length; }
  get totalTerminados(): number { return this.ordenes.filter(o => o.estado === 'TERMINADO' || o.estado === 'ENTREGADO').length; }

  textoEstado(estado: string): string {
    const e: Record<string, string> = {
      'PENDIENTE': '⏳ Pendiente',
      'EN_PROCESO': '⚙️ En Proceso',
      'TERMINADO': '✅ Terminado',
      'ENTREGADO': '📦 Entregado'
    };
    return e[estado] || estado || 'Pendiente';
  }

  claseEstado(estado: string): string {
    const c: Record<string, string> = {
      'PENDIENTE': 'pendiente',
      'EN_PROCESO': 'en-proceso',
      'TERMINADO': 'terminado',
      'ENTREGADO': 'terminado'
    };
    return c[estado] || 'pendiente';
  }

  getFecha(orden: any): string {
    const fechaRaw = orden.fechaInicio || orden.fecha_inicio || orden.fechaCreacion || orden.fecha || '';
    if (!fechaRaw) return 'Sin fecha';
    try {
      const fecha = new Date(fechaRaw);
      if (isNaN(fecha.getTime())) return fechaRaw;
      return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return fechaRaw; }
  }

  recargar(): void {
    this.error = '';
    this.exito = '';
    this.cargarOrdenes();
  }
}