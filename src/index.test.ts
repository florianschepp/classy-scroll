import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { classyScroll } from './index';
import { triggerIntersect, intersectionObservers, getObserver } from '../test/setup';

describe('classyScroll', () => {
    let container: HTMLElement;
    let testIdCounter = 0;

    const createElement = (className = '') => {
        const el = document.createElement('div');
        el.className = className;
        el.dataset.testid = `test-${testIdCounter++}`;
        container.appendChild(el);
        return el;
    };

    const getGhost = (element: HTMLElement) => {
        const testId = element.dataset.testid;
        return document.querySelector(`[data-testid="${testId}"][data-cs-ghost="true"]`) as HTMLElement;
    };

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        vi.useFakeTimers();

        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        window.devicePixelRatio = 1;
        vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 16)));
        vi.stubGlobal('cancelAnimationFrame', vi.fn(clearTimeout));
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            fillText: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            measureText: vi.fn(() => ({ width: 50 })),
            scale: vi.fn(),
            setLineDash: vi.fn()
        })) as any;
    });

    afterEach(() => {
        document.body.removeChild(container);
        document.querySelectorAll('[data-cs-ghost="true"]').forEach(el => el.remove());

        intersectionObservers.clear();
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('should initialize with default options', () => {
        const element = createElement();
        const { destroy } = classyScroll([element]);

        expect(destroy).toBeTypeOf('function');
        destroy();
    });

    it('should safely handle null or undefined input', () => {
        const { destroy: destroyNull } = classyScroll(null);
        expect(destroyNull).toBeTypeOf('function');
        destroyNull();

        const { destroy: destroyUndefined } = classyScroll(undefined);
        expect(destroyUndefined).toBeTypeOf('function');
        destroyUndefined();
    });

    it('should handle HTMLCollection input', () => {
        const element = createElement('collection-item');
        const collection = container.getElementsByClassName('collection-item');
        const { destroy } = classyScroll(collection);

        expect(getObserver(getGhost(element))).toBeDefined();
        destroy();
    });

    it('should add class when intersecting', () => {
        const element = createElement();
        classyScroll([element], { class: 'visible', persistent: false });

        triggerIntersect(getGhost(element), true);
        expect(element.classList.contains('visible')).toBe(true);

        triggerIntersect(getGhost(element), false);
        expect(element.classList.contains('visible')).toBe(false);
    });

    it('should handle "persistent" option', () => {
        const element = createElement();
        const { destroy } = classyScroll([element], { class: 'visible', persistent: true });

        triggerIntersect(getGhost(element), true);
        expect(element.classList.contains('visible')).toBe(true);

        triggerIntersect(getGhost(element), false);
        expect(element.classList.contains('visible')).toBe(true);
        destroy();
    });

    it('should respect data-cs-class override', () => {
        const element = createElement();
        element.dataset.csClass = 'custom-class';
        classyScroll([element], { class: 'default' });

        triggerIntersect(getGhost(element), true);
        expect(element.classList.contains('custom-class')).toBe(true);
        expect(element.classList.contains('default')).toBe(false);
    });

    it('should handle global delay', () => {
        const element = createElement();
        classyScroll([element], { class: 'visible', delay: 100 });

        triggerIntersect(getGhost(element), true);
        expect(element.classList.contains('visible')).toBe(false);

        vi.advanceTimersByTime(100);
        expect(element.classList.contains('visible')).toBe(true);
    });

    it('should handle data-cs-delay override', () => {
        const element = createElement();
        element.dataset.csDelay = '200';
        classyScroll([element], { class: 'visible', delay: 100 });

        triggerIntersect(getGhost(element), true);
        expect(element.classList.contains('visible')).toBe(false);

        vi.advanceTimersByTime(100);
        expect(element.classList.contains('visible')).toBe(false);

        vi.advanceTimersByTime(100);
        expect(element.classList.contains('visible')).toBe(true);
    });

    it('should stagger elements', () => {
        const element1 = createElement();
        const element2 = createElement();
        const element3 = createElement();

        classyScroll([element1, element2, element3], { class: 'visible', stagger: 100 });

        triggerIntersect(getGhost(element1), true);
        triggerIntersect(getGhost(element2), true);
        triggerIntersect(getGhost(element3), true);

        expect(element1.classList.contains('visible')).toBe(true);
        expect(element2.classList.contains('visible')).toBe(false);
        expect(element3.classList.contains('visible')).toBe(false);

        vi.advanceTimersByTime(100);
        expect(element2.classList.contains('visible')).toBe(true);
        expect(element3.classList.contains('visible')).toBe(false);

        vi.advanceTimersByTime(100);
        expect(element3.classList.contains('visible')).toBe(true);
    });

    it('should disable stagger and delay if prefers-reduced-motion matches', () => {
        window.matchMedia = vi.fn().mockImplementation(query => ({
            matches: query === '(prefers-reduced-motion: reduce)',
        }));

        const element1 = createElement();
        const element2 = createElement();

        classyScroll([element1, element2], { class: 'visible', stagger: 100, delay: 100 });

        triggerIntersect(getGhost(element1), true);
        triggerIntersect(getGhost(element2), true);

        expect(element1.classList.contains('visible')).toBe(true);

        vi.advanceTimersByTime(0);
        expect(element2.classList.contains('visible')).toBe(true);
    });

    it('should handle debug mode rendering and cleanup', () => {
        const element = createElement();
        const { destroy } = classyScroll([element], { debug: true, rootMargin: '10px 0px -10% 0px' });

        const debugCanvas = document.querySelector('canvas');
        expect(debugCanvas).toBeTruthy();
        expect(debugCanvas?.style.position).toBe('fixed');
        expect(debugCanvas?.style.zIndex).toBe('2147483646');

        destroy();

        expect(document.querySelector('canvas')).toBeNull();
    });

    it('should call callback', () => {
        const element = createElement();
        const callback = vi.fn();

        classyScroll([element], { callback });
        triggerIntersect(getGhost(element), true);
        expect(callback).toHaveBeenCalledWith(element);
    });

    it('should clean up timeouts on destroy/leave', () => {
        const element = createElement();
        classyScroll([element], { delay: 1000, persistent: false });

        triggerIntersect(getGhost(element), true);
        triggerIntersect(getGhost(element), false);

        vi.advanceTimersByTime(1000);
        expect(element.classList.contains('is-visible')).toBe(false);
    });

    it('should handle unobserve when persistent is false', async () => {
        const element = createElement();
        classyScroll(element, { persistent: false, threshold: 0 });

        triggerIntersect(getGhost(element), true);
        await vi.runAllTimersAsync();
        expect(element.classList.contains('is-visible')).toBe(true);

        triggerIntersect(getGhost(element), false);
        expect(element.classList.contains('is-visible')).toBe(false);
    });
});
