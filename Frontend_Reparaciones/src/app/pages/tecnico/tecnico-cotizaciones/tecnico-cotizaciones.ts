import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-tecnico-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnico-cotizaciones.html',
  styleUrls: ['./tecnico-cotizaciones.css']
})
export class TecnicoCotizaciones implements OnInit {
  
  ordenes: any[] = [];
  ordenSeleccionada: any = null;
  diagnostico: any = null;
  cargando = true;
  cargandoDiagnostico = false;
  procesando = false;
  error = '';
  exito = '';
  idTecnico = 0;
  manoObra = 0;
  notas = '';
  repuestos: any[] = [];
  trabajos: any[] = [];
  nuevoRepuesto = { nombre: '', cantidad: 1, precioUnitario: 0 };
  nuevoTrabajo = { descripcion: '', costo: 0 };

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.idTecnico = Number(usuario.idPersona || usuario.id || 0);
    console.log('🔧 ID Técnico:', this.idTecnico);
    
    if (this.idTecnico > 0) this.cargarOrdenes();
    else { this.cargando = false; this.error = '❌ No se pudo identificar al técnico.'; this.cdr.detectChanges(); }
  }

  cargarOrdenes(): void {
    this.cargando = true; this.error = ''; this.cdr.detectChanges();

    forkJoin({
      ordenes: this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).pipe(catchError(() => of([]))),
      cotizaciones: this.http.get<any[]>(`${this.apiUrl}/cotizaciones`).pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ ordenes, cotizaciones }) => {
        const idsConCotizacion = new Set(cotizaciones.map(c => Number(c.idOrden || c.id_orden)));
        
        this.ordenes = (ordenes || []).filter(o => {
          const idTec = Number(o.idTecnico || o.tecnico?.idPersona || o.id_tecnico || 0);
          return idTec === this.idTecnico && !idsConCotizacion.has(Number(o.idOrden || o.id_orden));
        }).map(o => ({
          idOrden: o.idOrden || o.id_orden,
          ticket: 'OT-' + (o.idOrden || o.id_orden),
          cliente: this.obtenerCliente(o),
          equipo: `${o.marca || ''} ${o.modelo || ''}`.trim(),
          marca: o.marca || '', modelo: o.modelo || '',
          descripcion: o.descripcion || o.descripcionFalla || '',
          estado: o.estado || 'PENDIENTE'
        }));

        console.log('📦 Órdenes disponibles:', this.ordenes.length);
        this.cargando = false; this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = '❌ Error al cargar órdenes.'; this.cargando = false; this.cdr.detectChanges();
      }
    });
  }

  private obtenerCliente(o: any): string {
    if (o.nombreCliente) return o.nombreCliente;
    if (o.cliente?.persona?.nombre) return `${o.cliente.persona.nombre} ${o.cliente.persona.apellido || ''}`.trim();
    if (o.cliente?.nombreCompleto) return o.cliente.nombreCompleto;
    if (o.cliente?.nombre) return o.cliente.nombre;
    return o.idCliente ? `Cliente #${o.idCliente}` : 'Sin cliente';
  }

  onOrdenChange(orden: any): void {
    console.log('📋 Orden seleccionada:', orden?.idOrden);
    this.ordenSeleccionada = orden;
    this.resetearFormulario();
    if (!this.ordenSeleccionada?.idOrden) return;
    this.cargarDiagnostico(this.ordenSeleccionada.idOrden);
  }

  cerrarModal(): void {
    this.ordenSeleccionada = null;
    this.resetearFormulario();
    this.cdr.detectChanges();
  }

  private resetearFormulario(): void {
    this.diagnostico = null;
    this.repuestos = [];
    this.trabajos = [];
    this.manoObra = 0;
    this.notas = '';
    this.error = '';
    this.exito = '';
    this.cdr.detectChanges();
  }

  cargarDiagnostico(idOrden: number): void {
    this.cargandoDiagnostico = true; this.cdr.detectChanges();
    
    this.http.get<any[]>(`${this.apiUrl}/evaluaciones`).pipe(catchError(() => of([]))).subscribe({
      next: (evaluaciones) => {
        const encontrada = (evaluaciones || []).find(e => {
          const idEval = Number(e.orden_trabajo_id || e.ordenTrabajoId || e.idOrden || e.id_orden || 0);
          return idEval === idOrden;
        });
        
        if (encontrada) {
          this.diagnostico = {
            procesador: encontrada.procesador || 'No especificado',
            ram: encontrada.ram || 'No especificada',
            almacenamiento: encontrada.almacenamiento || 'No especificado',
            sistema_operativo: encontrada.sistema_operativo || encontrada.sistemaOperativo || 'No especificado',
            detalles_revision: encontrada.detalles_revision || encontrada.detallesRevision || '',
          };
        }
        this.cargandoDiagnostico = false; this.cdr.detectChanges();
      },
      error: () => { this.cargandoDiagnostico = false; this.cdr.detectChanges(); }
    });
  }

  // ==================== REPUESTOS ====================
  agregarRepuesto(): void {
    const nombre = this.nuevoRepuesto.nombre.trim();
    const cantidad = this.nuevoRepuesto.cantidad;
    const precio = this.nuevoRepuesto.precioUnitario;

    if (!nombre) { this.error = '⚠️ Ingrese el nombre del repuesto.'; this.cdr.detectChanges(); return; }
    if (cantidad <= 0) { this.error = '⚠️ La cantidad debe ser mayor a 0.'; this.cdr.detectChanges(); return; }
    if (precio <= 0) { this.error = '⚠️ El precio debe ser mayor a 0.'; this.cdr.detectChanges(); return; }

    this.repuestos.push({ nombre, cantidad, precioUnitario: precio });
    this.nuevoRepuesto = { nombre: '', cantidad: 1, precioUnitario: 0 };
    this.error = '';
    console.log('🔩 Repuesto agregado. Total repuestos:', this.repuestos.length, '| Suma:', this.totalRepuestos);
    this.cdr.detectChanges();
  }

  quitarRepuesto(index: number): void {
    this.repuestos.splice(index, 1);
    this.cdr.detectChanges();
  }

  get totalRepuestos(): number {
    return this.repuestos.reduce((sum, r) => sum + (r.cantidad * r.precioUnitario), 0);
  }

  // ==================== TRABAJOS ====================
  agregarTrabajo(): void {
    const descripcion = this.nuevoTrabajo.descripcion.trim();
    const costo = Number(this.nuevoTrabajo.costo);

    console.log('🛠️ Intentando agregar trabajo:', { descripcion, costo });

    if (!descripcion) { this.error = '⚠️ Ingrese la descripción del trabajo.'; this.cdr.detectChanges(); return; }
    if (costo <= 0) { this.error = '⚠️ El costo debe ser mayor a 0.'; this.cdr.detectChanges(); return; }

    this.trabajos.push({ descripcion, costo });
    this.nuevoTrabajo = { descripcion: '', costo: 0 };
    this.error = '';
    console.log('🛠️ Trabajo agregado. Total trabajos:', this.trabajos.length, '| Suma:', this.totalTrabajos);
    this.cdr.detectChanges();
  }

  quitarTrabajo(index: number): void {
    this.trabajos.splice(index, 1);
    this.cdr.detectChanges();
  }

  get totalTrabajos(): number {
    return this.trabajos.reduce((sum, t) => sum + (t.costo || 0), 0);
  }

  // ==================== TOTALES ====================
  get subtotal(): number {
    return this.totalRepuestos + this.totalTrabajos + (this.manoObra || 0);
  }

  get total(): number {
    return this.subtotal;
  }

  // ==================== ENVIAR COTIZACIÓN ====================
  enviarCotizacion(): void {
    if (!this.ordenSeleccionada?.idOrden) { this.error = '⚠️ Seleccione una orden.'; this.cdr.detectChanges(); return; }
    
    if (this.repuestos.length === 0 && this.trabajos.length === 0 && (this.manoObra || 0) <= 0) {
      this.error = '⚠️ Agregue al menos un repuesto, trabajo o mano de obra.'; this.cdr.detectChanges(); return;
    }

    this.procesando = true; this.error = ''; this.cdr.detectChanges();

    const datos = {
      idOrden: this.ordenSeleccionada.idOrden,
      idTecnico: this.idTecnico,
      manoObra: this.manoObra || 0,
      notas: this.notas.trim(),
      repuestos: this.repuestos.map(r => ({
        nombre: r.nombre,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario
      })),
      trabajos: this.trabajos.map(t => ({
        descripcion: t.descripcion,
        costo: t.costo
      }))
    };

    console.log('📤 Enviando cotización:', JSON.stringify(datos, null, 2));

    this.http.post(`${this.apiUrl}/cotizaciones`, datos).subscribe({
      next: (resp) => {
        console.log('✅ Cotización creada:', resp);
        this.exito = '✅ Cotización enviada correctamente.';
        this.procesando = false; this.cdr.detectChanges();
        setTimeout(() => { this.exito = ''; this.cerrarModal(); this.cargarOrdenes(); this.cdr.detectChanges(); }, 2000);
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.error = '❌ Error al enviar la cotización.';
        this.procesando = false; this.cdr.detectChanges();
        setTimeout(() => { this.error = ''; this.cdr.detectChanges(); }, 5000);
      }
    });
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(monto || 0);
  }

  recargar(): void {
    this.ordenSeleccionada = null;
    this.resetearFormulario();
    this.cargarOrdenes();
  }
}