import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DialogService } from './dialog.service';

describe('DialogService.confirm', () => {
  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach((node) => (node.innerHTML = ''));
  });

  const open = () => {
    const service = TestBed.inject(DialogService);
    const result = firstValueFrom(
      service.confirm({
        title: 'Archive this project?',
        message: 'It will be hidden.',
        confirmLabel: 'Archive project',
        danger: true,
      }),
    );
    return result;
  };

  /** The dialog is attached to the overlay and rendered on the next application tick. */
  const render = async () => {
    const result = open();
    const app = TestBed.inject(ApplicationRef);
    app.tick();
    await Promise.resolve();
    app.tick();
    return result;
  };

  const buttonLabelled = (label: string) =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('app-confirm-dialog button')).find(
      (b) => b.textContent?.includes(label),
    )!;

  it('shows the title and message in an accessible dialog', async () => {
    const result = render();
    await Promise.resolve();

    const container = document.querySelector('.cdk-dialog-container')!;
    expect(container.getAttribute('role')).toBe('dialog');
    expect(container.getAttribute('aria-label')).toBe('Archive this project?');
    expect(container.textContent).toContain('It will be hidden.');

    buttonLabelled('Cancel').click();
    await result;
  });

  it('resolves true only when confirmed', async () => {
    const result = render();
    await Promise.resolve();
    buttonLabelled('Archive project').click();
    expect(await result).toBe(true);
  });

  it('resolves false when cancelled', async () => {
    const result = render();
    await Promise.resolve();
    buttonLabelled('Cancel').click();
    expect(await result).toBe(false);
  });

  it('resolves false when closed with the X button', async () => {
    const result = render();
    await Promise.resolve();
    document.querySelector<HTMLButtonElement>('.modal__close')!.click();
    expect(await result).toBe(false);
  });
});
