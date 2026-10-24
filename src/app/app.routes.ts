import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Layout } from './shared/layout/layout/layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, permisoGuard } from './core/guards/admin.guard';
import { docenteGuard } from './core/guards/docente.guard';
import { alumnoGuard } from './core/guards/alumno.guard';
import { padreGuard } from './core/guards/padre.guard';

// --- Admin ---
import { Dashboard } from './admin/pages/dashboard/dashboard';
import { Comunicados } from './admin/pages/comunicados/comunicados';
import { GradosSecciones } from './admin/pages/academico/grados-secciones/grados-secciones';
import { CatalogoCursos } from './admin/pages/academico/catalogo-cursos/catalogo-cursos';
import { Periodos } from './admin/pages/academico/periodos/periodos';
import { VinculoPadreHijo } from './admin/pages/academico/vinculo-padre-hijo/vinculo-padre-hijo';
import { SeccionDetalle } from './admin/pages/academico/grados-secciones/seccion-detalle/seccion-detalle';
import { HorarioEditor } from './admin/pages/academico/grados-secciones/horario-editor/horario-editor';
import { Students } from './admin/pages/usuarios/alumnos/students';
import { Parents } from './admin/pages/usuarios/padres/parents';
import { Teachers } from './admin/pages/usuarios/docentes/teachers';
import { PersonalStaff } from './admin/pages/usuarios/administrativo/personal-staff';
import { Directiva } from './admin/pages/directiva/directiva';
import { Perfil } from './admin/pages/perfil/perfil';
import { Configuracion } from './admin/pages/configuracion/configuracion';

