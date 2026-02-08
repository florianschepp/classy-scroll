export interface classyScrollOptions {
	/** Space-separated classes to add when element is in view */
	class?: string;
	/** Visibility threshold (0.0 to 1.0). Default: 0.1 */
	threshold?: number | number[];
	/** Margin around the root element. Default: '0px' */
	rootMargin?: string;
	/** If true, only trigger once. Default: false */
	once?: boolean;
	/** Delay in ms between elements in the same batch. Default: 0 */
	stagger?: number;
	/** Global delay in ms before animation starts. Default: 0 */
	delay?: number;
	/** Enable debug overlay. Default: false */
	debug?: boolean;
	/** Callback when element intersects */
	callback?: (element: HTMLElement) => void;
}

export function classyScroll(
	elements: string | NodeListOf<HTMLElement> | HTMLElement[] | HTMLElement,
	options: classyScrollOptions = {},
): { destroy: () => void } {
	const {
		class: className = 'is-visible',
		threshold = 0.1,
		rootMargin = '0px',
		once = false,
		stagger = 0,
		delay = 0,
		debug = false,
		callback,
	} = options;

	const elList = typeof elements === 'string'
		? document.querySelectorAll(elements)
		: (elements instanceof HTMLElement ? [elements] : elements);
  
	const targets = Array.from(elList) as HTMLElement[];
	if (targets.length === 0) return { destroy: () => {} };

	const queue: HTMLElement[] = [];
	let isProcessing = false;
	const timeouts = new WeakMap<HTMLElement, number>();

	const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const applyClass = (el: HTMLElement) => {
		const elClass = el.dataset.swcClass || className;
		const elDelay = parseInt(el.dataset.swcDelay || '0', 10) || delay;
    
		const doApply = () => {
			el.classList.add(...elClass.split(' '));
			if (callback) callback(el);
		};

		if (elDelay > 0 && !isReduced()) {
			const id = window.setTimeout(doApply, elDelay);
			timeouts.set(el, id);
		} else {
			// console.log('applyClass immediate', el);
			doApply();
		}
	};

	const processQueue = () => {
		// console.log('Processing queue, length:', queue.length);
		isProcessing = true;
		const el = queue.shift() as HTMLElement;
		applyClass(el);

		const wait = isReduced() ? 0 : stagger;
    
		if (queue.length > 0) {
			setTimeout(processQueue, wait);
		} else {
			// Wait to see if more elements are added (batching)
			setTimeout(() => { 
				if (queue.length > 0) processQueue(); 
				else isProcessing = false; 
			}, wait);
		}
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			// console.log('IntersectionObserver callback', entry.isIntersecting, entry.target);
			const el = entry.target as HTMLElement;
      
			if (entry.isIntersecting) {
				if (once) observer.unobserve(el);
        
				if (stagger > 0 && !isReduced()) {
					if (!queue.includes(el) && !el.classList.contains(className.split(' ')[0])) {
						// console.log('Pushing to queue', el);
						queue.push(el);
						if (!isProcessing) processQueue();
					}
				} else {
					applyClass(el);
				}
			} else {
				if (!once) {
					const qIdx = queue.indexOf(el);
					if (qIdx > -1) queue.splice(qIdx, 1);
          
					const tid = timeouts.get(el);
					if (tid) {
						clearTimeout(tid);
						timeouts.delete(el);
					}

					const elClass = el.dataset.swcClass || className;
					el.classList.remove(...elClass.split(' '));
				}
			}
		});
	}, { threshold, rootMargin });

	targets.forEach(el => observer.observe(el));

	let debugEl: HTMLElement | null = null;
	if (debug) {
		console.log('[classyScroll] Initialized', { elements: targets.length, options });
		debugEl = document.createElement('div');
		Object.assign(debugEl.style, {
			position: 'fixed',
			top: '50%',
			left: '0',
			width: '100%',
			height: '0',
			borderTop: '2px dashed red',
			zIndex: 9999,
			pointerEvents: 'none',
		});
		debugEl.textContent = 'Trigger Line (approx)';
		document.body.appendChild(debugEl);
	}

	return {
		destroy: () => {
			observer.disconnect();
			if (debugEl) debugEl.remove();
			queue.length = 0;
		},
	};
}
