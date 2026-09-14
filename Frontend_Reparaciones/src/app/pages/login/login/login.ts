import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  usuario: string = '';
  contrasena: string = '';
  cargando: boolean = false;
  errorLogin: string = '';
  cuentaCreada: boolean = false;

  mostrarOlvido: boolean = false;
  correoRecuperacion: string = '';
  enviandoCorreo: boolean = false;
  correoEnviado: boolean = false;

  mostrarRegistro: boolean = false;
  dni: string = '';
  nombres: string = '';
  apellidos: string = '';
  correo: string = '';
  telefono: string = '';
  fechaNacimiento: string = '';
  contrasenaRegistro: string = '';
  confirmarContrasena: string = '';
  errorRegistro: string = '';
  buscandoDni: boolean = false;
  registrando: boolean = false;

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  // ==================== INICIAR SESIÓN ====================
  iniciarSesion() {
    if (!this.usuario || !this.contrasena) {
      this.errorLogin = 'Ingresa usuario y contraseña';
      return;
    }

    this.cargando = true;
    this.errorLogin = '';
    this.cdr.detectChanges();

    this.http.post(`${this.apiUrl}/auth/login`, {
      usuario: this.usuario.trim(),
      contrasena: this.contrasena
    }).subscribe({
      next: (resp: any) => {
        const usuarioData = {
          idPersona: resp.idPersona || '',
          nombre: resp.nombre || '',
          apellido: resp.apellido || '',
          correo: resp.correo || this.usuario,
          telefono: resp.telefono || '',
          dni: resp.dni || '',
          rol: resp.rol?.toUpperCase() || 'CLIENTE'
        };

        localStorage.setItem('usuario', JSON.stringify(usuarioData));
        localStorage.setItem('idPersona', usuarioData.idPersona.toString());
        if (resp.token) localStorage.setItem('token', resp.token);

        this.cargando = false;
        this.cdr.detectChanges();
        this.redirigirPorRol(resp.rol);
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();

        if (err.status === 401 || err.status === 403) {
          this.errorLogin = 'Credenciales incorrectas';
        } else if (err.status === 0) {
          this.errorLogin = 'No se pudo conectar al servidor';
        } else {
          this.errorLogin = err.error?.error || 'Error al iniciar sesión';
        }
      }
    });
  }

  private redirigirPorRol(rol: string) {
    const r = rol?.toUpperCase();
    console.log('>>> Redirigiendo por rol:', r);
    
    switch(r) {
      case 'ADMINISTRADOR':
      case 'ADMIN':
        this.router.navigate(['/administrador/dashboard']);
        break;
      case 'TECNICO':
      case 'TÉCNICO':
        this.router.navigate(['/tecnico/ordenes-asignadas']);
        break;
      default:
        this.router.navigate(['/cliente/dashboard']);
        break;
    }
  }

  // ==================== OLVIDO CONTRASEÑA ====================
  abrirOlvido() {
    this.mostrarOlvido = true;
    this.correoEnviado = false;
    this.correoRecuperacion = '';
  }

  cerrarOlvido() {
    this.mostrarOlvido = false;
  }

  enviarCorreoRecuperacion() {
    if (!this.correoRecuperacion) return;
    this.enviandoCorreo = true;
    this.cdr.detectChanges();
    
    this.http.post(`${this.apiUrl}/auth/olvide-contrasena`, {
      correo: this.correoRecuperacion.trim()
    }).subscribe({
      next: () => {
        this.enviandoCorreo = false;
        this.correoEnviado = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.enviandoCorreo = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== REGISTRO ====================
  abrirRegistro() {
    this.mostrarRegistro = true;
    this.errorRegistro = '';
    this.dni = '';
    this.nombres = '';
    this.apellidos = '';
    this.correo = '';
    this.telefono = '';
    this.fechaNacimiento = '';
    this.contrasenaRegistro = '';
    this.confirmarContrasena = '';
    this.registrando = false;
    this.cdr.detectChanges();
  }

  cerrarRegistro() {
    this.mostrarRegistro = false;
    this.errorRegistro = '';
    this.registrando = false;
  }

  onDniChange() {
    this.nombres = '';
    this.apellidos = '';
    this.fechaNacimiento = '';
    if (this.dni.length === 8) {
      this.buscarDniReniec();
    }
  }

  buscarDniReniec() {
    if (!this.dni || this.dni.length !== 8) return;
    this.buscandoDni = true;
    this.cdr.detectChanges();
    
    this.http.get(`${this.apiUrl}/reniec/dni/${this.dni}`).subscribe({
      next: (resp: any) => {
        const data = resp.data || resp;
        if (data) {
          this.nombres = data.nombres || data.nombre || '';
          const paterno = data.apellidoPaterno || data.apellido_paterno || data.paterno || '';
          const materno = data.apellidoMaterno || data.apellido_materno || data.materno || '';
          this.apellidos = (paterno + ' ' + materno).trim() || data.apellidos || data.apellido || '';
          this.fechaNacimiento = data.fechaNacimiento || data.fecha_nacimiento || '';
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

  // Validar solo números en teléfono
  soloNumeros(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  registrarUsuario() {
    this.errorRegistro = '';

    // Validaciones
    if (!this.dni || this.dni.length !== 8) {
      this.errorRegistro = 'DNI inválido (8 dígitos)';
      return;
    }
    if (!this.nombres.trim()) {
      this.errorRegistro = 'Ingresa tus nombres';
      return;
    }
    if (!this.apellidos.trim()) {
      this.errorRegistro = 'Ingresa tus apellidos';
      return;
    }
    if (!this.correo?.includes('@')) {
      this.errorRegistro = 'Correo inválido';
      return;
    }
    // CORREGIDO: Validar exactamente 9 dígitos
    if (!this.telefono || this.telefono.length !== 9) {
      this.errorRegistro = 'Teléfono inválido (debe tener 9 dígitos)';
      return;
    }
    // Validar que solo sean números
    if (!/^\d{9}$/.test(this.telefono)) {
      this.errorRegistro = 'Teléfono inválido (solo números, 9 dígitos)';
      return;
    }
    if (this.contrasenaRegistro.length < 6) {
      this.errorRegistro = 'Contraseña muy corta (mín 6)';
      return;
    }
    if (this.contrasenaRegistro !== this.confirmarContrasena) {
      this.errorRegistro = 'Las contraseñas no coinciden';
      return;
    }

    this.registrando = true;
    this.errorRegistro = '';
    this.cdr.detectChanges();

    const body = {
      dni: this.dni.trim(),
      nombre: this.nombres.trim(),
      apellido: this.apellidos.trim(),
      telefono: this.telefono.trim(),
      usuario: this.correo.trim().toLowerCase(),
      contrasena: this.contrasenaRegistro
    };

    console.log('📤 Registrando CLIENTE:', body);

    this.http.post(`${this.apiUrl}/auth/register`, body).subscribe({
      next: (resp: any) => {
        console.log('✅ Registro exitoso:', resp);
        this.registrando = false;
        this.cerrarRegistro();
        this.cuentaCreada = true;
        this.usuario = this.correo.trim().toLowerCase();
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.cuentaCreada = false;
          this.cdr.detectChanges();
        }, 5000);
      },
      error: (err) => {
        this.registrando = false;
        console.error('❌ Error registro:', err);
        
        if (err.status === 409) {
          this.errorRegistro = 'El correo o DNI ya está registrado';
        } else if (err.status === 400) {
          this.errorRegistro = err.error?.error || 'Datos inválidos';
        } else if (err.status === 0) {
          this.errorRegistro = 'No se pudo conectar al servidor';
        } else {
          this.errorRegistro = err.error?.error || 'Error al crear la cuenta';
        }
        
        this.cdr.detectChanges();
      }
    });
  }
}