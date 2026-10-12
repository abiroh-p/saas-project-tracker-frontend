import type { ComponentFixture } from '@angular/core/testing';

/**
 * Runs change detection a few times and lets microtasks drain.
 *
 * Use instead of `fixture.whenStable()` in specs for components that load data with `rxResource`:
 * `whenStable()` also waits for in-flight resource loads, which would deadlock because mocked HTTP
 * requests are only answered by the test.
 */
export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  for (let i = 0; i < 3; i++) {
    fixture.detectChanges();
    await Promise.resolve();
  }
}
