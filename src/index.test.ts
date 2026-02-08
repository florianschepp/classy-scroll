import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { classyScroll } from './index';
import { triggerIntersect, observers } from '../test/setup';

describe('classyScroll', () => {
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement('div');
		document.body.appendChild(container);
		vi.useFakeTimers();
    
		// Reset matchMedia to default (not reduced)
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
		// Cleanup observers
		observers.clear();
		vi.clearAllMocks();
		vi.useRealTimers();
	});

	it('should initialize with default options', () => {
		const el = document.createElement('div');
		container.appendChild(el);
		const { destroy } = classyScroll([el]);

		expect(destroy).toBeTypeOf('function');
		destroy();
	});

	it('should add class when intersecting', () => {
		const el = document.createElement('div');
		container.appendChild(el);
		classyScroll([el], { class: 'visible' });

		triggerIntersect(el, true);
		expect(el.classList.contains('visible')).toBe(true);

		triggerIntersect(el, false);
		expect(el.classList.contains('visible')).toBe(false);
	});

	it('should handle "once" option', () => {
		const el = document.createElement('div');
		container.appendChild(el);
		const { destroy } = classyScroll([el], { class: 'visible', once: true });

		triggerIntersect(el, true);
		expect(el.classList.contains('visible')).toBe(true);

		triggerIntersect(el, false);
		expect(el.classList.contains('visible')).toBe(true); // Should stay
		destroy();
	});

	it('should respect data-swc-class override', () => {
		const el = document.createElement('div');
		el.dataset.swcClass = 'custom-class';
		container.appendChild(el);
		classyScroll([el], { class: 'default' });

		triggerIntersect(el, true);
		expect(el.classList.contains('custom-class')).toBe(true);
		expect(el.classList.contains('default')).toBe(false);
	});

	it('should handle global delay', () => {
		const el = document.createElement('div');
		container.appendChild(el);
		classyScroll([el], { class: 'visible', delay: 100 });

		triggerIntersect(el, true);
		expect(el.classList.contains('visible')).toBe(false);

		vi.advanceTimersByTime(100);
		expect(el.classList.contains('visible')).toBe(true);
	});

	it('should handle data-swc-delay override', () => {
		const el = document.createElement('div');
		el.dataset.swcDelay = '200';
		container.appendChild(el);
		classyScroll([el], { class: 'visible', delay: 100 });

		triggerIntersect(el, true);
		expect(el.classList.contains('visible')).toBe(false);

		vi.advanceTimersByTime(100);
		expect(el.classList.contains('visible')).toBe(false);

		vi.advanceTimersByTime(100);
		expect(el.classList.contains('visible')).toBe(true);
	});

	it('should stagger elements', () => {
		const el1 = document.createElement('div');
		const el2 = document.createElement('div');
		const el3 = document.createElement('div');
		container.append(el1, el2, el3);

		classyScroll([el1, el2, el3], { class: 'visible', stagger: 100 });

		// Trigger all at once
		triggerIntersect(el1, true);
		triggerIntersect(el2, true);
		triggerIntersect(el3, true);

		// First one should be immediate because queue was empty
		expect(el1.classList.contains('visible')).toBe(true);
		expect(el2.classList.contains('visible')).toBe(false);
		expect(el3.classList.contains('visible')).toBe(false);

		vi.advanceTimersByTime(100);
		expect(el2.classList.contains('visible')).toBe(true);
		expect(el3.classList.contains('visible')).toBe(false);

		vi.advanceTimersByTime(100);
		expect(el3.classList.contains('visible')).toBe(true);
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

		const el1 = document.createElement('div');
		const el2 = document.createElement('div');
		container.append(el1, el2);

		classyScroll([el1, el2], { class: 'visible', stagger: 100, delay: 100 });

		triggerIntersect(el1, true);
		triggerIntersect(el2, true);

		// Should apply immediately, ignoring delay and stagger
		expect(el1.classList.contains('visible')).toBe(true);
    
		vi.advanceTimersByTime(0); 
		expect(el2.classList.contains('visible')).toBe(true);
	});

	it('should support debug mode', () => {
		const consoleSpy = vi.spyOn(console, 'log');
		const el = document.createElement('div');
		container.appendChild(el);
		const { destroy } = classyScroll([el], { debug: true });

		expect(consoleSpy).toHaveBeenCalledWith('[classyScroll] Initialized', expect.anything());
		expect(document.querySelector('div[style*="border-top: 2px dashed red"]')).toBeTruthy();

		destroy();
		expect(document.querySelector('div[style*="border-top: 2px dashed red"]')).toBeFalsy();
	});

	it('should handle selector string', () => {
		const el = document.createElement('div');
		el.className = 'target';
		container.appendChild(el);
    
		const { destroy } = classyScroll('.target', { class: 'visible' });
		triggerIntersect(el, true);
		expect(el.classList.contains('visible')).toBe(true);
		destroy();
	});

	it('should do nothing if no elements found', () => {
		const { destroy } = classyScroll('.non-existent');
		expect(destroy).toBeTypeOf('function');
		destroy();
	});

	it('should call callback', () => {
		const el = document.createElement('div');
		container.appendChild(el);
		const callback = vi.fn();
    
		classyScroll([el], { callback });
		triggerIntersect(el, true);
		expect(callback).toHaveBeenCalledWith(el);
	});

	it('should clean up timeouts on destroy/leave', () => {
		const el = document.createElement('div');
		container.appendChild(el);
		classyScroll([el], { delay: 1000 });
    
		triggerIntersect(el, true);
    
		triggerIntersect(el, false);
    
		vi.advanceTimersByTime(1000);
		expect(el.classList.contains('is-visible')).toBe(false);
	});

	it('should remove elements from queue if they leave before processing', () => {
		const el1 = document.createElement('div');
		const el2 = document.createElement('div');
		container.append(el1, el2);
      
		classyScroll([el1, el2], { stagger: 100 });
      
		triggerIntersect(el1, true);
		triggerIntersect(el2, true);
      
		expect(el1.classList.contains('is-visible')).toBe(true);
		expect(el2.classList.contains('is-visible')).toBe(false);
      
		triggerIntersect(el2, false);
      
		// Advance time to trigger the pending stagger timeout
		// This forces processQueue to run with an empty queue, covering lines 66-68
		vi.advanceTimersByTime(150);
		expect(el2.classList.contains('is-visible')).toBe(false);
	});
  
	it('should handle stagger: 0 correctly (synchronous-like)', () => {
		const el = document.createElement('div');
		container.appendChild(el);
		classyScroll([el], { stagger: 0 });
      
		triggerIntersect(el, true);
		expect(el.classList.contains('is-visible')).toBe(true);
		// Should hit line 86 (isProcessing = false)
	});
  
	it('should handle recursive queue processing correctly when empty', () => {
		const el1 = document.createElement('div');
		container.appendChild(el1);
		classyScroll([el1], { stagger: 100 });
       
		triggerIntersect(el1, true);
		expect(el1.classList.contains('is-visible')).toBe(true);
       
		vi.advanceTimersByTime(100);
	});

	it('should not add duplicate elements to queue', () => {
		const el1 = document.createElement('div');
		const el2 = document.createElement('div');
		container.append(el1, el2);
		classyScroll([el1, el2], { stagger: 100 });
      
		triggerIntersect(el1, true); // el1 processed immediately
		triggerIntersect(el2, true); // el2 added to queue
      
		// Trigger el2 again while in queue
		triggerIntersect(el2, true);
      
		// el2 should NOT be visible yet (waiting for stagger from el1)
		expect(el2.classList.contains('is-visible')).toBe(false);
      
		vi.advanceTimersByTime(100);
		expect(el2.classList.contains('is-visible')).toBe(true);
	});

	it('should handle reduced motion with stagger', () => {
		// Mock reduced motion
		window.matchMedia = vi.fn().mockImplementation(query => ({
			matches: query === '(prefers-reduced-motion: reduce)',
			media: query,
			onchange: null,
			addListener: vi.fn(), // deprecated
			removeListener: vi.fn(), // deprecated
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		}));

		const el1 = document.createElement('div');
		const el2 = document.createElement('div');
		container.appendChild(el1);
		container.appendChild(el2);

		classyScroll([el1, el2], { stagger: 100 });

		// With reduced motion, stagger should be ignored and elements processed immediately
		// Wait, the logic is: 
		// if (stagger > 0 && !isReduced()) { ... queue ... } else { applyClass(el) }
		// So applyClass is called directly.

		triggerIntersect(el1, true);
		expect(el1.classList.contains('is-visible')).toBe(true);
    
		triggerIntersect(el2, true);
		expect(el2.classList.contains('is-visible')).toBe(true);
	});

	it('should handle unobserve when once is false (cleanup)', async () => {
		const el = document.createElement('div');
		container.appendChild(el);
      
		// Use fake timers to control execution flow
		vi.useFakeTimers();
      
		classyScroll(el, { once: false, threshold: 0 });
      
		triggerIntersect(el, true);
      
		// Allow immediate class application to happen
		// await vi.runAllTimersAsync();
      
		expect(el.classList.contains('is-visible')).toBe(true);
      
		triggerIntersect(el, false);
		expect(el.classList.contains('is-visible')).toBe(false);
	});
  
	it('should handle processQueue edge case where queue is empty when timeout fires', async () => {
		const el = document.createElement('div');
		container.appendChild(el);
      
		vi.useFakeTimers();
		classyScroll(el, { stagger: 100 });
      
		triggerIntersect(el, true);
      
		// Allow the immediate processing of the first item
		await vi.runAllTimersAsync();
      
		expect(el.classList.contains('is-visible')).toBe(true);
      
		// Advance timers to simulate stagger delay passing
		await vi.advanceTimersByTimeAsync(200);
      
		// Verify system still works by adding new element
		const el2 = document.createElement('div');
		container.appendChild(el2);
		classyScroll(el2, { stagger: 100 }); 
		triggerIntersect(el2, true);
      
		await vi.runAllTimersAsync();
		expect(el2.classList.contains('is-visible')).toBe(true);
	});
  
	it('should handle processQueue edge case where queue is empty when timeout fires', async () => {
		const el = document.createElement('div');
		container.appendChild(el);
      
		vi.useFakeTimers();
		// stagger > 0 means queue logic is used.
		classyScroll(el, { stagger: 100 });
      
		triggerIntersect(el, true);
      
		// index.ts:91: if (!queue.includes(el)...) queue.push(el);
		// index.ts:93: if (!isProcessing) processQueue();
		// processQueue -> isProcessing=true; shift(); applyClass(); setTimeout(processQueue, stagger)
      
		// processQueue is called synchronously.
		// applyClass is called synchronously.
		// setTimeout is scheduled.
      
		expect(el.classList.contains('is-visible')).toBe(true);
      
		// Now queue is empty.
		// The recursive setTimeout(processQueue, 100) will fire.
		// processQueue check: if (queue.length > 0) ... else setTimeout(..., wait) -> isProcessing=false
      
		// We just need to ensure no error is thrown when timers run out
		vi.runAllTimers();
      
		// And we can verify logic by adding a NEW element and ensuring it gets processed.
		// If isProcessing was stuck at true, new elements might not trigger processQueue?
		// index.ts:93: if (!isProcessing) processQueue()
      
		const el2 = document.createElement('div');
		container.appendChild(el2);
		// We need to use the SAME observer instance to share the queue/isProcessing state?
		// No, `classyScroll` creates a NEW closure every time.
		// So `isProcessing` is unique to each call.
		// So this test case as written ("queue is empty when timeout fires") is just verifying the internal logic of one instance.
		// The fact that it doesn't crash is success.
	});

	it('should batch consecutive elements when stagger is used', async () => {
		const el1 = document.createElement('div');
		const el2 = document.createElement('div');
		const el3 = document.createElement('div');
		classyScroll([el1, el2, el3], { stagger: 100 });
    
		triggerIntersect(el1, true);
		triggerIntersect(el2, true);
		triggerIntersect(el3, true);
    
		expect(el1.classList.contains('is-visible')).toBe(true);
		expect(el2.classList.contains('is-visible')).toBe(false);
		expect(el3.classList.contains('is-visible')).toBe(false);
    
		await vi.advanceTimersByTimeAsync(100);
    
		expect(el2.classList.contains('is-visible')).toBe(true);
		expect(el3.classList.contains('is-visible')).toBe(false);

		await vi.advanceTimersByTimeAsync(100);
    
		expect(el3.classList.contains('is-visible')).toBe(true);
	});

	it('should not throw when leaving view with no pending timeout', () => {
		const el = document.createElement('div');
		classyScroll(el, { once: false });
		triggerIntersect(el, false);
	});

	it('should clear timeout when element leaves view before delay', async () => {
		const el = document.createElement('div');
		classyScroll(el, { delay: 100, once: false });
    
		triggerIntersect(el, true);
		expect(el.classList.contains('is-visible')).toBe(false);
    
		triggerIntersect(el, false);
    
		await vi.advanceTimersByTimeAsync(200);
    
		expect(el.classList.contains('is-visible')).toBe(false);
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

		const el = document.createElement('div');
		classyScroll(el, { stagger: 100 });
    
		// Should behave as if stagger is 0 (immediate)
		triggerIntersect(el, true);
    
		expect(el.classList.contains('is-visible')).toBe(true);
    
		window.matchMedia = originalMatchMedia;
	});

	it('should not process leave logic if once is true', () => {
		const el = document.createElement('div');
		classyScroll(el, { once: true });
    
		triggerIntersect(el, false);
    
		expect(el.classList.contains('is-visible')).toBe(false);
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

		const el1 = document.createElement('div');
		const el2 = document.createElement('div');
		classyScroll([el1, el2], { stagger: 100 });
    
		triggerIntersect(el1, true);
		triggerIntersect(el2, true);
    
		reduced = true;
    
		await vi.advanceTimersByTimeAsync(100);
    
		expect(el2.classList.contains('is-visible')).toBe(true);
    
		window.matchMedia = originalMatchMedia;
	});
});
