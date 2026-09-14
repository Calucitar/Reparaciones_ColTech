import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tecnico-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './tecnico-layout.html',
  styleUrls: ['./tecnico-layout.css']
})
export class TecnicoLayout implements OnInit {
  nombreTecnico = 'Técnico';
  tecnicoId: string = '';
  cargando = false; // Iniciar como false para evitar pantalla de carga
  
  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Primero intentar cargar desde localStorage (rápido)
    this.cargarDesdeLocalStorage();
    
    // Luego intentar cargar desde la API (puede fallar sin problema)
    setTimeout(() => {
      this.cargarDatosTecnico();
    }, 500);
  }

  cargarDesdeLocalStorage(): void {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const tecnicoActual = JSON.parse(localStorage.getItem('tecnicoActual') || '{}');
      
      console.log('📦 Datos en localStorage:', { usuario, currentUser, tecnicoActual });
      
      // Intentar obtener nombre de diferentes fuentes
      let nombre = '';
      let apellido = '';
      
      if (usuario.nombre) {
        nombre = usuario.nombre;
        apellido = usuario.apellido || '';
        this.tecnicoId = usuario.idPersona || usuario.id || '';
      } else if (currentUser.nombre) {
        nombre = currentUser.nombre;
        apellido = currentUser.apellido || '';
        this.tecnicoId = currentUser.idPersona || currentUser.id || '';
      } else if (tecnicoActual.nombre) {
        nombre = tecnicoActual.nombre;
        apellido = tecnicoActual.apellido || '';
        this.tecnicoId = tecnicoActual.idPersona || tecnicoActual.id || '';
      }
      
      if (nombre) {
        this.nombreTecnico = `${nombre} ${apellido}`.trim();
        console.log('✅ Nombre desde localStorage:', this.nombreTecnico);
      } else {
        console.warn('⚠️ No se encontró nombre en localStorage');
      }
    } catch (e) {
      console.error('Error al leer localStorage:', e);
    }
  }

  cargarDatosTecnico(): void {
    // Obtener ID del localStorage
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const tecnicoActual = JSON.parse(localStorage.getItem('tecnicoActual') || '{}');
    
    this.tecnicoId = usuario.idPersona || 
                     currentUser.idPersona || 
                     currentUser.id || 
                     tecnicoActual.idPersona || 
                     tecnicoActual.id || 
                     '';

    console.log('🔍 Intentando cargar desde API. ID:', this.tecnicoId);

    if (!this.tecnicoId) {
      console.warn('⚠️ No hay ID de técnico, no se llama a la API');
      return;
    }

    // Intentar diferentes endpoints
    this.cargarDesdeApi(`/tecnicos/${this.tecnicoId}`);
  }

  private cargarDesdeApi(endpoint: string): void {
    console.log('🌐 Llamando a:', `${this.apiUrl}${endpoint}`);
    
    this.http.get<any>(`${this.apiUrl}${endpoint}`).subscribe({
      next: (data) => {
        console.log('✅ Respuesta de la API:', data);
        
        // Intentar obtener nombre de diferentes estructuras
        let nombre = '';
        let apellido = '';
        
        if (data.persona) {
          nombre = data.persona.nombre || data.persona.nombres || '';
          apellido = data.persona.apellido || data.persona.apellidos || '';
        } else if (data.nombre) {
          nombre = data.nombre;
          apellido = data.apellido || '';
        } else if (data.nombres) {
          nombre = data.nombres;
          apellido = data.apellidos || '';
        }
        
        if (nombre) {
          this.nombreTecnico = `${nombre} ${apellido}`.trim();
          console.log('✅ Nombre actualizado desde API:', this.nombreTecnico);
        }
      },
      error: (err) => {
        console.warn('⚠️ No se pudo cargar desde API:', err.status, err.message);
        // No hacemos nada, ya tenemos el nombre desde localStorage
      }
    });
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuario');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tecnicoActual');
    localStorage.removeItem('clienteActual');
    localStorage.removeItem('token');
    
    this.router.navigate(['/login']);
  }
}