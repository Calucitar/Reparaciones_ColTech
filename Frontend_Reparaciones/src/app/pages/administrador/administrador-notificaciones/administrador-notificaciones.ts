import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Notificacion {
  id: number;
  tipo: 'pago' | 'reparacion' | 'usuario' | 'ticket';
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  leido: boolean;
  idReferencia: number;
}

@Component({
  selector: 'app-notificaciones-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './administrador-notificaciones.html',
  styleUrls: ['./administrador-notificaciones.css']
})
export class AdministradorNotificaciones implements OnInit {
  
  notificaciones: Notificacion[] = [];
  cargando = false;
  error = '';
  exito = '';
  noLeidas = 0;
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    console.log('🔍 Cargando notificaciones...');

    this.http.get<any[]>(`${this.apiUrl}/notificaciones`).subscribe({
      next: (data) => {
        console.log('✅ Notificaciones recibidas:', data?.length || 0);
        
        if (data && data.length > 0) {
          this.notificaciones = data.map(n => ({
            id: n.id || 0,
            tipo: this.mapearTipo(n.tipo),
            titulo: n.titulo || '',
            descripcion: n.descripcion || '',
            fecha: n.fecha || 'Hoy',
            hora: n.hora || '',
            leido: n.leido || false,
            idReferencia: n.idReferencia || 0
          }));
          
          this.noLeidas = this.notificaciones.filter(n => !n.leido).length;
          console.log('📊 Notificaciones no leídas:', this.noLeidas);
        } else {
          this.notificaciones = [];
          this.noLeidas = 0;
          console.log('ℹ️ No hay notificaciones');
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cargar notificaciones:', err);
        
        if (err.status === 0) {
          this.error = '❌ No se puede conectar al servidor';
        } else {
          this.error = '❌ Error al cargar notificaciones';
        }
        
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapearTipo(tipo: string): 'pago' | 'reparacion' | 'usuario' | 'ticket' {
    if (!tipo) return 'ticket';
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('pago')) return 'pago';
    if (tipoLower.includes('reparacion') || tipoLower.includes('tecnico')) return 'reparacion';
    if (tipoLower.includes('usuario')) return 'usuario';
    return 'ticket';
  }

  marcarComoLeida(id: number): void {
    this.http.put(`${this.apiUrl}/notificaciones/${id}/leer`, {}).subscribe({
      next: () => {
        const noti = this.notificaciones.find(n => n.id === id);
        if (noti) {
          noti.leido = true;
          this.noLeidas = this.notificaciones.filter(n => !n.leido).length;
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Error al marcar como leída:', err)
    });
  }

  marcarTodasComoLeidas(): void {
    this.http.put(`${this.apiUrl}/notificaciones/leer-todas`, {}).subscribe({
      next: () => {
        this.notificaciones.forEach(n => n.leido = true);
        this.noLeidas = 0;
        this.exito = '✅ Todas las notificaciones marcadas como leídas';
        setTimeout(() => this.exito = '', 3000);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error:', err)
    });
  }

  getIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'pago': return '💳';
      case 'reparacion': return '⚠️';
      case 'ticket': return '🔄';
      case 'usuario': return '👥';
      default: return '📌';
    }
  }

  getClaseIcono(tipo: string): string {
    switch (tipo) {
      case 'pago': return 'icono-pago';
      case 'reparacion': return 'icono-tecnico';
      case 'ticket': return 'icono-ticket';
      case 'usuario': return 'icono-usuario';
      default: return 'icono-ticket';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    if (fecha === 'Hoy' || fecha === 'Ayer') return fecha;
    try {
      const fechaObj = new Date(fecha);
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      
      if (fechaObj.toDateString() === hoy.toDateString()) return 'Hoy';
      if (fechaObj.toDateString() === ayer.toDateString()) return 'Ayer';
      
      return fechaObj.toLocaleDateString('es-PE', { 
        day: '2-digit', 
        month: 'short'
      });
    } catch {
      return fecha;
    }
  }

  recargar(): void {
    this.cargarNotificaciones();
  }
}