// --- Docente / Alumno / Padre ---
// Las páginas de los Sprints 4, 5 y 6 se cargan bajo demanda (loadComponent)
// para que el paquete inicial no crezca.
const misCitas = () => import('./admin/pages/agenda/mis-citas/mis-citas').then(m => m.MisCitas);
const disponibilidad = () => import('./admin/pages/agenda/disponibilidad/disponibilidad').then(m => m.Disponibilidad);
import { AlumnoDashboard } from './pages/alumno/pages/dashboard/dashboard';
import { AlumnoCursos } from './pages/alumno/pages/cursos/cursos';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    // Layout contiene el siderbar + navbar; cada hijo es el contenido
    // que se muestra al hacer click en un botón del menú lateral.
    // authGuard exige sesión iniciada para entrar a cualquier /home/**.
    path: 'home',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'admin/inicio', pathMatch: 'full' },

      {
        // Todo lo del rol Administrador vive bajo /home/admin/**.
        // adminGuard verifica que el usuario logeado tenga ese rol.
        // Esta ruta no tiene 'component': solo agrupa el guard y sus
        // hijos se siguen mostrando en el <router-outlet> de Layout.
        path: 'admin',
        canActivate: [adminGuard],
        // Directiva: cada página pide su permiso (data.permiso).
        canActivateChild: [permisoGuard],
        children: [
          { path: '', redirectTo: 'inicio', pathMatch: 'full' },

          { path: 'inicio', component: Dashboard, data: { titulo: 'Inicio' } },
          { path: 'comunicados', component: Comunicados, data: { titulo: 'Comunicados' } },

          { path: 'agenda/mis-citas', loadComponent: misCitas, data: { titulo: 'Mis Citas' } },
          { path: 'agenda/disponibilidad', loadComponent: disponibilidad, data: { titulo: 'Disponibilidad' } },

          { path: 'academico/grados-secciones', component: GradosSecciones, data: { titulo: 'Grados y Secciones', permiso: 'ACADEMICO' } },
          { path: 'academico/grados-secciones/:id', component: SeccionDetalle, data: { titulo: 'Sección', permiso: 'ACADEMICO' } },
          { path: 'academico/grados-secciones/:id/horario', component: HorarioEditor, data: { titulo: 'Editor de horario', permiso: 'ACADEMICO' } },
          { path: 'academico/catalogo-cursos', component: CatalogoCursos, data: { titulo: 'Catálogo de Cursos', permiso: 'ACADEMICO' } },
          { path: 'academico/periodos', component: Periodos, data: { titulo: 'Periodos', permiso: 'ACADEMICO' } },
          { path: 'academico/vinculo-padre-hijo', component: VinculoPadreHijo, data: { titulo: 'Vínculo Padre-Hijo', permiso: 'ACADEMICO' } },

          { path: 'usuarios/alumnos', component: Students, data: { titulo: 'Alumnos', permiso: 'USUARIOS' } },
          { path: 'usuarios/padres', component: Parents, data: { titulo: 'Padres', permiso: 'USUARIOS' } },
          { path: 'usuarios/docentes', component: Teachers, data: { titulo: 'Docentes', permiso: 'USUARIOS' } },
          { path: 'usuarios/administrativo', component: PersonalStaff, data: { titulo: 'Personal Staff', permiso: 'USUARIOS' } },

          { path: 'reportes', loadComponent: () => import('./admin/pages/reportes/reportes').then(m => m.Reportes), data: { titulo: 'Reportes', permiso: 'REPORTES' } },

          // Directiva, Mi Perfil y Configuración se abren desde el menú del usuario (navbar).
          { path: 'directiva', component: Directiva, data: { titulo: 'Directiva' } },
          { path: 'perfil', component: Perfil, data: { titulo: 'Mi Perfil' } },
          { path: 'configuracion', component: Configuracion, data: { titulo: 'Configuración' } },
        ]
      },

      // Docente, Alumno y Padre: cada rol tiene su propio guard y sus páginas.
      {
        path: 'docente',
        canActivate: [docenteGuard],
        children: [
          { path: '', redirectTo: 'inicio', pathMatch: 'full' },
          { path: 'inicio', loadComponent: () => import('./pages/docente/pages/dashboard/dashboard').then(m => m.DocenteDashboard), data: { titulo: 'Dashboard' } },
          { path: 'cursos', loadComponent: () => import('./pages/docente/pages/cursos/mis-cursos').then(m => m.DocenteMisCursos), data: { titulo: 'Mis Cursos' } },
          { path: 'cursos/:id', loadComponent: () => import('./pages/docente/pages/curso/curso-docente').then(m => m.CursoDocente), data: { titulo: 'Mis Cursos' } },
          { path: 'comunicados', component: Comunicados, data: { titulo: 'Comunicados' } },
          { path: 'agenda/mis-citas', loadComponent: misCitas, data: { titulo: 'Mis Citas' } },
          { path: 'agenda/disponibilidad', loadComponent: disponibilidad, data: { titulo: 'Disponibilidad' } },
          // Perfil y Configuración reusan los mismos componentes de admin:
          // ambos trabajan siempre sobre el usuario logeado (AuthService),
          // así que no hace falta duplicar el código por rol.
          { path: 'perfil', component: Perfil, data: { titulo: 'Mi Perfil' } },
          { path: 'configuracion', component: Configuracion, data: { titulo: 'Configuración' } },
        ]
      },
      {
        path: 'alumno',
        canActivate: [alumnoGuard],
        children: [
          { path: '', redirectTo: 'inicio', pathMatch: 'full' },
          { path: 'inicio', component: AlumnoDashboard, data: { titulo: 'Dashboard' } },
          { path: 'cursos', component: AlumnoCursos, data: { titulo: 'Mis Cursos' } },
          { path: 'cursos/:id', loadComponent: () => import('./pages/alumno/pages/cursos/curso-detalle').then(m => m.AlumnoCursoDetalle), data: { titulo: 'Mis Cursos' } },
          { path: 'cursos/:id/actividad/:actividadId', loadComponent: () => import('./pages/alumno/pages/cursos/entrega-actividad').then(m => m.AlumnoEntregaActividad), data: { titulo: 'Mis Cursos' } },
          // Rutas anteriores del alumno: ahora todo está en Mis Cursos.
          { path: 'aula', redirectTo: 'cursos', pathMatch: 'full' },
          { path: 'aula/:id', redirectTo: 'cursos/:id' },
          { path: 'tareas', redirectTo: 'cursos', pathMatch: 'full' },
          { path: 'calificaciones', redirectTo: 'cursos', pathMatch: 'full' },
          { path: 'asistencia', redirectTo: 'cursos', pathMatch: 'full' },
          { path: 'historial', redirectTo: 'cursos', pathMatch: 'full' },
          { path: 'comunicados', component: Comunicados, data: { titulo: 'Comunicados' } },
          { path: 'perfil', component: Perfil, data: { titulo: 'Mi Perfil' } },
          { path: 'configuracion', component: Configuracion, data: { titulo: 'Configuración' } },
        ]
      },
      {
        path: 'padre',
        canActivate: [padreGuard],
        children: [
          { path: '', redirectTo: 'inicio', pathMatch: 'full' },
          { path: 'inicio', loadComponent: () => import('./pages/padre/pages/dashboard/dashboard').then(m => m.PadreDashboard), data: { titulo: 'Dashboard' } },
          { path: 'comunicados', loadComponent: () => import('./pages/padre/pages/comunicados/padre-comunicados').then(m => m.PadreComunicados), data: { titulo: 'Comunicados' } },
          { path: 'citas', loadComponent: misCitas, data: { titulo: 'Mis Citas' } },
          { path: 'hijos', loadComponent: () => import('./pages/padre/pages/hijos/mis-hijos').then(m => m.PadreMisHijos), data: { titulo: 'Mis Hijos' } },
          // Curso de un hijo en modo solo lectura (mismo componente que el alumno).
          { path: 'hijos/:estudianteId/cursos/:id', loadComponent: () => import('./pages/alumno/pages/cursos/curso-detalle').then(m => m.AlumnoCursoDetalle), data: { titulo: 'Mis Hijos' } },
          // Rutas anteriores del padre: ahora todo está en Mis Hijos (cada curso tiene notas, asistencia y tareas).
          { path: 'calificaciones', redirectTo: 'hijos', pathMatch: 'full' },
          { path: 'asistencia', redirectTo: 'hijos', pathMatch: 'full' },
          { path: 'tareas', redirectTo: 'hijos', pathMatch: 'full' },
          { path: 'historial', redirectTo: 'hijos', pathMatch: 'full' },
          { path: 'perfil', component: Perfil, data: { titulo: 'Mi Perfil' } },
          { path: 'configuracion', component: Configuracion, data: { titulo: 'Configuración' } },
        ]
      },
    ]
  },
  {
    // Cualquier ruta no encontrada vuelve al login.
    path: '**',
    redirectTo: 'login'
  }
];
