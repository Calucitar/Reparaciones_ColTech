import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private api = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getEstadisticas(): Observable<any> {
    return this.http.get(`${this.api}/dashboard/estadisticas`);
  }

  getUltimasReparaciones(): Observable<any> {
    return this.http.get(`${this.api}/ordenes-trabajo`);
  }
}