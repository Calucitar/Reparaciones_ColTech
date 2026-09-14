import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

declare var Izipay: any;

export interface IzipayConfig {
  accessKeyId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  transactionId: string;
  orderId: string;
  description: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  returnUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

export interface IzipayResult {
  status: 'SUCCESS' | 'CANCEL' | 'ERROR';
  transactionId: string;
  orderId: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class IzipayService {

  private apiUrl = 'http://localhost:8080/api';
  
  // Configuración (PRODUCCIÓN: mover a environment.ts)
  private config = {
    accessKeyId: 'TU_ACCESS_KEY_ID',
    clientSecret: 'TU_CLIENT_SECRET',
    endpoint: 'https://api.izipay.pe/v1/payment',
    returnUrl: window.location.origin + '/cliente/pagos?status=success',
    cancelUrl: window.location.origin + '/cliente/pagos?status=cancel',
    ipnUrl: 'http://localhost:8080/api/pagos/notificacion'
  };

  constructor(private http: HttpClient) {}

  /**
   * Iniciar pago con formulario Izipay (redirección)
   */
  iniciarPagoFormulario(datos: {
    monto: number;
    ordenId: number;
    descripcion: string;
    clienteEmail: string;
    clienteNombre: string;
    clienteApellido: string;
  }): void {
    const transactionId = 'TXN-' + Date.now() + '-' + datos.ordenId;
    
    // Guardar en backend antes de redirigir
    this.http.post(`${this.apiUrl}/pagos/iniciar`, {
      pago_id: datos.ordenId,
      monto: datos.monto,
      transaction_id: transactionId,
      cliente_email: datos.clienteEmail
    }).subscribe();

    // Crear formulario dinámico
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = this.config.endpoint;
    form.style.display = 'none';

    const fields: Record<string, string> = {
      'accessKeyId': this.config.accessKeyId,
      'clientSecret': this.config.clientSecret,
      'action': 'SALES',
      'currency': 'PEN',
      'transactionId': transactionId,
      'amount': (datos.monto * 100).toFixed(0),
      'returnUrl': this.config.returnUrl + '&txnId=' + transactionId + '&orderId=' + datos.ordenId,
      'cancelUrl': this.config.cancelUrl + '&orderId=' + datos.ordenId,
      'ipnUrl': this.config.ipnUrl,
      'orderDetails[orderId]': 'OT-' + datos.ordenId,
      'orderDetails[description]': datos.descripcion,
      'customer[email]': datos.clienteEmail,
      'customer[firstName]': datos.clienteNombre,
      'customer[lastName]': datos.clienteApellido
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  /**
   * Iniciar pago con SDK Izipay (embedido en la página)
   */
  iniciarPagoSDK(datos: {
    monto: number;
    ordenId: number;
    descripcion: string;
    clienteEmail: string;
    clienteNombre: string;
    clienteApellido: string;
    containerId: string;
  }): void {
    const transactionId = 'TXN-' + Date.now() + '-' + datos.ordenId;

    if (typeof Izipay === 'undefined') {
      console.error('SDK Izipay no cargado');
      return;
    }

    const izipay = new Izipay({
      accessKeyId: this.config.accessKeyId,
      clientSecret: this.config.clientSecret,
      action: 'SALES',
      currency: 'PEN',
      transactionId: transactionId,
      amount: (datos.monto * 100).toFixed(0),
      returnUrl: this.config.returnUrl + '&txnId=' + transactionId + '&orderId=' + datos.ordenId,
      cancelUrl: this.config.cancelUrl + '&orderId=' + datos.ordenId,
      ipnUrl: this.config.ipnUrl,
      orderDetails: {
        orderId: 'OT-' + datos.ordenId,
        description: datos.descripcion
      },
      customer: {
        email: datos.clienteEmail,
        firstName: datos.clienteNombre,
        lastName: datos.clienteApellido
      },
      onSuccess: (result: any) => {
        console.log('✅ Pago exitoso:', result);
        this.guardarResultadoPago(transactionId, 'APROBADO', result);
      },
      onCancel: (result: any) => {
        console.log('❌ Pago cancelado:', result);
        this.guardarResultadoPago(transactionId, 'CANCELADO', result);
      },
      onError: (error: any) => {
        console.error('❌ Error en pago:', error);
        this.guardarResultadoPago(transactionId, 'RECHAZADO', error);
      }
    });

    izipay.render('#' + datos.containerId);
  }

  /**
   * Guardar resultado del pago en backend
   */
  private guardarResultadoPago(transactionId: string, estado: string, result: any): void {
    this.http.post(`${this.apiUrl}/pagos/resultado`, {
      transactionId: transactionId,
      estado: estado,
      resultado: result
    }).subscribe({
      next: () => console.log('Resultado guardado'),
      error: (err) => console.error('Error al guardar resultado:', err)
    });
  }

  /**
   * Verificar estado de un pago
   */
  verificarPago(transactionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/pagos/verificar/${transactionId}`);
  }

  /**
   * Generar token de pago (para personalización avanzada)
   */
  generarToken(datosTarjeta: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/pagos/token`, datosTarjeta);
  }
}