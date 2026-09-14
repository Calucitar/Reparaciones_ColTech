import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Solicitud {
  id: number;
  codigo: string;
  equipo: string;
  tipo: string;
  serie: string;
  estado: string;
  fecha: string;
  fechaRaw: string;
  descripcion: string;
  marca: string;
  modelo: string;
  idCliente: string;
}

@Component({
  selector: 'app-cliente-estado',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cliente-estado-solicitud.html',
  styleUrls: ['./cliente-estado-solicitud.css']
})
export class ClienteEstadoSolicitud implements OnInit, OnDestroy {

  solicitudes: Solicitud[] = [];
  cargando = true;
  buscador = '';
  estadoFiltro = '';
  reporteSeleccionado: Solicitud | null = null;

  private apiUrl = 'http://localhost:8080/api';
  private clienteId: string = '';
  private intervaloActualizacion: any;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.clienteId = String(usuario.idPersona ?? '');
  }

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.intervaloActualizacion = setInterval(() => this.cargarSolicitudes(), 30000);
  }

  ngOnDestroy(): void {
    if (this.intervaloActualizacion) clearInterval(this.intervaloActualizacion);
  }

  cargarSolicitudes(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.http.get<any[]>(`${this.apiUrl}/reportes`).subscribe({
      next: (reportes) => {
        const misReportes = this.clienteId
          ? (reportes || []).filter(r => String(r.idPersona ?? '') === this.clienteId)
          : (reportes || []);

        this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
          next: (ordenes) => {
            const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'ENTREGADO'];
            
            this.solicitudes = misReportes.map(r => {
              const orden = (ordenes || []).find(o => {
                const idReporte = o.idReporte || o.id_reporte || o.idTicket || o.id_ticket;
                return idReporte == r.idReporte;
              });

              let estado = r.estado || 'PENDIENTE';
              if (orden && orden.estado && estadosValidos.includes(orden.estado)) {
                estado = orden.estado;
              }

              return {
                id: r.idReporte,
                codigo: 'REP-' + r.idReporte,
                equipo: `${r.marca || ''} ${r.modelo || ''}`.trim() || 'Sin especificar',
                tipo: r.tipoEquipo || 'N/A',
                serie: r.numeroSerie || 'N/A',
                estado: estado,
                fecha: this.formatearFecha(r.fechaReporte),
                fechaRaw: r.fechaReporte,
                descripcion: r.descripcionFalla || '',
                marca: r.marca || '',
                modelo: r.modelo || '',
                idCliente: String(r.idPersona ?? '')
              };
            });

            this.solicitudes.sort((a, b) => new Date(b.fechaRaw).getTime() - new Date(a.fechaRaw).getTime());
            this.cargando = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.solicitudes = misReportes.map(r => ({
              id: r.idReporte, codigo: 'REP-' + r.idReporte,
              equipo: `${r.marca || ''} ${r.modelo || ''}`.trim() || 'Sin especificar',
              tipo: r.tipoEquipo || 'N/A', serie: r.numeroSerie || 'N/A',
              estado: r.estado || 'PENDIENTE',
              fecha: this.formatearFecha(r.fechaReporte), fechaRaw: r.fechaReporte,
              descripcion: r.descripcionFalla || '', marca: r.marca || '', modelo: r.modelo || '',
              idCliente: String(r.idPersona ?? '')
            }));
            this.cargando = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  get solicitudesFiltradas(): Solicitud[] {
    let resultado = [...this.solicitudes];
    const q = this.buscador.toLowerCase().trim();
    if (q) {
      resultado = resultado.filter(s =>
        s.codigo.toLowerCase().includes(q) || s.equipo.toLowerCase().includes(q) ||
        s.marca.toLowerCase().includes(q) || s.modelo.toLowerCase().includes(q) ||
        s.tipo.toLowerCase().includes(q) || s.serie.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q) || s.estado.toLowerCase().includes(q)
      );
    }
    if (this.estadoFiltro) {
      resultado = resultado.filter(s => s.estado === this.estadoFiltro);
    }
    return resultado;
  }

  contarPorEstado(estado: string): number {
    return this.solicitudes.filter(s => s.estado === estado).length;
  }

  limpiarFiltros(): void {
    this.buscador = '';
    this.estadoFiltro = '';
    this.cdr.detectChanges();
  }

  verDetalle(solicitud: Solicitud): void {
    this.reporteSeleccionado = solicitud;
    this.cdr.detectChanges();
  }

  cerrarDetalle(): void {
    this.reporteSeleccionado = null;
    this.cdr.detectChanges();
  }

  getEstadoClase(estado: string): string {
    const clases: Record<string, string> = {
      'PENDIENTE': 'estado-pendiente', 'EN_PROCESO': 'estado-proceso',
      'TERMINADO': 'estado-terminado', 'ENTREGADO': 'estado-entregado',
      'CANCELADO': 'estado-cancelado'
    };
    return clases[estado] || 'estado-pendiente';
  }

  getEstadoIcono(estado: string): string {
    const iconos: Record<string, string> = {
      'PENDIENTE': '⏳', 'EN_PROCESO': '⚙️', 'TERMINADO': '✅',
      'ENTREGADO': '📦', 'CANCELADO': '❌'
    };
    return iconos[estado] || '⏳';
  }

  recargarDatos(): void { this.cargarSolicitudes(); }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatearFechaCompleta(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}