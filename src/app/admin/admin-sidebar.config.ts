import { SidebarEntry } from '../shared/layout/siderbar/siderbar';

/**
 * Menú lateral del rol Administrador. Las rutas ('route') deben coincidir
 * exactamente con los paths hijos definidos bajo /home/admin en app.routes.ts.
 *
 * Si en el futuro agregas otro rol (docente, padre...), crea un archivo
 * análogo (ej. docente-sidebar.config.ts) y selecciónalo en Layout según
 * el rol del usuario logeado.
 */
export const ADMIN_SIDEBAR_ITEMS: SidebarEntry[] = [
  {
    type: 'link',
    id: 'dashboard',
    label: 'Dashboard',
    route: ['/home', 'admin', 'inicio'],
    icon: 'M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6ZM14 14h6v6h-6v-6Z',
  },
  {
    type: 'link',
    id: 'comunicados',
    label: 'Comunicados',
    route: ['/home', 'admin', 'comunicados'],
    icon: 'M3 11l18-7-7 18-2-8-9-3Z',
  },
  {
    type: 'group',
    id: 'mi-agenda',
    label: 'Mi Agenda',
    icon: 'M7 3v4M17 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
    children: [
      { id: 'mis-citas', label: 'Mis Citas', route: ['/home', 'admin', 'agenda', 'mis-citas'] },
      { id: 'disponibilidad', label: 'Disponibilidad', route: ['/home', 'admin', 'agenda', 'disponibilidad'] },
    ],
  },
  {
    type: 'group',
    id: 'academico',
    label: 'Académico',
    permiso: 'ACADEMICO',
    icon: 'M12 3 2 8l10 5 10-5-10-5ZM6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5',
    children: [
      { id: 'grados-secciones', label: 'Grados y Secciones', route: ['/home', 'admin', 'academico', 'grados-secciones'] },
      { id: 'catalogo-cursos', label: 'Catálogo de Cursos', route: ['/home', 'admin', 'academico', 'catalogo-cursos'] },
      { id: 'periodos', label: 'Periodos', route: ['/home', 'admin', 'academico', 'periodos'] },
      { id: 'vinculo-padre-hijo', label: 'Vínculo Padre-Hijo', route: ['/home', 'admin', 'academico', 'vinculo-padre-hijo'] },
    ],
  },
  {
    type: 'group',
    id: 'usuario',
    label: 'Usuario',
    permiso: 'USUARIOS',
    icon: 'M8.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 19.5c.5-3 2.8-5 6-5s5.5 2 6 5M15.3 14.6c2.4.2 4.2 1.9 4.7 4.4',
    children: [
      { id: 'alumnos', label: 'Alumnos', route: ['/home', 'admin', 'usuarios', 'alumnos'] },
      { id: 'padres', label: 'Padres', route: ['/home', 'admin', 'usuarios', 'padres'] },
      { id: 'docentes', label: 'Docentes', route: ['/home', 'admin', 'usuarios', 'docentes'] },
      { id: 'administrativo', label: 'Administrativo', route: ['/home', 'admin', 'usuarios', 'administrativo'] },
    ],
  },
  {
    type: 'link',
    id: 'reportes',
    label: 'Reportes',
    permiso: 'REPORTES',
    route: ['/home', 'admin', 'reportes'],
    icon: 'M4 19h16M7 16v-5M12 16V7M17 16v-8',
  },
  {
    type: 'group',
    id: 'cuenta',
    label: 'Mi Cuenta',
    icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
    children: [
      { id: 'perfil', label: 'Mi Perfil', route: ['/home', 'admin', 'perfil'] },
      { id: 'configuracion', label: 'Configuración', route: ['/home', 'admin', 'configuracion'] },
    ],
  },
];
