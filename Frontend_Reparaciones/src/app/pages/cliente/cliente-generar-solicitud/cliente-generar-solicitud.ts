import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-generar-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-generar-solicitud.html',
  styleUrls: ['./cliente-generar-solicitud.css']
})
export class ClienteGenerarSolicitud implements OnInit, OnDestroy {

  marcaSeleccionada = '';
  otraMarca = '';
  tipoEquipoSeleccionado = '';

  reporte = {
    marca: '',
    modelo: '',
    tipoEquipo: '',
    numeroSerie: '',
    descripcionFalla: '',
    idCliente: ''
  };

  enviado = false;
  codigoOperacion = '';
  error = '';
  cargando = false;

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarIdCliente();
  }

  ngOnDestroy(): void {}

  // ==================== CARGAR DATOS ====================
  cargarIdCliente(): void {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
      const clienteId = usuario.idPersona || usuario.id || usuario.id_persona;
      if (clienteId) {
        this.reporte.idCliente = String(clienteId);
      } else {
        this.error = 'No se pudo identificar al cliente. Inicia sesión nuevamente.';
      }
    } catch (e) {
      this.error = 'Error al cargar datos del cliente.';
    }
  }

  // ==================== MANEJO DE MARCAS ====================
  onMarcaChange(): void {
    if (this.marcaSeleccionada === 'Otras') {
      this.reporte.marca = '';
    } else {
      this.reporte.marca = this.marcaSeleccionada;
      this.otraMarca = '';
    }
  }

  actualizarMarcaReporte(): void {
    this.reporte.marca = this.otraMarca;
  }

  onTipoEquipoChange(): void {
    this.reporte.tipoEquipo = this.tipoEquipoSeleccionado;
  }

  // ==================== VALIDACIÓN ====================
  validarFormulario(): boolean {
    if (!this.reporte.tipoEquipo) {
      this.error = 'Selecciona el tipo de equipo';
      return false;
    }
    if (!this.reporte.numeroSerie || this.reporte.numeroSerie.trim().length < 3) {
      this.error = 'Número de serie inválido (mínimo 3 caracteres)';
      return false;
    }
    if (!this.reporte.marca || this.reporte.marca.trim().length === 0) {
      this.error = 'Selecciona o ingresa la marca';
      return false;
    }
    if (!this.reporte.modelo || this.reporte.modelo.trim().length < 2) {
      this.error = 'Ingresa el modelo (mínimo 2 caracteres)';
      return false;
    }
    if (!this.reporte.descripcionFalla || this.reporte.descripcionFalla.trim().length < 10) {
      this.error = 'Descripción muy corta (mínimo 10 caracteres)';
      return false;
    }
    if (!this.reporte.idCliente) {
      this.error = 'No se pudo identificar al cliente';
      return false;
    }
    return true;
  }

  // ==================== ENVIAR REPORTE ====================
  confirmarEnvio(): void {
    if (!this.validarFormulario()) return;

    this.error = '';
    this.cargando = true;
    this.cdr.detectChanges();

    const datos = {
      marca: this.reporte.marca.trim(),
      modelo: this.reporte.modelo.trim(),
      tipoEquipo: this.reporte.tipoEquipo,
      numeroSerie: this.reporte.numeroSerie.trim().toUpperCase(),
      descripcionFalla: this.reporte.descripcionFalla.trim(),
      idCliente: Number(this.reporte.idCliente)
    };

    console.log('📤 Enviando reporte:', datos);

    this.http.post<any>(`${this.apiUrl}/reportes`, datos).subscribe({
      next: (respuesta) => {
        console.log('✅ Respuesta del servidor:', respuesta);
        
        this.cargando = false;
        
        // Obtener ID del reporte
        const idReporte = respuesta.idReporte || respuesta.id_reporte;
        
        if (idReporte) {
          this.codigoOperacion = 'REP-' + idReporte;
          this.enviado = true;
          console.log('✅ Reporte creado:', this.codigoOperacion);
        } else {
          // Si no hay ID, igual mostrar éxito
          this.enviado = true;
          this.codigoOperacion = 'REP-OK';
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error al enviar:', err);
        
        this.cargando = false;
        
        if (err.status === 0) {
          this.error = '❌ No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://localhost:8080';
        } else if (err.status === 500) {
          this.error = '❌ Error interno del servidor: ' + (err.error?.error || 'Intente nuevamente.');
        } else if (err.status === 400) {
          this.error = '❌ Datos inválidos: ' + (err.error?.error || 'Verifica la información.');
        } else {
          this.error = '❌ Error al enviar el reporte. Intente nuevamente.';
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  // ==================== NUEVO REPORTE ====================
  nuevoReporte(): void {
    this.enviado = false;
    this.marcaSeleccionada = '';
    this.otraMarca = '';
    this.tipoEquipoSeleccionado = '';
    this.reporte = {
      marca: '',
      modelo: '',
      tipoEquipo: '',
      numeroSerie: '',
      descripcionFalla: '',
      idCliente: this.reporte.idCliente // Mantener ID del cliente
    };
    this.error = '';
    this.codigoOperacion = '';
    this.cargando = false;
    this.cdr.detectChanges();
  }
}