import { vi } from 'vitest';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
export const observers = new Map<Element, { callback: IntersectionObserverCallback, observer: IntersectionObserver }>();

export class IntersectionObserverMock {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options;
  }

  root = null;
  rootMargin = this.options?.rootMargin || '';
  thresholds = this.options?.threshold ? (Array.isArray(this.options.threshold) ? this.options.threshold : [this.options.threshold]) : [];

  observe = vi.fn((element: Element) => {
    // console.log('Mock observe', element);
    observers.set(element, { callback: this.callback, observer: this as unknown as IntersectionObserver });
  });

  unobserve = vi.fn((element: Element) => {
    observers.delete(element);
  });

  disconnect = vi.fn(() => {
    // Inefficient but works for simple mock
    for (const [el, data] of observers.entries()) {
      if (data.observer === (this as unknown as IntersectionObserver)) {
        observers.delete(el);
      }
    }
  });

  takeRecords = vi.fn(() => []);
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Helper to trigger intersection
export function triggerIntersect(element: Element, isIntersecting: boolean) {
  const data = observers.get(element);
  if (data) {
    const entry: IntersectionObserverEntry = {
      target: element,
      isIntersecting,
      boundingClientRect: element.getBoundingClientRect(),
      intersectionRatio: isIntersecting ? 1 : 0,
      intersectionRect: isIntersecting ? element.getBoundingClientRect() : {
        toJSON: () => {}, bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0
      },
      rootBounds: null,
      time: Date.now(),
    };
    // Wrap in act if using React testing library, but here we are vanilla
    data.callback([entry], data.observer);
  }
}

export function getObserver(element: Element) {
  return observers.get(element)?.observer;
}
