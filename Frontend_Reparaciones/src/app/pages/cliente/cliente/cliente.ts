import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente.html',
  styleUrls: ['./cliente.css']
})
export class Cliente implements OnInit {

  perfil = {
    idPersona: '',
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    correo: ''
  };

  editando = false;
  guardado = false;
  error = '';
  cargando = true;
  guardando = false;
  nombreUsuario = '';
  iniciales = '';

  mostrarModalMFA = false;
  secretoMFA = '';
  codigoVerificacion = '';
  mfaActivado = false;

  private apiUrl = 'http://localhost:8080/api';

  constructor() {}

  ngOnInit(): void {
    console.log('🔍 localStorage usuario:', localStorage.getItem('usuario'));
    console.log('🔍 localStorage clienteId:', localStorage.getItem('clienteId'));
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargarDesdeLocalStorage();
    this.cargando = false;

    const idPersona = this.obtenerIdPersona();
    console.log('🔍 idPersona obtenido:', idPersona);
    
    if (idPersona) {
      fetch(`${this.apiUrl}/clientes/${idPersona}`)
        .then(res => res.json())
        .then(cliente => {
          console.log('📦 Respuesta API:', cliente);
          this.perfil.dni = cliente.persona?.dni || cliente.dni || this.perfil.dni;
          this.perfil.nombre = cliente.persona?.nombre || cliente.nombre || this.perfil.nombre;
          this.perfil.apellido = cliente.persona?.apellido || cliente.apellido || this.perfil.apellido;
          this.perfil.telefono = cliente.persona?.telefono || cliente.telefono || this.perfil.telefono;
          this.perfil.correo = cliente.persona?.correo || cliente.correo || this.perfil.correo;
          this.perfil.idPersona = cliente.idPersona || idPersona;
          console.log('📦 Perfil actualizado:', this.perfil);
          this.actualizarVista();
          this.guardarEnLocalStorage();
        })
        .catch(err => console.error('❌ Error API:', err));
    }
  }

  private cargarDesdeLocalStorage(): void {
    const usuario = localStorage.getItem('usuario');
    const clienteActual = localStorage.getItem('clienteActual');
    
    console.log('📦 usuario localStorage:', usuario);
    console.log('📦 clienteActual localStorage:', clienteActual);
    
    if (clienteActual) {
      try {
        const data = JSON.parse(clienteActual);
        this.perfil.dni = data.dni || this.perfil.dni;
      } catch (e) {}
    }
    
    if (usuario) {
      try {
        const data = JSON.parse(usuario);
        this.perfil.nombre = data.persona?.nombre || data.nombre || '';
        this.perfil.apellido = data.persona?.apellido || data.apellido || '';
        this.perfil.dni = data.persona?.dni || data.dni || this.perfil.dni;
        this.perfil.telefono = data.persona?.telefono || data.telefono || '';
        this.perfil.correo = data.persona?.correo || data.correo || data.email || '';
        this.perfil.idPersona = data.idPersona || data.id_persona || data.id || '';
        this.actualizarVista();
      } catch (e) {}
    }
  }

  private obtenerIdPersona(): string {
    const id = localStorage.getItem('clienteId');
    if (id) return id;
    const u = JSON.parse(localStorage.getItem('usuario') || '{}');
    return u.idPersona || u.id || '';
  }

  guardar(): void {
    this.error = '';

    if (!this.perfil.telefono || this.perfil.telefono.length < 9) {
      this.error = 'El teléfono debe tener al menos 9 dígitos';
      return;
    }
    if (!this.perfil.correo || !this.perfil.correo.includes('@')) {
      this.error = 'Ingresa un correo electrónico válido';
      return;
    }

    this.guardando = true;

    const datos = {
      persona: {
        nombre: this.perfil.nombre,
        apellido: this.perfil.apellido,
        dni: this.perfil.dni,
        telefono: this.perfil.telefono.trim(),
        correo: this.perfil.correo.trim().toLowerCase()
      }
    };

    console.log('📤 PUT a:', `${this.apiUrl}/clientes/${this.perfil.idPersona}`, datos);

    fetch(`${this.apiUrl}/clientes/${this.perfil.idPersona}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })
    .then(res => {
      console.log('📦 Respuesta status:', res.status);
      return res.json();
    })
    .then(resp => {
      console.log('✅ Guardado:', resp);
      this.guardarEnLocalStorage();
      this.guardando = false;
      this.editando = false;
      this.guardado = true;
      setTimeout(() => this.guardado = false, 3000);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      this.guardarEnLocalStorage();
      this.guardando = false;
      this.editando = false;
      this.guardado = true;
      setTimeout(() => this.guardado = false, 3000);
    });
  }

  private actualizarVista(): void {
    this.nombreUsuario = `${this.perfil.nombre} ${this.perfil.apellido}`.trim();
    this.iniciales = (
      (this.perfil.nombre?.charAt(0) || '') + 
      (this.perfil.apellido?.charAt(0) || '')
    ).toUpperCase() || 'CL';
    console.log('👤 Vista actualizada:', this.nombreUsuario, this.iniciales);
  }

  private guardarEnLocalStorage(): void {
    localStorage.setItem('clienteActual', JSON.stringify({
      idPersona: this.perfil.idPersona,
      nombre: this.nombreUsuario,
      dni: this.perfil.dni,
      telefono: this.perfil.telefono,
      correo: this.perfil.correo
    }));
    console.log('💾 Guardado en localStorage');
  }

  habilitarEdicion(): void { this.editando = true; this.guardado = false; this.error = ''; }
  cancelar(): void { this.editando = false; this.error = ''; this.cargarPerfil(); }
  validarTelefono(): void { this.perfil.telefono = this.perfil.telefono.replace(/[^0-9]/g, '').substring(0, 9); }
  validarCorreo(): void { this.perfil.correo = this.perfil.correo.toLowerCase().trim(); }
  validarCodigoVerificacion(): void { this.codigoVerificacion = this.codigoVerificacion.replace(/[^0-9]/g, '').substring(0, 6); }

  iniciarConfiguracionMFA(): void { this.secretoMFA = this.generarSecretoAleatorio(); this.mostrarModalMFA = true; }
  
  confirmarConfiguracionMFA(): void {
    if (this.codigoVerificacion.length !== 6) { this.error = 'Ingresa un código de 6 dígitos'; return; }
    this.mfaActivado = true; this.mostrarModalMFA = false; this.codigoVerificacion = '';
    alert('✅ Autenticación activada');
  }

  desactivarMFA(): void { if (confirm('¿Desactivar?')) this.mfaActivado = false; }
  cerrarModalMFA(): void { this.mostrarModalMFA = false; this.codigoVerificacion = ''; this.error = ''; }
  
  copiarSecreto(): void {
    navigator.clipboard.writeText(this.secretoMFA).then(() => alert('✅ Copiada')).catch(() => alert('Clave: ' + this.secretoMFA));
  }

  private generarSecretoAleatorio(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    return Array.from({length: 16}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}