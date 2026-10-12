import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Project } from '../../../core/api/models';
import { errorInterceptor } from '../../../core/http/error.interceptor';
import { ProjectFormDialog, type ProjectFormData } from './project-form-dialog';

const saved: Project = {
  id: 7,
  key: 'WR',
  name: 'Website Redesign',
  description: 'Refresh the site.',
  start_date: '2026-10-01',
  end_date: '2026-12-31',
  created_by: 'john.doe',
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-01T10:00:00Z',
  is_archived: false,
  my_role: 'PROJECT_MANAGER',
};

describe('ProjectFormDialog', () => {
  let fixture: ComponentFixture<ProjectFormDialog>;
  let httpMock: HttpTestingController;
  let el: HTMLElement;
  const ref = { close: vi.fn() };

  async function setup(data: ProjectFormData | null) {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: data },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectFormDialog);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  const input = (label: string) => {
    const labelEl = Array.from(el.querySelectorAll('label')).find(
      (node) => node.textContent?.trim() === label,
    )!;
    return el.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `#${labelEl.getAttribute('for')}`,
    )!;
  };
  const type = async (label: string, value: string) => {
    const field = input(label);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const submit = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  };
  const alerts = () =>
    Array.from(el.querySelectorAll('[role="alert"]')).map((node) => node.textContent?.trim());

  beforeEach(() => ref.close.mockReset());
  afterEach(() => httpMock.verify());

  describe('creating', () => {
    beforeEach(() => setup(null));

    it('starts empty with the create title and button', () => {
      expect(el.textContent).toContain('New project');
      expect(el.textContent).toContain('Create project');
      expect(input('Project name').value).toBe('');
    });

    it('suggests a key from the name until the user types their own', async () => {
      await type('Project name', 'Website Redesign');
      expect(input('Project key').value).toBe('WR');

      await type('Project key', 'WEB');
      await type('Project name', 'Mobile App');
      expect(input('Project key').value).toBe('WEB');
    });

    it('requires a name and a valid key before calling the API', async () => {
      await submit();
      httpMock.expectNone('/api/v1/projects/');
      expect(alerts()).toContain('Project name is required.');
      expect(alerts()).toContain('Project key is required.');

      await type('Project key', 'x');
      await submit();
      expect(alerts()).toContain('Use 2 to 10 letters or digits, starting with a letter.');
    });

    it('rejects an end date before the start date', async () => {
      await type('Project name', 'Website Redesign');
      await type('Start date', '2026-12-01');
      await type('End date', '2026-11-01');
      await submit();

      httpMock.expectNone('/api/v1/projects/');
      expect(alerts()).toContain('End date must be on or after the start date.');
    });

    it('sends a normalised payload and closes with the created project', async () => {
      await type('Project name', '  Website Redesign  ');
      await type('Project key', ' wr ');
      await type('Description', '  Refresh the site.  ');
      await type('Start date', '2026-10-01');
      await submit();

      const req = httpMock.expectOne('/api/v1/projects/');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        key: 'WR',
        name: 'Website Redesign',
        description: 'Refresh the site.',
        start_date: '2026-10-01',
        end_date: null,
      });
      req.flush(saved);
      await fixture.whenStable();

      expect(ref.close).toHaveBeenCalledWith(saved);
    });

    it('shows a taken key under the key field and stays open', async () => {
      await type('Project name', 'Website Redesign');
      await submit();

      httpMock.expectOne('/api/v1/projects/').flush(
        {
          detail: 'Validation failed.',
          code: 'validation_error',
          errors: { key: ['A project with this key already exists.'] },
        },
        { status: 400, statusText: 'Bad Request' },
      );
      await fixture.whenStable();

      expect(alerts()).toEqual(['A project with this key already exists.']);
      expect(ref.close).not.toHaveBeenCalled();
    });

    it('shows general failures in an alert', async () => {
      await type('Project name', 'Website Redesign');
      await submit();

      httpMock.expectOne('/api/v1/projects/').error(new ProgressEvent('error'));
      await fixture.whenStable();

      expect(el.textContent).toContain('Unable to reach the server');
      expect(ref.close).not.toHaveBeenCalled();
    });

    it('ignores a second submit while saving', async () => {
      await type('Project name', 'Website Redesign');
      await submit();
      await submit();

      expect(httpMock.match('/api/v1/projects/')).toHaveLength(1);
    });

    it('closes without a result when cancelled', () => {
      Array.from(el.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('Cancel'))!
        .click();
      expect(ref.close).toHaveBeenCalledWith();
    });
  });

  describe('editing', () => {
    beforeEach(() => setup({ project: saved }));

    it('is pre-filled, titled for editing and locks the key', () => {
      expect(el.textContent).toContain('Edit project');
      expect(el.textContent).toContain('Save changes');
      expect(input('Project name').value).toBe('Website Redesign');
      expect(input('Project key').value).toBe('WR');
      expect((input('Project key') as HTMLInputElement).disabled).toBe(true);
      expect(input('Start date').value).toBe('2026-10-01');
    });

    it('patches without the key and closes with the updated project', async () => {
      await type('Project name', 'Marketing Website');
      await type('End date', '');
      await submit();

      const req = httpMock.expectOne('/api/v1/projects/7/');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({
        name: 'Marketing Website',
        description: 'Refresh the site.',
        start_date: '2026-10-01',
        end_date: null,
      });
      expect('key' in req.request.body).toBe(false);

      const updated = { ...saved, name: 'Marketing Website', end_date: null };
      req.flush(updated);
      await fixture.whenStable();
      expect(ref.close).toHaveBeenCalledWith(updated);
    });
  });
});
