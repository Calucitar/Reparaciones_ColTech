import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Login con tu BD (tabla credenciales)
  login(usuario: string, contrasena: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { usuario, contrasena });
  }

  // Registro (inserta en persona + credenciales + cliente)
  register(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, datos);
  }

  // Guardar sesión en localStorage
  guardarSesion(data: any) {
    localStorage.setItem('usuario', JSON.stringify(data));
  }

  // Obtener sesión
  obtenerSesion() {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  // Cerrar sesión
  cerrarSesion() {
    localStorage.removeItem('usuario');
  }

  // Verificar autenticado
  isAuthenticated(): boolean {
    return !!this.obtenerSesion();
  }
}