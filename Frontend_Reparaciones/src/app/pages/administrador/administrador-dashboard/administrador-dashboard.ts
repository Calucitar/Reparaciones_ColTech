import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-administrador-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './administrador-dashboard.html',
  styleUrls: ['./administrador-dashboard.css']
})
export class AdministradorDashboard implements OnInit {

  estadisticas = {
    reparaciones: 0,
    pendientes: 0,
    ingresos: 0,
    clientes: 0,
    tecnicos: 0
  };

  ultimasReparaciones: any[] = [];
  cargando = true;
  error = '';

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();
    console.log('📊 Cargando dashboard desde la BD...');

    // 1. Cargar órdenes de trabajo (BD: orden_trabajo)
    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (ordenes) => {
        console.log('✅ Órdenes cargadas:', ordenes?.length || 0);
        
        // Estadísticas
        this.estadisticas.reparaciones = ordenes?.length || 0;
        this.estadisticas.pendientes = (ordenes || []).filter(o => 
          o.estado === 'PENDIENTE' || o.estado === 'COTIZACION_ENVIADA'
        ).length;

        // Últimas 10 reparaciones
        this.ultimasReparaciones = (ordenes || [])
          .sort((a, b) => new Date(b.fechaInicio || 0).getTime() - new Date(a.fechaInicio || 0).getTime())
          .slice(0, 10)
          .map(orden => ({
            id: orden.idOrden || 0,
            ticket: 'OT-' + (orden.idOrden || 0),
            cliente: orden.nombreCliente || 'Sin cliente',
            equipo: orden.equipo || (orden.marca || '') + ' ' + (orden.modelo || '') || 'Sin equipo',
            estado: this.mapearEstado(orden.estado),
            tecnico: orden.nombreTecnico || 'No asignado',
            fecha: orden.fechaInicio || new Date()
          }));

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cargar órdenes:', err);
        this.error = '❌ Error al conectar con el servidor';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });

    // 2. Ingresos desde cotizaciones aprobadas (BD: cotizaciones)
    this.http.get<any[]>(`${this.apiUrl}/cotizaciones`).subscribe({
      next: (cotizaciones) => {
        this.estadisticas.ingresos = (cotizaciones || [])
          .filter(c => c.estado === 'APROBADA')
          .reduce((sum, c) => sum + (c.total || 0), 0);
        console.log('💰 Ingresos cotizaciones aprobadas: S/.' + this.estadisticas.ingresos);
        this.cdr.detectChanges();
      },
      error: () => console.log('⚠️ No se cargaron cotizaciones')
    });

    // 3. Ingresos desde pagos (BD: pagos)
    this.http.get<any[]>(`${this.apiUrl}/pagos`).subscribe({
      next: (pagos) => {
        const ingresosPagos = (pagos || [])
          .filter(p => p.estado === 'APROBADO' || p.estado === 'PAGADO')
          .reduce((sum, p) => sum + (p.monto || 0), 0);
        
        // Sumar ingresos de pagos a los de cotizaciones
        this.estadisticas.ingresos += ingresosPagos;
        console.log('💳 Ingresos pagos: S/.' + ingresosPagos);
        console.log('💰 Ingresos totales: S/.' + this.estadisticas.ingresos);
        this.cdr.detectChanges();
      },
      error: () => console.log('⚠️ No se cargaron pagos')
    });

    // 4. Total clientes (BD: persona)
    this.http.get<any[]>(`${this.apiUrl}/personas`).subscribe({
      next: (data) => {
        this.estadisticas.clientes = data?.length || 0;
        console.log('👥 Clientes registrados:', this.estadisticas.clientes);
        this.cdr.detectChanges();
      },
      error: () => console.log('⚠️ No se cargaron personas')
    });

    // 5. Total técnicos (BD: tecnico)
    this.http.get<any[]>(`${this.apiUrl}/tecnicos`).subscribe({
      next: (data) => {
        this.estadisticas.tecnicos = data?.length || 0;
        console.log('🔧 Técnicos activos:', this.estadisticas.tecnicos);
        this.cdr.detectChanges();
      },
      error: () => console.log('⚠️ No se cargaron técnicos')
    });
  }

  mapearEstado(estado: string): string {
    if (!estado) return 'Pendiente';
    const e = estado.toUpperCase();
    if (e.includes('PENDIENTE')) return 'Pendiente';
    if (e.includes('COTIZACION_ENVIADA')) return 'Cotización Enviada';
    if (e.includes('COTIZACION_APROBADA')) return 'Cotización Aprobada';
    if (e.includes('COTIZACION_RECHAZADA')) return 'Cotización Rechazada';
    if (e.includes('REPARACION') || e.includes('PROCESO')) return 'En Reparación';
    if (e.includes('PRUEBAS')) return 'En Pruebas';
    if (e.includes('LISTO') || e.includes('TERMINADO')) return 'Listo para Entrega';
    if (e.includes('ENTREGADO')) return 'Entregado';
    if (e.includes('DEVUELTO')) return 'Devuelto';
    return estado;
  }

  getEstadoClass(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('pendiente') || e.includes('enviada')) return 'pendiente';
    if (e.includes('proceso') || e.includes('reparacion') || e.includes('pruebas') || e.includes('aprobada')) return 'proceso';
    if (e.includes('terminado') || e.includes('entregado') || e.includes('listo')) return 'terminado';
    if (e.includes('rechazada') || e.includes('devuelto')) return 'cancelado';
    return 'pendiente';
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'PEN',
      minimumFractionDigits: 2 
    }).format(monto || 0);
  }

  recargar(): void {
    this.cdr.detectChanges();
    this.cargarDashboard();
  }
}