import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './administrador-usuarios.html',
  styleUrls: ['./administrador-usuarios.css']
})
export class AdministradorUsuarios implements OnInit {

  buscador: string = '';
  mostrarOpciones = false;
  tipoUsuario = '';
  mostrarModal = false;
  filtroRol: string = '';

  usuarios: any[] = [];
  cargando = true;
  error = '';

  totalClientes = 0;
  totalTecnicos = 0;
  totalAdministradores = 0;

  buscandoDni = false;
  guardandoUsuario = false;

  nuevoUsuario = {
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    dni: '',
    contrasena: '123456'
  };

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // ==================== CARGAR USUARIOS ====================
  cargarUsuarios(): void {
    this.cargando = true;
    this.error = '';
    this.cdr.detectChanges();

    this.http.get<any[]>(`${this.apiUrl}/admin/usuarios`).subscribe({
      next: (data) => {
        console.log('✅ Usuarios cargados:', data?.length);
        
        this.usuarios = (data || []).map(u => ({
          id: u.idPersona,
          nombre: u.nombre || '',
          apellido: u.apellido || '',
          correo: u.correo || '',
          telefono: u.telefono || '',
          dni: u.dni || '',
          rol: u.rol || 'CLIENTE',
          estado: u.estado === 1 ? 'Activo' : 'Inactivo'
        }));

        this.actualizarContadores();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al cargar usuarios:', err);
        this.error = 'Error al cargar usuarios. ¿Backend corriendo?';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private actualizarContadores(): void {
    this.totalClientes = this.usuarios.filter(u => u.rol === 'CLIENTE').length;
    this.totalTecnicos = this.usuarios.filter(u => u.rol === 'TECNICO' || u.rol === 'TÉCNICO').length;
    this.totalAdministradores = this.usuarios.filter(u => u.rol === 'ADMINISTRADOR' || u.rol === 'ADMIN').length;
  }

  // ==================== ROLES ====================
  getRolTexto(rol: string): string {
    switch(rol) {
      case 'ADMINISTRADOR':
      case 'ADMIN':
        return '🛡️ Administrador';
      case 'TECNICO':
      case 'TÉCNICO':
        return '🔧 Técnico';
      case 'CLIENTE':
        return '👤 Cliente';
      default:
        return rol;
    }
  }

  // ==================== FILTROS ====================
  filtrarPorRol(rol: string): void {
    this.filtroRol = rol;
  }

  get usuariosFiltrados(): any[] {
    return this.usuarios.filter(u => {
      const nombreCompleto = `${u.nombre} ${u.apellido}`.toLowerCase();
      const q = this.buscador.toLowerCase().trim();
      const coincideBusqueda = !q || 
        nombreCompleto.includes(q) || 
        (u.correo || '').toLowerCase().includes(q) || 
        (u.dni || '').includes(q);
      
      const coincideRol = !this.filtroRol || u.rol === this.filtroRol;
      return coincideBusqueda && coincideRol;
    });
  }

  // ==================== MODAL CREAR USUARIO ====================
  abrirModal(tipo: string): void {
    this.tipoUsuario = tipo;
    this.mostrarModal = true;
    this.mostrarOpciones = false;
    this.limpiarFormulario();
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.tipoUsuario = '';
    this.guardandoUsuario = false;
    this.cdr.detectChanges();
  }

  limpiarFormulario(): void {
    this.nuevoUsuario = {
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      dni: '',
      contrasena: '123456'
    };
    this.buscandoDni = false;
  }

  // ==================== BÚSQUEDA DNI ====================
  onDniChange(): void {
    this.nuevoUsuario.nombre = '';
    this.nuevoUsuario.apellido = '';
    if (this.nuevoUsuario.dni.length === 8) {
      this.buscarDniReniec();
    }
  }

  buscarDniReniec(): void {
    if (!this.nuevoUsuario.dni || this.nuevoUsuario.dni.length !== 8) return;
    this.buscandoDni = true;
    this.cdr.detectChanges();

    this.http.get<any>(`${this.apiUrl}/reniec/dni/${this.nuevoUsuario.dni}`).subscribe({
      next: (resp: any) => {
        const data = resp.data || resp;
        if (data) {
          this.nuevoUsuario.nombre = data.nombres || data.nombre || '';
          const apPat = data.apellidoPaterno || data.apellido_paterno || '';
          const apMat = data.apellidoMaterno || data.apellido_materno || '';
          this.nuevoUsuario.apellido = (apPat || apMat) ? `${apPat} ${apMat}`.trim() : '';
        }
        this.buscandoDni = false;
        this.cdr.detectChanges();
      },
      error: () => { 
        this.buscandoDni = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== GUARDAR USUARIO ====================
  guardarUsuario(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.apellido || !this.nuevoUsuario.correo) {
      alert('⚠️ Completa los campos obligatorios');
      return;
    }

    if (this.nuevoUsuario.contrasena.length < 6) {
      alert('⚠️ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.guardandoUsuario = true;
    this.cdr.detectChanges();

    const rol = this.tipoUsuario === 'Administrador' ? 'ADMINISTRADOR' : 'TECNICO';

    const datos = {
      dni: this.nuevoUsuario.dni || '00000000',
      nombre: this.nuevoUsuario.nombre.trim(),
      apellido: this.nuevoUsuario.apellido.trim(),
      telefono: this.nuevoUsuario.telefono || '',
      usuario: this.nuevoUsuario.correo.trim(),
      contrasena: this.nuevoUsuario.contrasena,
      rol: rol
    };

    console.log('💾 Creando usuario:', datos);

    this.http.post(`${this.apiUrl}/auth/admin/crear-usuario`, datos).subscribe({
      next: (respuesta: any) => {
        console.log('✅ Usuario creado:', respuesta);
        this.guardandoUsuario = false;
        this.cerrarModal();
        this.cargarUsuarios();
        alert('✅ Usuario creado exitosamente');
      },
      error: (err) => {
        console.error('❌ Error:', err);
        this.guardandoUsuario = false;
        this.cdr.detectChanges();
        
        let mensaje = 'No se pudo crear el usuario';
        if (err.status === 409) mensaje = 'El correo o DNI ya está registrado';
        else if (err.error?.error) mensaje = err.error.error;
        alert('❌ ' + mensaje);
      }
    });
  }

  // ==================== CAMBIAR ESTADO ====================
  cambiarEstado(usuario: any): void {
    const nuevoEstado = usuario.estado === 'Activo' ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    
    if (!confirm(`¿${accion} a ${usuario.nombre} ${usuario.apellido}?`)) return;

    this.http.put(`${this.apiUrl}/admin/usuarios/${usuario.id}/estado`, {
      estado: nuevoEstado
    }).subscribe({
      next: () => {
        usuario.estado = nuevoEstado === 1 ? 'Activo' : 'Inactivo';
        this.actualizarContadores();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('Error al cambiar estado');
      }
    });
  }

  // ==================== ELIMINAR USUARIO ====================
  eliminarUsuario(usuario: any): void {
    if (!confirm(`¿Eliminar a ${usuario.nombre} ${usuario.apellido}?`)) return;

    this.http.delete(`${this.apiUrl}/personas/${usuario.id}`).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(u => u.id !== usuario.id);
        this.actualizarContadores();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error:', err);
        alert('Error al eliminar');
        
      }
    });
  }
}