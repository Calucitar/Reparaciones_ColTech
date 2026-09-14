import { Routes } from '@angular/router';

// ==================== COMPONENTES ====================
import { Login } from './pages/login/login/login';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { AdministradorDashboard } from './pages/administrador/administrador-dashboard/administrador-dashboard';
import { AdministradorTickets } from './pages/administrador/administrador-tickets/administrador-tickets';
import { AdministradorOrdenTrabajo } from './pages/administrador/administrador-orden-trabajo/administrador-orden-trabajo';
import { AdministradorUsuarios } from './pages/administrador/administrador-usuarios/administrador-usuarios';
import { AdministradorNotificaciones } from './pages/administrador/administrador-notificaciones/administrador-notificaciones';
import { AdministradorGestionPagos } from './pages/administrador/administrador-gestion-pagos/administrador-gestion-pagos';
import { AdministradorDevoluciones } from './pages/administrador/administrador-devoluciones/administrador-devoluciones';
import { AdministradorCotizaciones } from './pages/administrador/administrador-cotizaciones/administrador-cotizaciones';

import { TecnicoLayout } from './layout/tecnico-layout/tecnico-layout';
import { TecnicoDashboard } from './pages/tecnico/tecnico-dashboard/tecnico-dashboard';
import { TecnicoOrdenesAsignadas } from './pages/tecnico/tecnico-ordenes-asignadas/tecnico-ordenes-asignadas';
import { TecnicoEvaluacionEquipos } from './pages/tecnico/tecnico-evaluacion-equipos/tecnico-evaluacion-equipos';
import { TecnicoReparacionesCurso } from './pages/tecnico/tecnico-reparaciones-curso/tecnico-reparaciones-curso';
import { TecnicoPruebasFuncionamiento } from './pages/tecnico/tecnico-pruebas-funcionamiento/tecnico-pruebas-funcionamiento';
import { TecnicoCotizaciones } from './pages/tecnico/tecnico-cotizaciones/tecnico-cotizaciones';

import { ClienteLayout } from './layout/cliente-layout/cliente-layout';
import { ClienteDashboard } from './pages/cliente/cliente-dashboard/cliente-dashboard';
import { ClienteGenerarSolicitud } from './pages/cliente/cliente-generar-solicitud/cliente-generar-solicitud';
import { ClienteEstadoSolicitud } from './pages/cliente/cliente-estado-solicitud/cliente-estado-solicitud';
import { ClientePago } from './pages/cliente/cliente-pago/cliente-pago';
import { ClienteNotificacion } from './pages/cliente/cliente-notificacion/cliente-notificacion';
import { ClienteCotizacion } from './pages/cliente/cliente-cotizacion/cliente-cotizacion';
import { Cliente } from './pages/cliente/cliente/cliente';

export const routes: Routes = [
    { path: '', component: Login },
    { path: 'login', component: Login },

    // ==================== ADMINISTRADOR ====================
    {
        path: 'administrador',
        component: AdminLayout,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: AdministradorDashboard },
            { path: 'tickets', component: AdministradorTickets },
            { path: 'orden-trabajo', component: AdministradorOrdenTrabajo },
            { path: 'usuarios', component: AdministradorUsuarios },
            { path: 'notificaciones', component: AdministradorNotificaciones },
            { path: 'gestion-pagos', component: AdministradorGestionPagos },
            { path: 'cotizaciones', component: AdministradorCotizaciones },
            { path: 'devoluciones', component: AdministradorDevoluciones },
        ]
    },

    // ==================== TÉCNICO ====================
    {
        path: 'tecnico',
        component: TecnicoLayout,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: TecnicoDashboard },
            { path: 'ordenes-asignadas', component: TecnicoOrdenesAsignadas },
            { path: 'evaluacion-equipos', component: TecnicoEvaluacionEquipos },
            { path: 'cotizaciones', component: TecnicoCotizaciones },
            { path: 'reparaciones', component: TecnicoReparacionesCurso },
            { path: 'pruebas-funcionamiento', component: TecnicoPruebasFuncionamiento }
        ]
    },

    // ==================== CLIENTE ====================
    {
        path: 'cliente',
        component: ClienteLayout,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: ClienteDashboard },
            { path: 'generar-solicitud', component: ClienteGenerarSolicitud },
            { path: 'estado-solicitud', component: ClienteEstadoSolicitud },
            { path: 'cotizacion', component: ClienteCotizacion },
            { path: 'pago', component: ClientePago },
            { path: 'notificacion', component: ClienteNotificacion },
            { path: 'perfil', component: Cliente }
        ]
    },

    // ==================== RUTA NO ENCONTRADA ====================
    { path: '**', redirectTo: '' }
];