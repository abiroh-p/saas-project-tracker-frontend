import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Alert } from '../../shared/ui/alert/alert';
import { Button } from '../../shared/ui/button/button';
import { Checkbox } from '../../shared/ui/checkbox/checkbox';
import { Icon } from '../../shared/ui/icon/icon';
import { ICONS, IconName } from '../../shared/ui/icon/icons';
import { Logo } from '../../shared/ui/logo/logo';
import { TextField } from '../../shared/ui/text-field/text-field';

interface Swatch {
  name: string;
  token: string;
}

const swatches = (prefix: string, steps: number[]): Swatch[] =>
  steps.map((step) => ({ name: `${prefix}-${step}`, token: `--color-${prefix}-${step}` }));

/** Development-only reference page for design tokens and shared components. */
@Component({
  selector: 'app-design-system',
  imports: [ReactiveFormsModule, Alert, Button, Checkbox, Icon, Logo, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './design-system.html',
  styleUrl: './design-system.scss',
})
export class DesignSystem {
  protected readonly palettes = [
    {
      title: 'Primary',
      swatches: swatches('primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
    },
    {
      title: 'Neutral',
      swatches: swatches('neutral', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
    },
    { title: 'Navy (sidebar)', swatches: swatches('navy', [600, 700, 800, 900]) },
    {
      title: 'Status',
      swatches: [
        { name: 'success-600', token: '--color-success-600' },
        { name: 'warning-600', token: '--color-warning-600' },
        { name: 'danger-600', token: '--color-danger-600' },
      ],
    },
  ];

  protected readonly iconNames = Object.keys(ICONS) as IconName[];
  protected readonly loading = signal(false);

  protected readonly demoForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    remember: new FormControl(true, { nonNullable: true }),
  });

  protected readonly invalidForm = new FormGroup({
    email: new FormControl('not-an-email', { nonNullable: true, validators: [Validators.email] }),
    disabled: new FormControl({ value: 'Read only value', disabled: true }, { nonNullable: true }),
  });

  constructor() {
    this.invalidForm.markAllAsTouched();
  }

  protected simulateLoading(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1600);
  }
}
