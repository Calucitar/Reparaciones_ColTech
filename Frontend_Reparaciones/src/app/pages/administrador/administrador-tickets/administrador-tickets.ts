import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-administrador-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './administrador-tickets.html',
  styleUrls: ['./administrador-tickets.css']
})
export class AdministradorTickets implements OnInit, OnDestroy {

  mostrarModalOrden = false;
  mostrarModalDetalle = false;
  estadoFiltro = 'Todos';
  busquedaCliente = '';
  ticketsFiltrados: any[] = [];
  tickets: any[] = [];
  tecnicos: any[] = [];
  
  cargando = false;
  cargandoTecnicos = false;
  actualizando = false;
  errorCarga = false;
  mensajeError = '';
  exito = '';

  ticketSeleccionado: any = null;
  ticketDetalle: any = null;
  ordenDetalle: any = null;
  creandoOrden = false;
  errorCrear = '';
  ordenCreada = false;
  idOrdenCreada = '';

  orden = { id_ticket: '', id_tecnico: '' };
  ordenesCreadas: Map<number, number> = new Map();

  private apiUrl = 'http://localhost:8080/api';
  private intervaloActualizacion: any;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarTickets();
    this.cargarTecnicos();
    this.intervaloActualizacion = setInterval(() => this.cargarTickets(), 30000);
  }

  ngOnDestroy(): void {
    if (this.intervaloActualizacion) clearInterval(this.intervaloActualizacion);
  }

  get ticketsPendientes(): number { return this.tickets.filter(t => t.estado === 'PENDIENTE').length; }
  get ticketsEnProceso(): number { return this.tickets.filter(t => t.estado === 'EN_PROCESO').length; }

  cargarTickets() {
    this.cargando = true;
    this.errorCarga = false;
    this.mensajeError = '';
    this.cdr.detectChanges();

    this.http.get<any[]>(`${this.apiUrl}/reportes`).subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.tickets = data.map(r => {
            let nombreCliente = 'Sin cliente';
            if (r.persona?.nombre || r.persona?.nombres) {
              nombreCliente = `${r.persona.nombre || r.persona.nombres || ''} ${r.persona.apellido || r.persona.apellidos || ''}`.trim();
            }
            if (nombreCliente === 'Sin cliente') {
              nombreCliente = r.nombreCliente || r.nombre_cliente || r.cliente || 'Cliente #' + (r.idPersona || 'N/A');
            }
            let fechaFormateada = '';
            const fechaRaw = r.fechaReporte || r.fecha_reporte || r.fechaCreacion || r.fecha;
            if (fechaRaw) {
              try { fechaFormateada = new Date(fechaRaw).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { fechaFormateada = fechaRaw; }
            }
            return {
              id: r.idReporte || r.id_reporte || 0, cliente: nombreCliente, fecha: fechaFormateada || 'Sin fecha',
              estado: r.estado || 'PENDIENTE', descripcion: r.descripcionFalla || r.descripcion_falla || r.descripcion || 'Sin descripción',
              marca: r.marca || '', modelo: r.modelo || '', tipoEquipo: r.tipoEquipo || r.tipo_equipo || '',
              numeroSerie: r.numeroSerie || r.numero_serie || '', idPersona: r.idPersona || r.id_persona
            };
          });
          this.tickets.sort((a, b) => a.id - b.id);
        } else { this.tickets = []; }
        this.cargarOrdenesExistentes();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.errorCarga = true; this.mensajeError = '❌ Error al cargar tickets.';
        this.cargando = false; this.actualizando = false; this.cdr.detectChanges();
      }
    });
  }

  cargarOrdenesExistentes() {
    const estadosValidos = ['PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'ENTREGADO'];
    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (ordenes) => {
        this.ordenesCreadas.clear();
        if (ordenes) {
          ordenes.forEach(ot => {
            const ticketId = ot.idTicket || ot.id_ticket || ot.idReporte || ot.id_reporte;
            const ordenId = ot.idOrden || ot.id_orden;
            if (ticketId && ordenId) this.ordenesCreadas.set(Number(ticketId), Number(ordenId));
            const idx = this.tickets.findIndex(t => t.id == ticketId);
            if (idx !== -1 && ot.estado && estadosValidos.includes(ot.estado)) this.tickets[idx].estado = ot.estado;
          });
        }
        this.filtrarTickets();
        this.cargando = false;
        this.actualizando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('⚠️ Error órdenes:', err);
        this.filtrarTickets();
        this.cargando = false;
        this.actualizando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarTecnicos() {
    this.cargandoTecnicos = true; this.cdr.detectChanges();
    this.http.get<any[]>(`${this.apiUrl}/tecnicos`).subscribe({
      next: (data) => {
        this.tecnicos = (data || []).map(t => {
          let nombre = '';
          if (t.persona?.nombre) nombre = `${t.persona.nombre || ''} ${t.persona.apellido || ''}`.trim();
          else if (t.nombreCompleto) nombre = t.nombreCompleto;
          else nombre = (t.nombre || '') + ' ' + (t.apellido || '');
          return { id: t.idPersona || t.id_persona || t.id, nombreCompleto: nombre.trim() || 'Técnico #' + (t.idPersona || t.id) };
        });
        this.cargandoTecnicos = false; this.cdr.detectChanges();
      },
      error: (err) => { console.error('❌ Error:', err); this.cargandoTecnicos = false; this.cdr.detectChanges(); }
    });
  }

  tieneOrden(ticketId: number): boolean { return this.ordenesCreadas.has(ticketId); }
  getOrdenId(ticketId: number): number | null { return this.ordenesCreadas.get(ticketId) || null; }

  textoEstado(estado: string): string {
    const e: Record<string, string> = { 'PENDIENTE': '⏳ Pendiente', 'EN_PROCESO': '⚙️ En Proceso', 'TERMINADO': '✅ Terminado', 'ENTREGADO': '📦 Entregado' };
    return e[estado] || estado || 'Pendiente';
  }

  filtrarTickets() {
    let r = [...this.tickets];
    if (this.estadoFiltro !== 'Todos') r = r.filter(t => t.estado === this.estadoFiltro);
    if (this.busquedaCliente.trim()) {
      const q = this.busquedaCliente.toLowerCase().trim();
      r = r.filter(t => (t.cliente || '').toLowerCase().includes(q) || (t.marca || '').toLowerCase().includes(q) || (t.modelo || '').toLowerCase().includes(q) || (t.descripcion || '').toLowerCase().includes(q) || String(t.id).includes(q));
    }
    this.ticketsFiltrados = r; this.cdr.detectChanges();
  }

  limpiarBusqueda() { this.busquedaCliente = ''; this.estadoFiltro = 'Todos'; this.filtrarTickets(); }

  abrirModalOrden(ticket: any) {
    this.ticketSeleccionado = ticket; this.orden = { id_ticket: ticket.id, id_tecnico: '' };
    this.creandoOrden = false; this.errorCrear = ''; this.mostrarModalOrden = true; this.cdr.detectChanges();
  }

  cerrarModalOrden() { this.mostrarModalOrden = false; this.ticketSeleccionado = null; this.cdr.detectChanges(); }

  guardarOrden() {
    if (!this.orden.id_tecnico) { this.errorCrear = '⚠️ Seleccione un técnico'; this.cdr.detectChanges(); return; }
    this.creandoOrden = true; this.errorCrear = ''; this.cdr.detectChanges();
    const idReporte = this.ticketSeleccionado.id;
    const ticketId = this.ticketSeleccionado.id;

    this.http.post(`${this.apiUrl}/ordenes-trabajo/crear-desde-reporte/${idReporte}`, {}).subscribe({
      next: (resp: any) => {
        const idOrden = resp.idOrden || resp.id_orden;
        this.http.put(`${this.apiUrl}/ordenes-trabajo/${idOrden}`, { idTecnico: Number(this.orden.id_tecnico), estado: 'EN_PROCESO' }).subscribe({
          next: () => {
            const idx = this.tickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) this.tickets[idx].estado = 'EN_PROCESO';
            this.ordenesCreadas.set(ticketId, idOrden); this.filtrarTickets();
            this.creandoOrden = false; this.mostrarModalOrden = false;
            this.ordenCreada = true; this.idOrdenCreada = String(idOrden);
            this.exito = `✅ Orden OT-${idOrden} creada y técnico asignado`;
            this.cdr.detectChanges();
            setTimeout(() => { this.ordenCreada = false; this.exito = ''; this.cdr.detectChanges(); }, 5000);
          },
          error: () => {
            this.ordenesCreadas.set(ticketId, idOrden);
            const idx = this.tickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) this.tickets[idx].estado = 'EN_PROCESO';
            this.filtrarTickets(); this.creandoOrden = false; this.mostrarModalOrden = false;
            this.ordenCreada = true; this.idOrdenCreada = String(idOrden);
            this.cdr.detectChanges();
            setTimeout(() => { this.ordenCreada = false; this.cdr.detectChanges(); }, 5000);
          }
        });
      },
      error: (err) => { this.creandoOrden = false; this.errorCrear = err.error?.error || '❌ Error al crear la orden'; this.cdr.detectChanges(); }
    });
  }

  abrirModalDetalle(ticket: any) {
    this.ticketDetalle = ticket;
    const idOrden = this.getOrdenId(ticket.id);
    if (idOrden) {
      this.http.get<any>(`${this.apiUrl}/ordenes-trabajo/${idOrden}`).subscribe({
        next: (data) => { this.ordenDetalle = data; this.cdr.detectChanges(); },
        error: () => { this.ordenDetalle = { estado: 'PENDIENTE' }; this.cdr.detectChanges(); }
      });
    } else { this.ordenDetalle = { estado: 'PENDIENTE' }; }
    this.mostrarModalDetalle = true; this.cdr.detectChanges();
  }

  cerrarModalDetalle() { this.mostrarModalDetalle = false; this.ticketDetalle = null; this.ordenDetalle = null; this.cdr.detectChanges(); }

  irAOrdenesTrabajo() { this.router.navigate(['/administrador/orden-trabajo']); }

  getEstadoClass(estado: string): string {
    const m: Record<string, string> = { 'PENDIENTE': 'pendiente', 'EN_PROCESO': 'en-proceso', 'TERMINADO': 'finalizado', 'ENTREGADO': 'finalizado' };
    return m[estado] || 'pendiente';
  }

  recargarDatos() {
    this.actualizando = true;
    this.cargando = true;
    this.exito = '';
    this.ordenCreada = false;
    this.errorCarga = false;
    this.mensajeError = '';
    this.cdr.detectChanges();
    this.cargarTickets();
    this.cargarTecnicos();
  }
}