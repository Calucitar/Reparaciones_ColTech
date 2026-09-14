import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-orden-trabajo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './administrador-orden-trabajo.html',
  styleUrls: ['./administrador-orden-trabajo.css']
})
export class AdministradorOrdenTrabajo implements OnInit, OnDestroy {

  estadoFiltro = 'Todos';
  busquedaCliente = '';
  mostrarModalEditar = false;
  ordenSeleccionada: any = {};
  ordenes: any[] = [];
  tecnicos: any[] = [];
  cargando = false;
  error = '';
  actualizando = false;
  exito = '';

  private apiUrl = 'http://localhost:8080/api';
  private intervaloActualizacion: any;

  // Estados válidos para órdenes de trabajo
  estadosOrden = ['PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'ENTREGADO'];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarDatosIniciales();
    this.iniciarAutoActualizacion();
  }

  ngOnDestroy(): void {
    this.detenerAutoActualizacion();
  }

  iniciarAutoActualizacion(): void {
    this.intervaloActualizacion = setInterval(() => {
      this.cargarOrdenes(false);
    }, 30000);
  }

  detenerAutoActualizacion(): void {
    if (this.intervaloActualizacion) {
      clearInterval(this.intervaloActualizacion);
      this.intervaloActualizacion = null;
    }
  }

  cargarDatosIniciales(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.http.get<any[]>(`${this.apiUrl}/tecnicos`).subscribe({
      next: (data) => {
        this.procesarTecnicos(data || []);
        this.cargarOrdenes(true);
      },
      error: () => {
        this.cargarOrdenes(true);
      }
    });
  }

