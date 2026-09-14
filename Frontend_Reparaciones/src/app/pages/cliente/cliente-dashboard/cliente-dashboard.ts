import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface SolicitudDashboard {
  id: number;
  codigo: string;
  equipo: string;
  tipo: string;
  estado: string;
  fecha: string;
  descripcion: string;
}

@Component({
  selector: 'app-cliente-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cliente-dashboard.html',
  styleUrls: ['./cliente-dashboard.css']
})
export class ClienteDashboard implements OnInit {

  clienteId: number = 0;
  nombreCliente = signal('Cliente');
  email = signal('Cargando...');
  telefono = signal('Cargando...');
  direccion = signal('Cargando...');
  
  totalSolicitudes = signal(0);
  solicitudesPendientes = signal(0);
  solicitudesEnProceso = signal(0);
  solicitudesTerminadas = signal(0);
  
  ultimasSolicitudes = signal<SolicitudDashboard[]>([]);
  cargando = signal(true);
  errorCarga = signal(false);
  mensajeError = signal('');

  // Computed values
  porcentajeCompletadas = computed(() => {
    const total = this.totalSolicitudes();
    const terminadas = this.solicitudesTerminadas();
    return total > 0 ? Math.round((terminadas / total) * 100) : 0;
  });

  porcentajeEnProceso = computed(() => {
    const total = this.totalSolicitudes();
    const enProceso = this.solicitudesEnProceso();
    return total > 0 ? Math.round((enProceso / total) * 100) : 0;
  });

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.cargarDatosUsuario();
  }

  private cargarDatosUsuario(): void {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      console.log('🔍 Usuario en localStorage:', usuario);
      
      this.clienteId = Number(usuario.idPersona || usuario.id_persona || usuario.id || 0);
      this.nombreCliente.set(usuario.nombre || usuario.nombreCliente || 'Cliente');
      
      console.log('👤 ID Cliente:', this.clienteId);
      
      if (!this.clienteId || this.clienteId === 0) {
        console.warn('⚠️ No se encontró ID de cliente válido');
      }
    } catch (error) {
      console.error('❌ Error al leer localStorage:', error);
      this.clienteId = 0;
    }
  }

  ngOnInit(): void {
    console.log('🚀 Iniciando dashboard...');
    
    if (!this.clienteId || this.clienteId === 0) {
      this.mensajeError.set('No se encontró información del cliente. Por favor, inicia sesión nuevamente.');
      this.errorCarga.set(true);
      this.cargando.set(false);
      return;
    }
    
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    
    console.log('📊 Cargando dashboard para cliente #' + this.clienteId);
    
    // Cargar datos de la persona
    this.http.get<any>(`${this.apiUrl}/personas/${this.clienteId}`).subscribe({
      next: (persona) => {
        console.log('✅ Datos de persona:', persona);
        
        this.email.set(persona.correo || persona.email || 'No disponible');
        this.telefono.set(persona.telefono || 'No disponible');
        this.direccion.set(persona.direccion || 'No disponible');
        this.nombreCliente.set(persona.nombre || this.nombreCliente());
        
        // Actualizar localStorage
        const usuarioActualizado = {
          ...JSON.parse(localStorage.getItem('usuario') || '{}'),
          nombre: persona.nombre,
          correo: persona.correo,
          telefono: persona.telefono,
          direccion: persona.direccion
        };
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
        
        // Cargar reportes
        this.cargarReportes();
      },
      error: (err) => {
        console.warn('⚠️ No se pudo cargar persona, intentando clientes...');
        
        // Intentar con endpoint de clientes
        this.http.get<any>(`${this.apiUrl}/clientes/${this.clienteId}`).subscribe({
          next: (cliente) => {
            console.log('✅ Datos de cliente:', cliente);
            
            const personaData = cliente.persona || {};
            this.email.set(personaData.correo || cliente.correo || 'No disponible');
            this.telefono.set(personaData.telefono || cliente.telefono || 'No disponible');
            this.direccion.set(personaData.direccion || cliente.direccion || 'No disponible');
            this.nombreCliente.set(personaData.nombre || this.nombreCliente());
            
            this.cargarReportes();
          },
          error: (err2) => {
            console.warn('⚠️ Usando datos de localStorage como fallback');
            
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
            this.email.set(usuario.correo || usuario.email || 'No disponible');
            this.telefono.set(usuario.telefono || 'No disponible');
            this.direccion.set(usuario.direccion || 'No disponible');
            
            this.cargarReportes();
          }
        });
      }
    });
  }

  private cargarReportes(): void {
    console.log('🔍 Cargando reportes...');
    
    // También cargar órdenes de trabajo para tener datos más completos
    this.http.get<any[]>(`${this.apiUrl}/ordenes-trabajo`).subscribe({
      next: (ordenes) => {
        console.log('📦 Órdenes totales:', ordenes?.length || 0);
        
        // Filtrar órdenes de este cliente
        const misOrdenes = (ordenes || []).filter(o => {
          const idPersona = Number(o.idPersona || o.id_persona || o.idCliente || o.id_cliente || 
                                   o.reporte?.idPersona || o.reporte?.id_persona || 0);
          return idPersona === this.clienteId;
        });
        
        console.log('📋 Mis órdenes:', misOrdenes.length);
        
        // Estadísticas
        this.totalSolicitudes.set(misOrdenes.length);
        this.solicitudesPendientes.set(
          misOrdenes.filter(o => {
            const estado = (o.estado || '').toUpperCase();
            return estado === 'PENDIENTE' || estado === 'COTIZACION_ENVIADA';
          }).length
        );
        this.solicitudesEnProceso.set(
          misOrdenes.filter(o => {
            const estado = (o.estado || '').toUpperCase();
            return estado.includes('PROCESO') || estado.includes('REPARACION') || 
                   estado.includes('PRUEBAS') || estado === 'COTIZACION_APROBADA';
          }).length
        );
        this.solicitudesTerminadas.set(
          misOrdenes.filter(o => {
            const estado = (o.estado || '').toUpperCase();
            return estado === 'TERMINADO' || estado === 'ENTREGADO' || 
                   estado === 'LISTO_ENTREGA' || estado === 'COMPLETADO';
          }).length
        );
        
        // Últimas solicitudes
        const ultimas = misOrdenes
          .sort((a, b) => {
            const fechaA = new Date(b.fechaInicio || b.fecha_inicio || 0).getTime();
            const fechaB = new Date(a.fechaInicio || a.fecha_inicio || 0).getTime();
            return fechaA - fechaB;
          })
          .slice(0, 5)
          .map(o => ({
            id: o.idOrden || 0,
            codigo: 'OT-' + (o.idOrden || 0),
            equipo: o.equipo || `${o.marca || ''} ${o.modelo || ''}`.trim() || 'Sin especificar',
            tipo: o.tipoEquipo || o.tipo_equipo || 'N/A',
            estado: o.estado || 'PENDIENTE',
            fecha: this.formatearFecha(o.fechaInicio || o.fecha_inicio || o.fechaCreacion),
            descripcion: o.descripcion || o.descripcionFalla || o.descripcion_falla || 'Sin descripción'
          }));
        
        this.ultimasSolicitudes.set(ultimas);
        this.cargando.set(false);
        
        console.log('✅ Dashboard cargado');
        console.log('📊 Total:', this.totalSolicitudes());
        console.log('📊 Pendientes:', this.solicitudesPendientes());
        console.log('📊 En proceso:', this.solicitudesEnProceso());
        console.log('📊 Terminadas:', this.solicitudesTerminadas());
        console.log('📊 % Completado:', this.porcentajeCompletadas());
      },
      error: (err) => {
        console.error('❌ Error al cargar órdenes:', err);
        
        if (err.status === 0) {
          this.mensajeError.set('No se puede conectar con el servidor.');
        } else {
          this.mensajeError.set('Error al cargar los datos.');
        }
        
        this.errorCarga.set(true);
        this.cargando.set(false);
      }
    });
  }

  verSolicitud(id: number): void {
    this.router.navigate(['/cliente/solicitud', id]);
  }

  verTodasSolicitudes(): void {
    this.router.navigate(['/cliente/solicitudes']);
  }

  nuevaSolicitud(): void {
    this.router.navigate(['/cliente/nueva-solicitud']);
  }

  getEstadoClase(estado: string): string {
    const estadoUpper = (estado || '').toUpperCase();
    if (estadoUpper.includes('PENDIENTE') || estadoUpper.includes('COTIZACION_ENVIADA')) return 'estado-pendiente';
    if (estadoUpper.includes('PROCESO') || estadoUpper.includes('REPARACION') || estadoUpper.includes('APROBADA')) return 'estado-proceso';
    if (estadoUpper.includes('TERMINADO') || estadoUpper.includes('LISTO')) return 'estado-terminado';
    if (estadoUpper.includes('ENTREGADO') || estadoUpper.includes('COMPLETADO')) return 'estado-entregado';
    return 'estado-pendiente';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) return fecha;
      return fechaObj.toLocaleDateString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  }

  recargarDashboard(): void {
    this.cargarDashboard();
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}