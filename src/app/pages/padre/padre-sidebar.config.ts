import { SidebarEntry } from '../../shared/layout/siderbar/siderbar';

/**
 * Menú lateral del rol Padre/Familiar: Dashboard, Comunicados (avisos y mensajes),
 * Mis Citas y Mis Hijos. Mi Perfil y Configuración están en el menú del usuario (arriba a la derecha).
 * Mismo formato que admin-sidebar.config.ts.
 */
export const PADRE_SIDEBAR_ITEMS: SidebarEntry[] = [
  {
    type: 'link',
    id: 'dashboard',
    label: 'Dashboard',
    route: ['/home', 'padre', 'inicio'],
    icon: 'M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6ZM14 14h6v6h-6v-6Z',
  },
  {
    type: 'link',
    id: 'comunicados',
    label: 'Comunicados',
    route: ['/home', 'padre', 'comunicados'],
    icon: 'M3 10v4h3l6 4V6L6 10H3ZM16 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  },
  {
    type: 'link',
    id: 'citas',
    label: 'Mis Citas',
    route: ['/home', 'padre', 'citas'],
    icon: 'M7 3v4M17 3v4M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM8 13h3v3H8z',
  },
  {
    type: 'link',
    id: 'hijos',
    label: 'Mis Hijos',
    route: ['/home', 'padre', 'hijos'],
    icon: 'M8.5 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM2.5 19.5c.5-3 2.8-5 6-5s5.5 2 6 5M15.3 14.6c2.4.2 4.2 1.9 4.7 4.4',
  },
];
