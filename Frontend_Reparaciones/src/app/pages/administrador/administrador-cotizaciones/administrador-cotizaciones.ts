import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Cotizacion {
  idCotizacion: number;
  idOrden: number;
  idTecnico: number;
  estado: string;
  totalRepuestos: number;
  manoObra: number;
  total: number;
  notas: string;
  fechaCreacion: string;
  fechaRespuesta: string;
  repuestos: any[];
  trabajos: any[];
  nombreCliente?: string;
  nombreTecnico?: string;
  equipo?: string;
  marca?: string;
  modelo?: string;
  tipoEquipo?: string;
  numeroSerie?: string;
  descripcionFalla?: string;
  ticket?: string;
}

@Component({
  selector: 'app-administrador-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './administrador-cotizaciones.html',
  styleUrls: ['./administrador-cotizaciones.css']
})
export class AdministradorCotizaciones implements OnInit {
  
  cotizaciones: Cotizacion[] = [];
  cotizacionesFiltradas: Cotizacion[] = [];
  cargando = false;
  error = '';
  exito = '';
  
  filtroEstado = 'TODOS';
  busqueda = '';
  
  cotizacionSeleccionada: Cotizacion | null = null;
  mostrarDetalle = false;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCotizaciones();
  }

  cargarCotizaciones(): void {
    this.cargando = true;
    this.error = '';
    this.exito = '';
    this.cdr.detectChanges();

    console.log('🔍 Cargando cotizaciones...');

    this.http.get<any[]>(`${this.apiUrl}/cotizaciones`).subscribe({
      next: (data) => {
        console.log('✅ Cotizaciones recibidas:', data?.length || 0);
        
        if (data && data.length > 0) {
          this.cotizaciones = data.map(c => ({
            idCotizacion: c.idCotizacion || 0,
            idOrden: c.idOrden || 0,
            idTecnico: c.idTecnico || 0,
            estado: this.normalizarEstado(c.estado),
            totalRepuestos: c.totalRepuestos || 0,
            manoObra: c.manoObra || 0,
            total: c.total || 0,
            notas: c.notas || '',
            fechaCreacion: c.fechaCreacion || '',
            fechaRespuesta: c.fechaRespuesta || '',
            repuestos: c.repuestos || [],
            trabajos: c.trabajos || [],
            nombreCliente: c.nombreCliente || 'Sin cliente',
            nombreTecnico: c.nombreTecnico || 'Sin técnico',
            equipo: c.equipo || 'Sin equipo',
            marca: c.marca || '',
            modelo: c.modelo || '',
            tipoEquipo: c.tipoEquipo || '',
            numeroSerie: c.numeroSerie || '',
            descripcionFalla: c.descripcionFalla || '',
            ticket: `OT-${c.idOrden || 0}`
          }));
        } else {
          this.cotizaciones = [];
          console.log('ℹ️ No hay cotizaciones disponibles');
        }
        
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cargar cotizaciones:', err);
        
        if (err.status === 0) {
          this.error = '❌ No se puede conectar al servidor. Verifica que Spring Boot esté corriendo.';
        } else if (err.status === 404) {
          this.error = '❌ Endpoint no encontrado. Verifica la URL de la API.';
        } else {
          this.error = `❌ Error ${err.status}: ${err.message || 'Error desconocido'}`;
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
        
        console.log('🔄 Intentando cargar desde órdenes como fallback...');
        this.cargarDesdeOrdenes();
      }
    });
  }

  cargarDesdeOrdenes(): void {
    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (ordenes) => {
        console.log('📦 Órdenes recibidas:', ordenes?.length);
        
        const cotizacionesMapeadas: Cotizacion[] = (ordenes || [])
          .filter(o => o.idCotizacion || o.id_cotizacion)
          .map(o => ({
            idCotizacion: o.idCotizacion || o.id_cotizacion || 0,
            idOrden: o.idOrden || 0,
            idTecnico: o.idTecnico || o.id_tecnico || 0,
            estado: this.normalizarEstado(o.estadoCotizacion || o.estado || 'PENDIENTE'),
            totalRepuestos: o.totalRepuestos || 0,
            manoObra: o.manoObra || 0,
            total: o.total || 0,
            notas: o.notas || o.notasCotizacion || '',
            fechaCreacion: o.fechaCreacion || o.fechaInicio || '',
            fechaRespuesta: o.fechaRespuesta || '',
            repuestos: o.repuestos || [],
            trabajos: o.trabajos || [],
            nombreCliente: this.extraerNombreCliente(o),
            nombreTecnico: this.extraerNombreTecnico(o),
            equipo: this.extraerEquipo(o),
            marca: o.marca || '',
            modelo: o.modelo || '',
            tipoEquipo: o.tipoEquipo || '',
            numeroSerie: o.numeroSerie || '',
            descripcionFalla: o.descripcionFalla || '',
            ticket: `OT-${o.idOrden || 0}`
          }));
        
        console.log('📊 Cotizaciones mapeadas desde órdenes:', cotizacionesMapeadas.length);
        
        if (cotizacionesMapeadas.length > 0) {
          this.cotizaciones = cotizacionesMapeadas;
          this.aplicarFiltros();
          this.error = '';
          this.exito = '✅ Cotizaciones cargadas correctamente';
          setTimeout(() => this.exito = '', 3000);
        } else {
          this.error = '❌ No se encontraron cotizaciones en el sistema';
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error también al cargar desde órdenes:', err);
        this.error = '❌ Error al cargar las cotizaciones. Verifica la conexión con el servidor.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extraerNombreCliente(o: any): string {
    if (o.cliente?.nombre) {
      return `${o.cliente.nombre} ${o.cliente.apellido || ''}`.trim();
    }
    return o.nombreCliente || o.nombre_cliente || 'Sin cliente';
  }

  private extraerNombreTecnico(o: any): string {
    if (o.tecnico?.nombre) {
      return `${o.tecnico.nombre} ${o.tecnico.apellido || ''}`.trim();
    }
    return o.nombreTecnico || o.nombre_tecnico || 'Sin técnico';
  }

  private extraerEquipo(o: any): string {
    if (o.equipo?.marca) {
      return `${o.equipo.marca} ${o.equipo.modelo || ''}`.trim();
    }
    return o.equipo || `${o.marca || ''} ${o.modelo || ''}`.trim() || 'Sin equipo';
  }

  normalizarEstado(estado: string): string {
    if (!estado) return 'PENDIENTE';
    const estadoUpper = estado.toUpperCase().trim();
    
    if (estadoUpper.includes('PENDIENTE') || estadoUpper.includes('ENVIADA') || estadoUpper.includes('COTIZACION_ENVIADA')) {
      return 'PENDIENTE';
    }
    if (estadoUpper.includes('APROBADA') || estadoUpper.includes('APROBADO') || estadoUpper.includes('COTIZACION_APROBADA')) {
      return 'APROBADA';
    }
    if (estadoUpper.includes('RECHAZADA') || estadoUpper.includes('RECHAZADO')) {
      return 'RECHAZADA';
    }
    return 'PENDIENTE';
  }

  aplicarFiltros(): void {
    this.cotizacionesFiltradas = this.cotizaciones.filter(c => {
      const coincideEstado = this.filtroEstado === 'TODOS' || 
                            c.estado === this.filtroEstado;
      const texto = this.busqueda.toLowerCase().trim();
      const coincideBusqueda = !texto || 
        `OT-${c.idOrden}`.toLowerCase().includes(texto) ||
        `#${c.idCotizacion}`.includes(texto) ||
        (c.nombreCliente || '').toLowerCase().includes(texto) ||
        (c.nombreTecnico || '').toLowerCase().includes(texto) ||
        (c.equipo || '').toLowerCase().includes(texto) ||
        (c.marca || '').toLowerCase().includes(texto) ||
        (c.modelo || '').toLowerCase().includes(texto) ||
        (c.ticket || '').toLowerCase().includes(texto);
      return coincideEstado && coincideBusqueda;
    });
    
    console.log('📊 Cotizaciones filtradas:', this.cotizacionesFiltradas.length);
    this.cdr.detectChanges();
  }

  filtrarPorEstado(estado: string): void {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  verDetalle(cot: Cotizacion): void {
    this.cotizacionSeleccionada = { ...cot };
    this.mostrarDetalle = true;
    this.cdr.detectChanges();
    
    console.log('🔍 Viendo detalle de cotización #' + cot.idCotizacion);
    
    if (cot.idCotizacion > 0) {
      this.http.get<any>(`${this.apiUrl}/cotizaciones/${cot.idCotizacion}`).subscribe({
        next: (data) => {
          console.log('✅ Detalle completo recibido:', data);
          
          if (this.cotizacionSeleccionada && this.cotizacionSeleccionada.idCotizacion === cot.idCotizacion) {
            this.cotizacionSeleccionada = { 
              ...this.cotizacionSeleccionada, 
              repuestos: data.repuestos || cot.repuestos || [],
              trabajos: data.trabajos || cot.trabajos || [],
              totalRepuestos: data.totalRepuestos || cot.totalRepuestos || 0,
              manoObra: data.manoObra || cot.manoObra || 0,
              total: data.total || cot.total || 0,
              notas: data.notas || cot.notas || '',
              fechaCreacion: data.fechaCreacion || cot.fechaCreacion || '',
              fechaRespuesta: data.fechaRespuesta || cot.fechaRespuesta || '',
              estado: this.normalizarEstado(data.estado || cot.estado),
              nombreCliente: data.nombreCliente || cot.nombreCliente || 'Sin cliente',
              nombreTecnico: data.nombreTecnico || cot.nombreTecnico || 'Sin técnico',
              equipo: data.equipo || cot.equipo || 'Sin equipo',
              marca: data.marca || cot.marca || '',
              modelo: data.modelo || cot.modelo || '',
              tipoEquipo: data.tipoEquipo || cot.tipoEquipo || '',
              numeroSerie: data.numeroSerie || cot.numeroSerie || '',
              descripcionFalla: data.descripcionFalla || cot.descripcionFalla || ''
            };
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.warn('⚠️ No se pudo cargar detalle completo:', err);
        }
      });
    }
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.cotizacionSeleccionada = null;
    this.cdr.detectChanges();
  }

  cambiarEstadoCotizacion(nuevoEstado: string): void {
    if (!this.cotizacionSeleccionada) return;
    
    const cot = this.cotizacionSeleccionada;
    const accion = nuevoEstado === 'APROBADA' ? 'aprobar' : 'rechazar';
    
    if (!confirm(`¿Estás seguro de ${accion} la cotización #${cot.idCotizacion}?`)) return;

    const endpoint = `${this.apiUrl}/cotizaciones/${cot.idCotizacion}/${accion}`;
    
    console.log(`🔄 ${accion} cotización #${cot.idCotizacion}...`);
    
    this.http.put(endpoint, {}).subscribe({
      next: (response: any) => {
        this.exito = `✅ Cotización #${cot.idCotizacion} ${accion}da exitosamente`;
        console.log('✅', this.exito, response);
        
        const index = this.cotizaciones.findIndex(c => c.idCotizacion === cot.idCotizacion);
        if (index !== -1) {
          this.cotizaciones[index].estado = nuevoEstado;
          this.cotizaciones[index].fechaRespuesta = new Date().toISOString();
        }
        
        this.aplicarFiltros();
        this.cerrarDetalle();
        
        setTimeout(() => this.exito = '', 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cambiar estado:', err);
        this.error = `❌ Error al ${accion} la cotización: ${err.error?.error || err.message}`;
        setTimeout(() => this.error = '', 5000);
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== ESTADÍSTICAS ====================
  get totalCotizaciones(): number {
    return this.cotizaciones.length;
  }

  get totalPendientes(): number {
    return this.cotizaciones.filter(c => c.estado === 'PENDIENTE').length;
  }

  get totalAprobadas(): number {
    return this.cotizaciones.filter(c => c.estado === 'APROBADA').length;
  }

  get totalRechazadas(): number {
    return this.cotizaciones.filter(c => c.estado === 'RECHAZADA').length;
  }

  get totalMontoAprobado(): number {
    return this.cotizaciones
      .filter(c => c.estado === 'APROBADA')
      .reduce((sum, c) => sum + (c.total || 0), 0);
  }

  // ==================== UTILIDADES ====================
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

  claseEstado(estado: string): string {
    const estadoNormalizado = this.normalizarEstado(estado);
    switch (estadoNormalizado) {
      case 'PENDIENTE': return 'pendiente';
      case 'APROBADA': return 'aprobada';
      case 'RECHAZADA': return 'rechazada';
      default: return 'pendiente';
    }
  }

  textoEstado(estado: string): string {
    const estadoNormalizado = this.normalizarEstado(estado);
    switch (estadoNormalizado) {
      case 'PENDIENTE': return '⏳ Pendiente';
      case 'APROBADA': return '✅ Aprobada';
      case 'RECHAZADA': return '❌ Rechazada';
      default: return estado || 'Desconocido';
    }
  }

  recargar(): void {
    this.cotizacionSeleccionada = null;
    this.mostrarDetalle = false;
    this.error = '';
    this.exito = '';
    this.cdr.detectChanges();
    this.cargarCotizaciones();
  }
}