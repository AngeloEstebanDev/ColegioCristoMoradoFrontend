import { SidebarEntry } from '../../shared/layout/siderbar/siderbar';

/**
 * Menú lateral del rol Alumno: Dashboard, Comunicados y Mis Cursos.
 * + Mi Cuenta (Mi Perfil y Configuración), igual que en los otros roles.
 * Mismo formato que admin-sidebar.config.ts.
 */
export const ALUMNO_SIDEBAR_ITEMS: SidebarEntry[] = [
  {
    type: 'link',
    id: 'dashboard',
    label: 'Dashboard',
    route: ['/home', 'alumno', 'inicio'],
    icon: 'M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6ZM14 14h6v6h-6v-6Z',
  },
  {
    type: 'link',
    id: 'comunicados',
    label: 'Comunicados',
    route: ['/home', 'alumno', 'comunicados'],
    icon: 'M3 10v4h3l6 4V6L6 10H3ZM16 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  },
  {
    type: 'link',
    id: 'cursos',
    label: 'Mis Cursos',
    route: ['/home', 'alumno', 'cursos'],
    icon: 'M12 4 2 9l10 5 10-5-10-5ZM6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6',
  },
  {
    type: 'group',
    id: 'cuenta',
    label: 'Mi Cuenta',
    icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
    children: [
      { id: 'perfil', label: 'Mi Perfil', route: ['/home', 'alumno', 'perfil'] },
      { id: 'configuracion', label: 'Configuración', route: ['/home', 'alumno', 'configuracion'] },
    ],
  },
];
