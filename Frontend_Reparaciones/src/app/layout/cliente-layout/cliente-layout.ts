import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-cliente-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cliente-layout.html',
  styleUrls: ['./cliente-layout.css']
})
export class ClienteLayout implements OnInit {
  
  nombreCliente = '';

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.cargarNombreCliente();
  }

  cargarNombreCliente(): void {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (usuario.nombre) {
      this.nombreCliente = `${usuario.nombre} ${usuario.apellido || ''}`.trim();
      return;
    }
    this.nombreCliente = 'Cliente';
  }

  cerrarSesion(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}