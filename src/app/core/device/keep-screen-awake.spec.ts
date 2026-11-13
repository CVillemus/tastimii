import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { keepScreenAwake } from './keep-screen-awake';

type FakeWakeLockSentinel = {
  release: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
};

function installFakeWakeLock(): {
  request: ReturnType<typeof vi.fn>;
  sentinel: FakeWakeLockSentinel;
} {
  const sentinel: FakeWakeLockSentinel = {
    release: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
  };
  const request: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue(sentinel);
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  return { request, sentinel };
}

/** Lance keepScreenAwake dans un injecteur qu'on peut détruire, comme un composant qu'on quitte. */
function startKeepingScreenAwake(): EnvironmentInjector {
  const componentInjector: EnvironmentInjector = createEnvironmentInjector(
    [],
    TestBed.inject(EnvironmentInjector),
  );
  runInInjectionContext(componentInjector, () => keepScreenAwake());
  return componentInjector;
}

describe('keepScreenAwake', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock');
  });

  it("demande que l'écran reste allumé, puis le rend quand on quitte la page", async () => {
    const { request, sentinel } = installFakeWakeLock();

    const componentInjector: EnvironmentInjector = startKeepingScreenAwake();
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith('screen'));

    componentInjector.destroy();
    expect(sentinel.release).toHaveBeenCalled();
  });

  it("ne fait rien si le navigateur ne connaît pas l'API", () => {
    expect(() => startKeepingScreenAwake().destroy()).not.toThrow();
  });
});
