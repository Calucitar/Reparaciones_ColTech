import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-evaluaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnico-evaluacion-equipos.html',
  styleUrls: ['./tecnico-evaluacion-equipos.css']
})
export class TecnicoEvaluacionEquipos implements OnInit {
  
  tickets: any[] = [];
  ticketsFiltrados: any[] = [];
  ticketSeleccionado: any = null;
  guardado = false;
  error = '';
  exito = '';
  cargando = false;
  procesando = false;
  busqueda = '';
  
  evaluacion = {
    procesador: '', ram: '', almacenamiento: '',
    sistemaOperativo: '', detallesRevision: ''
  };
  
  private apiUrl = 'http://localhost:8080/api';
  idTecnico: number = 0;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.obtenerIdTecnico();
    if (this.idTecnico > 0) this.cargarOrdenes();
    else {
      this.cargando = false;
      this.error = '❌ No se pudo identificar al técnico.';
      this.cdr.detectChanges();
    }
  }

  obtenerIdTecnico(): void {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      this.idTecnico = Number(usuario.idPersona || usuario.id || 0);
    } catch (e) { this.idTecnico = 0; }
    console.log('🔧 ID Técnico:', this.idTecnico);
  }

  cargarOrdenes(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    forkJoin({
      ordenes: this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).pipe(
        catchError((err) => {
          console.error('❌ Error al cargar órdenes:', err);
          return of([]);
        })
      ),
      evaluaciones: this.http.get<any[]>(`${this.apiUrl}/evaluaciones`).pipe(
        catchError((err) => {
          console.error('❌ Error al cargar evaluaciones:', err);
          return of([]);
        })
      )
    }).subscribe({
      next: ({ ordenes, evaluaciones }) => {
        console.log('✅ Órdenes:', ordenes?.length, '| Evaluaciones:', evaluaciones?.length);

        const idsConEvaluacion = new Set<number>();
        evaluaciones.forEach(e => {
          const idOrden = Number(e.orden_trabajo_id || e.ordenTrabajoId || e.idOrden || e.id_orden || 0);
          if (idOrden > 0) idsConEvaluacion.add(idOrden);
        });

        const delTecnico = (ordenes || []).filter(o => {
          const idTec = Number(o.idTecnico || o.tecnico?.idPersona || o.id_tecnico || 0);
          return idTec === this.idTecnico;
        });

        this.tickets = delTecnico
          .filter(o => !idsConEvaluacion.has(Number(o.idOrden || o.id_orden)))
          .map(o => ({
            id: o.idOrden || o.id_orden,
            ticket: 'OT-' + (o.idOrden || o.id_orden),
            cliente: this.obtenerCliente(o),
            equipo: `${o.marca || ''} ${o.modelo || ''}`.trim(),
            marca: o.marca || '', modelo: o.modelo || '',
            estado: o.estado || 'PENDIENTE',
            descripcion: o.descripcion || o.descripcionFalla || '',
            fechaInicio: o.fechaInicio || o.fecha_inicio || ''
          }));

        this.ticketsFiltrados = [...this.tickets];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error general:', err);
        this.error = '❌ Error al cargar las órdenes. Verifique la conexión.';
        this.cargando = false;
        this.cdr.detectChanges();
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

  seleccionarParaEvaluar(ticket: any): void {
    this.ticketSeleccionado = ticket;
    this.guardado = false;
    this.error = '';
    this.exito = '';
    this.evaluacion = { procesador: '', ram: '', almacenamiento: '', sistemaOperativo: '', detallesRevision: '' };
    this.cdr.detectChanges();
  }

  cerrarEvaluacion(): void {
    this.ticketSeleccionado = null;
    this.error = '';
    this.guardado = false;
    this.cdr.detectChanges();
  }

  guardarEvaluacion(): void {
    if (!this.ticketSeleccionado) {
      this.error = '⚠️ Selecciona una orden de trabajo.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.evaluacion.detallesRevision?.trim()) {
      this.error = '⚠️ Los detalles de revisión son obligatorios.';
      this.cdr.detectChanges();
      return;
    }

    this.procesando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.http.post(`${this.apiUrl}/evaluaciones`, {
      orden_trabajo_id: this.ticketSeleccionado.id,
      tecnico_id: this.idTecnico,
      procesador: this.evaluacion.procesador || '',
      ram: this.evaluacion.ram || '',
      almacenamiento: this.evaluacion.almacenamiento || '',
      sistema_operativo: this.evaluacion.sistemaOperativo || '',
      detalles_revision: this.evaluacion.detallesRevision.trim(),
      fecha_evaluacion: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.guardado = true;
        this.exito = '✅ Evaluación guardada correctamente.';
        this.procesando = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.exito = '';
          this.ticketSeleccionado = null;
          this.cargarOrdenes();
          this.cdr.detectChanges();
        }, 2000);
      },
      error: (err) => {
        console.error('❌ Error:', err);
        let mensaje = '❌ Error al guardar la evaluación.';
        if (err.status === 409) mensaje = '❌ Ya existe una evaluación para esta orden.';
        else if (err.status === 0) mensaje = '❌ No se puede conectar al servidor.';
        this.error = mensaje;
        this.procesando = false;
        this.cdr.detectChanges();
        setTimeout(() => { this.error = ''; this.cdr.detectChanges(); }, 5000);
      }
    });
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try { return new Date(fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return fecha; }
  }
}