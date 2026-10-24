import { FormControl } from '@angular/forms';
import { Val, mensajeError, revisar, soloDigitos } from '../core/utils/validadores';

/** Pruebas complementarias de las reglas de validación de los formularios (core/utils/validadores.ts). */
describe('VC – Validadores de formularios (frontend)', () => {
  const msg = (valor: unknown, regla: ReturnType<typeof Val.telefono>) => mensajeError(new FormControl(valor, regla));

  it('VC-F1 Teléfono: 9 dígitos que empiezan con 9', () => {
    expect(msg('987654321', Val.telefono())).toBeNull();
    expect(msg('', Val.telefono())).toBeNull();
    expect(msg('', Val.telefono(true))).toBe('El teléfono es obligatorio.');
    expect(msg('98765432', Val.telefono())).toBe('El teléfono debe tener 9 dígitos.');
    expect(msg('9876543210', Val.telefono())).toBe('El teléfono debe tener 9 dígitos.');
    expect(msg('98765432a', Val.telefono())).toBe('El teléfono solo puede tener números.');
    expect(msg('187654321', Val.telefono())).toBe('El teléfono debe empezar con 9 (celular).');
    expect(soloDigitos('987 654-321')).toBe('987654321');
  });

  it('VC-F2 Nombre completo y campos de solo letras', () => {
    expect(msg('María José Ñahui', Val.nombreCompleto())).toBeNull();
    expect(msg('Juan', Val.nombreCompleto())).toBe('Escribe el nombre y al menos un apellido.');
    expect(msg('Juan P3rez', Val.nombreCompleto())).toBe('El nombre solo puede tener letras y espacios.');
    expect(revisar('Peruana', Val.letras('la nacionalidad', 60))).toBeNull();
    expect(revisar('Peru4na', Val.letras('la nacionalidad', 60))).toBe('En la nacionalidad solo se permiten letras y espacios.');
  });

  it('VC-F3 Correo, contraseña, usuario y enlace', () => {
    expect(revisar('juan.perez@gmail.com', Val.correo())).toBeNull();
    expect(revisar('juan#colegio.com', Val.correo())).toContain('El correo no es válido');
    expect(revisar('123', Val.password())).toBe('La contraseña debe tener al menos 4 caracteres.');
    expect(revisar('mi clave', Val.password())).toBe('La contraseña no puede tener espacios.');
    expect(revisar('admin 1', Val.usuario())).toContain('sin espacios');
    expect(revisar('https://www.youtube.com/watch?v=1', Val.enlace())).toBeNull();
    expect(revisar('www.youtube.com', Val.enlace())).toContain('http://');
  });

  it('VC-F4 Fechas y números en rango', () => {
    const hoy = new Date();
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const hace = (anios: number) => iso(new Date(hoy.getFullYear() - anios, hoy.getMonth(), Math.max(1, hoy.getDate() - 1)));
    expect(revisar(hace(10), Val.fechaNacimiento(3, 20))).toBeNull();
    expect(revisar(hace(1), Val.fechaNacimiento(3, 20))).toContain('entre 3 y 20');
    expect(revisar(iso(new Date(hoy.getTime() + 3 * 86400000)), Val.fechaNacimiento(3, 20))).toBe('La fecha de nacimiento no puede ser futura.');
    expect(revisar(2024, Val.numero('el año de ingreso', 2000, 2030))).toBeNull();
    expect(revisar(1999, Val.numero('el año de ingreso', 2000, 2030))).toBe('El año de ingreso debe estar entre 2000 y 2030.');
    expect(revisar(2024.5, Val.numero('el año de ingreso', 2000, 2030))).toBe('El año de ingreso debe ser un número entero.');
  });
});
