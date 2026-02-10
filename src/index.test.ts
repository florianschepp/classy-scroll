import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { classyScroll } from './index';
import { triggerIntersect, triggerMutation, intersectionObservers, mutationObservers, getObserver } from '../test/setup';

describe('classyScroll', () => {
	let container: HTMLElement;

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
	});

	afterEach(() => {
		document.body.removeChild(container);
		intersectionObservers.clear();
		mutationObservers.clear();
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	it('should initialize with default options', () => {
		const element = document.createElement('div');
		container.appendChild(element);
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
		const element = document.createElement('div');
		element.className = 'collection-item';
		container.appendChild(element);
		
		const collection = container.getElementsByClassName('collection-item');
		const { destroy } = classyScroll(collection);
		
		expect(getObserver(element)).toBeDefined();
		destroy();
	});

	it('should add class when intersecting', () => {
		const element = document.createElement('div');
		container.appendChild(element);
		classyScroll([element], { class: 'visible' });

		triggerIntersect(element, true);
		expect(element.classList.contains('visible')).toBe(true);

		triggerIntersect(element, false);
		expect(element.classList.contains('visible')).toBe(false);
	});

	it('should handle "once" option', () => {
		const element = document.createElement('div');
		container.appendChild(element);
		const { destroy } = classyScroll([element], { class: 'visible', once: true });

		triggerIntersect(element, true);
		expect(element.classList.contains('visible')).toBe(true);

		triggerIntersect(element, false);
		expect(element.classList.contains('visible')).toBe(true);
		destroy();
	});

	it('should respect data-cs-class override', () => {
		const element = document.createElement('div');
		element.dataset.csClass = 'custom-class';
		container.appendChild(element);
		classyScroll([element], { class: 'default' });

		triggerIntersect(element, true);
		expect(element.classList.contains('custom-class')).toBe(true);
		expect(element.classList.contains('default')).toBe(false);
	});

	it('should handle global delay', () => {
		const element = document.createElement('div');
		container.appendChild(element);
		classyScroll([element], { class: 'visible', delay: 100 });

		triggerIntersect(element, true);
		expect(element.classList.contains('visible')).toBe(false);

		vi.advanceTimersByTime(100);
		expect(element.classList.contains('visible')).toBe(true);
	});

	it('should handle data-cs-delay override', () => {
		const element = document.createElement('div');
		element.dataset.csDelay = '200';
		container.appendChild(element);
		classyScroll([element], { class: 'visible', delay: 100 });

		triggerIntersect(element, true);
		expect(element.classList.contains('visible')).toBe(false);

		vi.advanceTimersByTime(100);
		expect(element.classList.contains('visible')).toBe(false);

		vi.advanceTimersByTime(100);
		expect(element.classList.contains('visible')).toBe(true);
	});

	it('should stagger elements', () => {
		const element1 = document.createElement('div');
		const element2 = document.createElement('div');
		const element3 = document.createElement('div');
		container.append(element1, element2, element3);

		classyScroll([element1, element2, element3], { class: 'visible', stagger: 100 });

		triggerIntersect(element1, true);
		triggerIntersect(element2, true);
		triggerIntersect(element3, true);

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
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));

		const element1 = document.createElement('div');
		const element2 = document.createElement('div');
		container.append(element1, element2);

		classyScroll([element1, element2], { class: 'visible', stagger: 100, delay: 100 });

		triggerIntersect(element1, true);
		triggerIntersect(element2, true);

		expect(element1.classList.contains('visible')).toBe(true);
		
		vi.advanceTimersByTime(0); 
		expect(element2.classList.contains('visible')).toBe(true);
	});

	it('should support debug mode', () => {
		const element = document.createElement('div');
		container.appendChild(element);
		const { destroy } = classyScroll([element], { debug: true, rootMargin: '10px 0px -10% 0px' });

		const viewportZones = document.querySelectorAll('div[style*="position: fixed"]');
		expect(viewportZones.length).toBe(2); 

		const elementDebugMarkers = element.querySelectorAll('div[data-cs-debug="true"]');
		expect(elementDebugMarkers.length).toBe(2); 

		destroy();
		
		expect(document.querySelectorAll('div[style*="position: fixed"]').length).toBe(0);
		expect(element.querySelectorAll('div[data-cs-debug="true"]').length).toBe(0);
	});

	it('should handle selector string', () => {
		const element = document.createElement('div');
		element.className = 'target';
		container.appendChild(element);
		
		const { destroy } = classyScroll('.target', { class: 'visible' });
		triggerIntersect(element, true);
		expect(element.classList.contains('visible')).toBe(true);
		destroy();
	});

	it('should do nothing if no elements found', () => {
		const { destroy } = classyScroll('.non-existent');
		expect(destroy).toBeTypeOf('function');
		destroy();
	});

	it('should call callback', () => {
		const element = document.createElement('div');
		container.appendChild(element);
		const callback = vi.fn();
  
		classyScroll([element], { callback });
		triggerIntersect(element, true);
		expect(callback).toHaveBeenCalledWith(element);
	});

	it('should clean up timeouts on destroy/leave', () => {
		const element = document.createElement('div');
		container.appendChild(element);
		classyScroll([element], { delay: 1000 });
  
		triggerIntersect(element, true);
		triggerIntersect(element, false);
  
		vi.advanceTimersByTime(1000);
		expect(element.classList.contains('is-visible')).toBe(false);
	});

	it('should remove elements from queue if they leave before processing', () => {
		const element1 = document.createElement('div');
		const element2 = document.createElement('div');
		container.append(element1, element2);
  
		classyScroll([element1, element2], { stagger: 100 });
  
		triggerIntersect(element1, true);
		triggerIntersect(element2, true);
  
		expect(element1.classList.contains('is-visible')).toBe(true);
		expect(element2.classList.contains('is-visible')).toBe(false);
  
		triggerIntersect(element2, false);
  
		vi.advanceTimersByTime(150);
		expect(element2.classList.contains('is-visible')).toBe(false);
	});

	it('should handle stagger: 0 correctly', () => {
		const element = document.createElement('div');
		container.appendChild(element);
		classyScroll([element], { stagger: 0 });
  
		triggerIntersect(element, true);
		expect(element.classList.contains('is-visible')).toBe(true);
	});

	it('should handle recursive queue processing correctly when empty', () => {
		const element = document.createElement('div');
		container.appendChild(element);
		classyScroll([element], { stagger: 100 });
  
		triggerIntersect(element, true);
		expect(element.classList.contains('is-visible')).toBe(true);
  
		vi.advanceTimersByTime(100);
	});

	it('should not add duplicate elements to queue', () => {
		const element1 = document.createElement('div');
		const element2 = document.createElement('div');
		container.append(element1, element2);
		classyScroll([element1, element2], { stagger: 100 });
  
		triggerIntersect(element1, true);
		triggerIntersect(element2, true);
		triggerIntersect(element2, true);
  
		expect(element2.classList.contains('is-visible')).toBe(false);
  
		vi.advanceTimersByTime(100);
		expect(element2.classList.contains('is-visible')).toBe(true);
	});

	it('should handle reduced motion with stagger', () => {
		window.matchMedia = vi.fn().mockImplementation(query => ({
			matches: query === '(prefers-reduced-motion: reduce)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));

		const element1 = document.createElement('div');
		const element2 = document.createElement('div');
		container.appendChild(element1);
		container.appendChild(element2);

		classyScroll([element1, element2], { stagger: 100 });

		triggerIntersect(element1, true);
		expect(element1.classList.contains('is-visible')).toBe(true);
  
		triggerIntersect(element2, true);
		expect(element2.classList.contains('is-visible')).toBe(true);
	});

	it('should handle unobserve when once is false', async () => {
		const element = document.createElement('div');
		container.appendChild(element);
		vi.useFakeTimers();
		
		classyScroll(element, { once: false, threshold: 0 });
  
		triggerIntersect(element, true);
		await vi.runAllTimersAsync();
		expect(element.classList.contains('is-visible')).toBe(true);
  
		triggerIntersect(element, false);
		expect(element.classList.contains('is-visible')).toBe(false);
	});

	it('should handle processQueue edge case where queue is empty when timeout fires', async () => {
		const element = document.createElement('div');
		container.appendChild(element);
		vi.useFakeTimers();
		classyScroll(element, { stagger: 100 });
  
		triggerIntersect(element, true);
		await vi.runAllTimersAsync();
		expect(element.classList.contains('is-visible')).toBe(true);
  
		await vi.advanceTimersByTimeAsync(200);
  
		const element2 = document.createElement('div');
		container.appendChild(element2);
		classyScroll(element2, { stagger: 100 }); 
		triggerIntersect(element2, true);
  
		await vi.runAllTimersAsync();
		expect(element2.classList.contains('is-visible')).toBe(true);
	});

	it('should batch consecutive elements when stagger is used', async () => {
		const element1 = document.createElement('div');
		const element2 = document.createElement('div');
		const element3 = document.createElement('div');
		classyScroll([element1, element2, element3], { stagger: 100 });
  
		triggerIntersect(element1, true);
		triggerIntersect(element2, true);
		triggerIntersect(element3, true);
  
		expect(element1.classList.contains('is-visible')).toBe(true);
		expect(element2.classList.contains('is-visible')).toBe(false);
		expect(element3.classList.contains('is-visible')).toBe(false);
  
		await vi.advanceTimersByTimeAsync(100);
  
		expect(element2.classList.contains('is-visible')).toBe(true);
		expect(element3.classList.contains('is-visible')).toBe(false);

		await vi.advanceTimersByTimeAsync(100);
  
		expect(element3.classList.contains('is-visible')).toBe(true);
	});

	it('should not throw when leaving view with no pending timeout', () => {
		const element = document.createElement('div');
		classyScroll(element, { once: false });
		triggerIntersect(element, false);
	});

	it('should clear timeout when element leaves view before delay', async () => {
		const element = document.createElement('div');
		classyScroll(element, { delay: 100, once: false });
  
		triggerIntersect(element, true);
		expect(element.classList.contains('is-visible')).toBe(false);
  
		triggerIntersect(element, false);
		await vi.advanceTimersByTimeAsync(200);
		expect(element.classList.contains('is-visible')).toBe(false);
	});

	it('should respect prefers-reduced-motion', () => {
		const originalMatchMedia = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: query === '(prefers-reduced-motion: reduce)',
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));

		const element = document.createElement('div');
		classyScroll(element, { stagger: 100 });
  
		triggerIntersect(element, true);
		expect(element.classList.contains('is-visible')).toBe(true);
  
		window.matchMedia = originalMatchMedia;
	});

	it('should not process leave logic if once is true', () => {
		const element = document.createElement('div');
		classyScroll(element, { once: true });
  
		triggerIntersect(element, false);
		expect(element.classList.contains('is-visible')).toBe(false);
	});

	it('should handle dynamic change of prefers-reduced-motion', async () => {
		let reduced = false;
		const originalMatchMedia = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((query) => ({
			matches: query === '(prefers-reduced-motion: reduce)' && reduced,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));

		const element1 = document.createElement('div');
		const element2 = document.createElement('div');
		container.appendChild(element1);
		container.appendChild(element2);

		classyScroll([element1, element2], { stagger: 100 });
  
		triggerIntersect(element1, true);
		triggerIntersect(element2, true);
  
		reduced = true;
  
		await vi.advanceTimersByTimeAsync(100);
		expect(element2.classList.contains('is-visible')).toBe(true);
  
		window.matchMedia = originalMatchMedia;
	});

	it('should observe dynamically added elements when using selector string', () => {
		const selector = '.dynamic-target';
		const { destroy } = classyScroll(selector);

		const newElement = document.createElement('div');
		newElement.className = 'dynamic-target';
		container.appendChild(newElement);

		triggerMutation([newElement]);
		expect(getObserver(newElement)).toBeDefined();
		destroy();
	});

	it('should observe matching nested elements in dynamically added containers', () => {
		const selector = '.nested-target';
		const { destroy } = classyScroll(selector);

		const wrapper = document.createElement('div');
		const nestedElement = document.createElement('div');
		nestedElement.className = 'nested-target';
		wrapper.appendChild(nestedElement);
		container.appendChild(wrapper);

		triggerMutation([wrapper]);
		expect(getObserver(nestedElement)).toBeDefined();
		destroy();
	});

	it('should NOT observe dynamically added elements when using element array', () => {
		const existingElement = document.createElement('div');
		container.appendChild(existingElement);
		const { destroy } = classyScroll([existingElement]);

		const newElement = document.createElement('div');
		container.appendChild(newElement);

		triggerMutation([newElement]);
		expect(getObserver(newElement)).toBeUndefined();
		destroy();
	});
});