  recargarTodo(): void {
    if (this.actualizando) return;
    
    this.actualizando = true;
    this.error = '';
    this.exito = '';
    this.cdr.detectChanges();

    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (data) => {
        this.procesarOrdenes(data || []);
        this.actualizando = false;
        this.exito = '✅ Datos actualizados correctamente';
        this.cdr.detectChanges();
        setTimeout(() => { this.exito = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.error = '❌ Error al actualizar. Verifique la conexión.';
        this.actualizando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarOrdenes(mostrarLoader: boolean = true): void {
    if (mostrarLoader) {
      this.cargando = true;
      this.error = '';
      this.cdr.detectChanges();
    }

    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (data) => {
        // Filtrar solo estados de orden de trabajo (NO cotización)
        const ordenesFiltradas = (data || []).filter(o => 
          this.estadosOrden.includes(o.estado)
        );
        console.log('📦 Órdenes de trabajo:', ordenesFiltradas.length);
        this.procesarOrdenes(ordenesFiltradas);
        if (mostrarLoader) {
          this.cargando = false;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = '❌ Error al cargar órdenes';
        if (mostrarLoader) {
          this.cargando = false;
        }
        this.cdr.detectChanges();
      }
    });
  }

  procesarTecnicos(data: any[]): void {
    this.tecnicos = data.map(t => {
      let nombre = '';
      if (t.persona && typeof t.persona === 'object') {
        nombre = (t.persona.nombre || t.persona.nombres || '') + ' ' + 
                 (t.persona.apellido || t.persona.apellidos || '');
      } else if (t.nombreCompleto || t.nombre_completo) {
        nombre = t.nombreCompleto || t.nombre_completo;
      } else {
        nombre = (t.nombre || '') + ' ' + (t.apellido || '');
      }
      return {
        id: t.idPersona || t.id_persona || t.id,
        nombre: nombre.trim() || 'Técnico #' + (t.idPersona || t.id)
      };
    });
  }

  procesarOrdenes(data: any[]): void {
    this.ordenes = data.map(ot => {
      let nombreCliente = '';
      if (ot.nombreCliente || ot.nombre_cliente) {
        nombreCliente = ot.nombreCliente || ot.nombre_cliente;
      } else if (ot.cliente && typeof ot.cliente === 'object') {
        nombreCliente = (ot.cliente.nombre || ot.cliente.nombres || '') + ' ' + 
                       (ot.cliente.apellido || ot.cliente.apellidos || '');
      }
      if (!nombreCliente.trim()) {
        nombreCliente = 'Cliente #' + (ot.idCliente || ot.id_cliente || 'N/A');
      }

      let marcaEquipo = ot.marca || '';
      let modeloEquipo = ot.modelo || '';
      if (!marcaEquipo && ot.equipo && typeof ot.equipo === 'object') {
        marcaEquipo = ot.equipo.marca || '';
        modeloEquipo = ot.equipo.modelo || '';
      }

      let descripcion = ot.descripcion || ot.descripcionFalla || ot.descripcion_falla || '';
      if (!descripcion && ot.reporte && typeof ot.reporte === 'object') {
        descripcion = ot.reporte.descripcion || ot.reporte.descripcionFalla || '';
      }

      const idTecnico = ot.idTecnico || ot.id_tecnico || 
                       (ot.tecnico?.idPersona) || '';
      let nombreTecnico = 'No asignado';
      if (idTecnico) {
        const t = this.tecnicos.find(tec => tec.id == idTecnico);
        nombreTecnico = t ? t.nombre : (ot.nombreTecnico || 'Técnico #' + idTecnico);
      }

      return {
        id: 'OT-' + ot.idOrden,
        idOrden: ot.idOrden,
        ticket: 'TK-' + (ot.reporte?.idReporte || ot.idTicket || 'N/A'),
        cliente: nombreCliente.trim(),
        marca: marcaEquipo,
        modelo: modeloEquipo,
        equipoCompleto: [marcaEquipo, modeloEquipo].filter(Boolean).join(' ') || 'Sin equipo',
        descripcion: descripcion || 'Sin descripción',
        tecnico: nombreTecnico.trim(),
        idTecnico: idTecnico,
        fechaInicio: ot.fechaInicio || ot.fecha_inicio || '',
        fechaFin: ot.fechaFin || ot.fecha_fin || '',
        estado: ot.estado || 'PENDIENTE'
      };
    });

    this.ordenes.sort((a, b) => b.idOrden - a.idOrden);
    console.log('✅ Órdenes procesadas:', this.ordenes.length);
  }

  getEstadoBadge(estado: string): string {
    const badges: Record<string, string> = {
      'PENDIENTE': '⏳ Pendiente',
      'EN_PROCESO': '⚙️ En proceso',
      'TERMINADO': '✅ Terminado',
      'ENTREGADO': '📦 Entregado'
    };
    return badges[estado] || estado;
  }

  getEstadoClass(estado: string): string {
    const clases: Record<string, string> = {
      'PENDIENTE': 'pendiente',
      'EN_PROCESO': 'en-proceso',
      'TERMINADO': 'terminado',
      'ENTREGADO': 'entregado'
    };
    return clases[estado] || '';
  }

  get ordenesFiltradas() {
    let f = this.ordenes;
    const q = this.busquedaCliente.toLowerCase().trim();
    if (q) {
      f = f.filter(o => 
        o.cliente.toLowerCase().includes(q) || 
        o.id.toLowerCase().includes(q) || 
        o.ticket.toLowerCase().includes(q) ||
        o.tecnico.toLowerCase().includes(q) ||
        o.descripcion.toLowerCase().includes(q)
      );
    }
    if (this.estadoFiltro !== 'Todos') {
      f = f.filter(o => o.estado === this.estadoFiltro);
    }
    return f;
  }

  abrirModalEditar(orden: any): void {
    this.ordenSeleccionada = { 
      ...orden,
      _teniaTecnico: !!orden.idTecnico
    };
    this.mostrarModalEditar = true;
    this.cdr.detectChanges();
  }

  cerrarModalEditar(): void {
    this.mostrarModalEditar = false;
    this.cdr.detectChanges();
  }

  guardarCambios(): void {
    if (this.ordenSeleccionada.idTecnico && 
        this.ordenSeleccionada.estado === 'PENDIENTE' &&
        !this.ordenSeleccionada._teniaTecnico) {
      this.ordenSeleccionada.estado = 'EN_PROCESO';
    }
    
    const datos = {
      idTecnico: this.ordenSeleccionada.idTecnico || null,
      estado: this.ordenSeleccionada.estado
    };

    this.http.put(`${this.apiUrl}/ordenes-trabajo/${this.ordenSeleccionada.idOrden}`, datos).subscribe({
      next: () => {
        this.exito = '✅ Cambios guardados correctamente';
        this.cerrarModalEditar();
        this.recargarTodo();
        this.cdr.detectChanges();
        setTimeout(() => { this.exito = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.error = '❌ Error: ' + (err.error?.error || 'No se pudo actualizar');
        this.cdr.detectChanges();
      }
    });
  }

  eliminarOrden(orden: any): void {
    if (!confirm(`¿Estás seguro de eliminar la orden ${orden.id}?\n\nEsta acción no se puede deshacer.`)) return;
    
    this.http.delete(`${this.apiUrl}/ordenes-trabajo/${orden.idOrden}`).subscribe({
      next: () => {
        this.exito = '✅ Orden eliminada correctamente';
        this.recargarTodo();
        this.cdr.detectChanges();
        setTimeout(() => { this.exito = ''; this.cdr.detectChanges(); }, 3000);
      },
      error: (err) => {
        this.error = '❌ Error: ' + (err.error?.error || 'No se pudo eliminar');
        this.cdr.detectChanges();
      }
    });
  }
}