import { FormBuilder, Validators } from '@angular/forms';
import { coincideConNueva } from '../admin/pages/configuracion/configuracion';

describe('PU-04 – HU-33: Cambio de contraseña (formulario Configuración)', () => {
  const fb = new FormBuilder();

  function formulario(nueva: string, confirmar: string) {
    return fb.group({
      passwordActual: ['1234', Validators.required],
      passwordNueva: [nueva, [Validators.required, Validators.minLength(4)]],
      confirmarPassword: [confirmar, Validators.required],
      codigo: ['482915', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    }, { validators: coincideConNueva });
  }

  it('PU-04.2 Nueva contraseña y confirmación diferentes: se rechaza el cambio', () => {
    const form = formulario('nueva2026', 'nueva2025');

    expect(form.errors).toEqual({ noCoincide: true });
    expect(form.invalid).toBe(true);
  });

  it('PU-04.2 (control) Nueva contraseña y confirmación iguales: el formulario es válido', () => {
    const form = formulario('nueva2026', 'nueva2026');

    expect(form.errors).toBeNull();
    expect(form.valid).toBe(true);
  });
});
