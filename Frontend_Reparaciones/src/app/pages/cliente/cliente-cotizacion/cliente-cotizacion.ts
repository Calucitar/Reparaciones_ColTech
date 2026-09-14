import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cliente-cotizacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cliente-cotizacion.html',
  styleUrls: ['./cliente-cotizacion.css']
})
export class ClienteCotizacion implements OnInit {
  
  cotizaciones: any[] = [];
  cargando = false;
  error = '';
  exito = '';
  idCliente = 0;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.idCliente = Number(usuario.idPersona) || 0;
    console.log('ID Cliente:', this.idCliente);
    this.cargarCotizaciones();
  }

  cargarCotizaciones(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (ordenes) => {
        console.log('✅ Órdenes totales:', ordenes?.length);
        
        // Filtrar por cliente
        const misOrdenes = (ordenes || []).filter(o => {
          const idClienteOrden = o.idCliente || o.idPersona || o.id_cliente || 
                                 o.reporte?.idPersona || o.id_persona || 0;
          const coincide = Number(idClienteOrden) === this.idCliente;
          return coincide;
        });

        console.log('📦 Mis órdenes:', misOrdenes.length);
        
        // Mostrar todos los estados para debug
        const estados = misOrdenes.map(o => o.estado);
        console.log('📋 Estados disponibles:', [...new Set(estados)]);
        
        // Mostrar si hay idCotizacion
        const conCotizacion = misOrdenes.filter(o => o.idCotizacion || o.id_cotizacion);
        console.log('💰 Órdenes con idCotizacion:', conCotizacion.length);

        // Filtrar por TODO: idCotizacion O estados de cotización
        this.cotizaciones = misOrdenes
          .filter(o => 
            o.idCotizacion || 
            o.id_cotizacion ||
            o.estado === 'COTIZACION_ENVIADA' || 
            o.estado === 'COTIZACION_APROBADA' || 
            o.estado === 'COTIZACION_RECHAZADA' ||
            o.estado === 'APROBADA' ||
            o.estado === 'RECHAZADA'
          )
          .map(o => ({
            idCotizacion: o.idCotizacion || o.id_cotizacion || o.idOrden,
            idOrden: o.idOrden,
            ticket: 'OT-' + o.idOrden,
            equipo: (o.marca || '') + ' ' + (o.modelo || ''),
            estado: o.estado || 'PENDIENTE',
            total: o.total || 0,
            totalRepuestos: o.totalRepuestos || 0,
            manoObra: o.manoObra || 0,
            fecha: o.fechaInicio || o.fecha_inicio || '',
            descripcion: o.descripcion || o.descripcionFalla || ''
          }));

        console.log('✅ Cotizaciones encontradas:', this.cotizaciones.length);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = '❌ Error al cargar cotizaciones. Verifique la conexión.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  aceptar(id: number): void {
    if (!confirm('¿Aceptar esta cotización? Se procederá con la reparación.')) return;

    this.cargando = true;
    this.cdr.detectChanges();

    this.http.put(`${this.apiUrl}/cotizaciones/${id}/aprobar`, {}).subscribe({
      next: () => {
        this.exito = '✅ Cotización aceptada. El técnico iniciará la reparación.';
        this.cargando = false;
        this.cdr.detectChanges();
        this.cargarCotizaciones();
        setTimeout(() => { this.exito = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = '❌ Error al aceptar la cotización';
        this.cargando = false;
        this.cdr.detectChanges();
        setTimeout(() => { this.error = ''; this.cdr.detectChanges(); }, 5000);
      }
    });
  }

  rechazar(id: number): void {
    if (!confirm('¿Rechazar esta cotización? El equipo será devuelto sin reparación.')) return;

    this.cargando = true;
    this.cdr.detectChanges();

    this.http.put(`${this.apiUrl}/cotizaciones/${id}/rechazar`, {}).subscribe({
      next: () => {
        this.exito = '❌ Cotización rechazada. Se coordinará la devolución del equipo.';
        this.cargando = false;
        this.cdr.detectChanges();
        this.cargarCotizaciones();
        setTimeout(() => { this.exito = ''; this.cdr.detectChanges(); }, 5000);
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = '❌ Error al rechazar la cotización';
        this.cargando = false;
        this.cdr.detectChanges();
        setTimeout(() => { this.error = ''; this.cdr.detectChanges(); }, 5000);
      }
    });
  }

  formatearMonto(monto: number): string {
    if (!monto || monto === 0) return 'S/ 0.00';
    return new Intl.NumberFormat('es-PE', { 
      style: 'currency', 
      currency: 'PEN',
      minimumFractionDigits: 2 
    }).format(monto);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try { 
      return new Date(fecha).toLocaleDateString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      }); 
    } catch { return fecha; }
  }

  recargar(): void {
    this.cargarCotizaciones();
  }
}