/**
 * Configuration options for the ClassyScroll instance.
 */
export interface ClassyScrollOptions {
	/** Space-separated classes to add when element is in view. Default: 'is-visible' */
	class?: string;
	/** Fraction of the element (0.0–1.0) that must be visible to trigger. Default: 0.1 */
	threshold?: number;
	/** Margin around the root element (e.g. "10px 0px"). Default: '0px' */
	rootMargin?: string;
	/** If true, the class stays after being added. If false, the class toggles on/off as you scroll. Default: true */
	persistent?: boolean;
	/** Delay in ms between elements in the same batch. Default: 0 */
	stagger?: number;
	/** Global delay in ms before animation starts. Default: 0 */
	delay?: number;
	/** Enable debug overlay to visualize trigger zones. Default: false */
	debug?: boolean;
	/** Callback fired when element intersects. */
	callback?: (element: HTMLElement) => void;
}

/**
 * Supported target types for initialization.
 * Can be a CSS selector string, a single DOM Element, a NodeList, or an array of Elements.
 */
export type ClassyTargets = string | Element | ArrayLike<Element> | null | undefined;

type ElementState = {
	ghost: HTMLElement;
	timeoutId?: number;
	top: number;
	height: number;
};

/**
 * Initializes a high-performance scroll observer.
 * * @param targetInput - A CSS selector string, HTMLElement, NodeList, or Array of elements.
 * @param options - Configuration options to customize the scroll behavior.
 * @returns An object containing a `destroy()` method to cleanly remove observers and event listeners.
 */
export function classyScroll(
	targetInput: ClassyTargets,
	options: ClassyScrollOptions = {},
): { destroy: () => void } {
	const config = {
		className: options.class || 'is-visible',
		threshold: options.threshold ?? 0.1,
		rootMargin: options.rootMargin || '0px',
		persistent: options.persistent ?? true,
		stagger: options.stagger ?? 0,
		delay: options.delay ?? 0,
		debug: options.debug ?? false,
	};

	const debugName = typeof targetInput === 'string' ? targetInput : 'Element';
	const trackedElements = new Map<HTMLElement, ElementState>();
	const queue: HTMLElement[] = [];
	let isProcessingQueue = false;

	const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const getComputedTranslate = (el: HTMLElement): { x: number; y: number } => {
		const transform = getComputedStyle(el).transform;
		if (!transform || transform === 'none') return { x: 0, y: 0 };
		const matrix = transform.match(/^matrix(?:3d)?\((.+)\)$/);
		if (!matrix) return { x: 0, y: 0 };
		const valueues = matrix[1].split(', ').map(Number);
		return valueues.length === 16
			? { x: valueues[12] || 0, y: valueues[13] || 0 }
			: { x: valueues[4] || 0, y: valueues[5] || 0 };
	};

	const createGhost = (element: HTMLElement): ElementState => {
		const rect = element.getBoundingClientRect();
		const naturalTranslate = getComputedTranslate(element);

		const layoutTop = rect.top + window.scrollY - naturalTranslate.y;
		const layoutLeft = rect.left + window.scrollX - naturalTranslate.x;

		const ghost = element.cloneNode(false) as HTMLElement;
		const activeClasses = (element.dataset.csClass || config.className).split(' ');
		ghost.classList.remove(...activeClasses);

		Object.assign(ghost.style, {
			position: 'absolute',
			top: `${layoutTop}px`,
			left: `${layoutLeft}px`,
			width: `${rect.width}px`,
			height: `${rect.height}px`,
			visibility: 'hidden',
			pointerEvents: 'none',
			margin: '0',
			transform: 'none',
			transition: 'none',
			animation: 'none',
			zIndex: '-1',
		});

		ghost.setAttribute('aria-hidden', 'true');
		ghost.dataset.csGhost = 'true';
		document.body.appendChild(ghost);

		return {
			ghost,
			top: layoutTop,
			height: rect.height,
		};
	};

	const applyClass = (element: HTMLElement) => {
		const elementClass = element.dataset.csClass || config.className;
		const elementDelay = parseInt(element.dataset.csDelay || '0', 10) || config.delay;

		const execute = () => {
			element.classList.add(...elementClass.split(' '));
			options.callback?.(element);
		};

		if (elementDelay > 0 && !isReducedMotion()) {
			const id = window.setTimeout(execute, elementDelay);
			const state = trackedElements.get(element);
			if (state) state.timeoutId = id;
		} else {
			execute();
		}
	};

	const processQueue = () => {
		if (queue.length === 0) {
			isProcessingQueue = false;
			return;
		}

		isProcessingQueue = true;
		const element = queue.shift()!;
		applyClass(element);

		const wait = isReducedMotion() ? 0 : config.stagger;
		setTimeout(processQueue, wait);
	};

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			const target = entry.target as HTMLElement;
			const element = Array.from(trackedElements.entries())
				.find(([, state]) => state.ghost === target)?.[0] ?? target;

			if (entry.isIntersecting) {
				if (config.persistent) observer.unobserve(target);

				const classes = (element.dataset.csClass || config.className).split(' ');
				const isAlreadyActive = element.classList.contains(classes[0]);

				if (config.stagger > 0 && !isReducedMotion() && !queue.includes(element) && !isAlreadyActive) {
					queue.push(element);
					if (!isProcessingQueue) processQueue();
				} else if (!isAlreadyActive) {
					applyClass(element);
				}
			} else if (!config.persistent) {
				const queueIndex = queue.indexOf(element);
				if (queueIndex > -1) queue.splice(queueIndex, 1);

				const state = trackedElements.get(element);
				if (state?.timeoutId) {
					clearTimeout(state.timeoutId);
					state.timeoutId = undefined;
				}

				const classes = (element.dataset.csClass || config.className).split(' ');
				element.classList.remove(...classes);
			}
		});
	}, { threshold: config.threshold, rootMargin: config.rootMargin });

	const register = (element: HTMLElement) => {
		if (trackedElements.has(element)) return;
		const state = createGhost(element);
		trackedElements.set(element, state);
		observer.observe(state.ghost);
	};

	const resolveTargets = () => {
		if (typeof targetInput === 'string') {
			document.querySelectorAll(targetInput).forEach(el => register(el as HTMLElement));
		} else if (targetInput instanceof Element) {
			register(targetInput as HTMLElement);
		} else if (targetInput && (targetInput as ArrayLike<Element>).length) {
			Array.from(targetInput as ArrayLike<Element>).forEach(el => register(el as HTMLElement));
		}
	};

	let resizeTimer: number;
	const onResize = () => {
		clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(() => {
			trackedElements.forEach((state, element) => {
				observer.unobserve(state.ghost);
				state.ghost.remove();
				const newState = createGhost(element);
				trackedElements.set(element, { ...state, ...newState });
				observer.observe(newState.ghost);
			});
			if (config.debug) resizeCanvas();
		}, 150);
	};
	window.addEventListener('resize', onResize, { passive: true });

	let canvas: HTMLCanvasElement | null = null;
	let ctx: CanvasRenderingContext2D | null = null;
	let drawFrame: number;

	const parseMargins = (margin: string) => {
		const parts = margin.split(' ').map(p => parseFloat(p) || 0);
		const viewportHeight = window.innerHeight;
		const isPercent = (value: string) => value.includes('%');
		const raw = margin.split(' ');

		const calc = (value: number, marginString: string) => isPercent(marginString) ? (value / 100) * viewportHeight : value;

		if (parts.length === 1) return { top: calc(parts[0], raw[0]), bottom: calc(parts[0], raw[0]) };
		if (parts.length === 2) return { top: calc(parts[0], raw[0]), bottom: calc(parts[0], raw[0]) };
		if (parts.length === 3) return { top: calc(parts[0], raw[0]), bottom: calc(parts[2], raw[2]) };

		return { top: calc(parts[0], raw[0]), bottom: calc(parts[2], raw[2]) };
	};

	const resizeCanvas = () => {
		if (!canvas || !ctx) return;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = window.innerWidth * dpr;
		canvas.height = window.innerHeight * dpr;
		ctx.scale(dpr, dpr);
	};

	const drawDebugOverlay = () => {
		if (!ctx || !canvas) return;

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		ctx.clearRect(0, 0, viewportWidth, viewportHeight);

		const scrollY = window.scrollY;
		const margins = parseMargins(config.rootMargin);

		const drawLabel = (text: string, yPos: number, color: string, position: 'above' | 'below' = 'above') => {
			ctx!.font = 'bold 10px system-ui, -apple-system, sans-serif';
			ctx!.textAlign = 'right';
			ctx!.textBaseline = 'middle';

			const paddingX = 12;
			const textWidth = ctx!.measureText(text).width;
			const boxWidth = textWidth + paddingX;
			const boxHeight = 18;

			const x = viewportWidth;
			const y = position === 'above' ? yPos - boxHeight : yPos;

			ctx!.fillStyle = color;
			ctx!.fillRect(x - boxWidth, y, boxWidth, boxHeight);

			ctx!.fillStyle = '#ffffff';
			ctx!.fillText(text, x - (paddingX / 2), y + (boxHeight / 2));
		};

		ctx.lineWidth = 2;

		ctx.setLineDash([5, 5]);

		const topY = -margins.top;
		ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
		ctx.beginPath();
		ctx.moveTo(0, topY);
		ctx.lineTo(viewportWidth, topY);
		ctx.stroke();
		drawLabel(`[${debugName}] Exit: ${config.rootMargin}`, topY, 'rgba(239, 68, 68, 0.9)', 'below');

		const bottomY = viewportHeight + margins.bottom;
		ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)';
		ctx.beginPath();
		ctx.moveTo(0, bottomY);
		ctx.lineTo(viewportWidth, bottomY);
		ctx.stroke();
		drawLabel(`[${debugName}] Entry: ${config.rootMargin}`, bottomY, 'rgba(34, 197, 94, 0.9)', 'above');

		ctx.setLineDash([]);
		trackedElements.forEach((state) => {
			const yEnter = (state.top + (state.height * config.threshold)) - scrollY;
			const yExit = (state.top + state.height - (state.height * config.threshold)) - scrollY;

			if (yEnter > -50 && yEnter < viewportHeight + 50) {
				ctx!.fillStyle = '#2563eb';
				ctx!.fillRect(viewportWidth - 120, yEnter, 120, 2);
				drawLabel(`[${debugName}] Enter: ${Math.round(config.threshold * 100)}%`, yEnter, '#2563eb', 'above');
			}

			if (!config.persistent && yExit > -50 && yExit < viewportHeight + 50) {
				ctx!.fillStyle = '#2563eb';
				ctx!.fillRect(viewportWidth - 120, yExit, 120, 2);
				drawLabel(`[${debugName}] Exit: ${Math.round(config.threshold * 100)}%`, yExit, '#2563eb', 'above');
			}
		});

		drawFrame = requestAnimationFrame(drawDebugOverlay);
	};
	if (config.debug) {
		canvas = document.createElement('canvas');
		Object.assign(canvas.style, {
			position: 'fixed', top: '0', left: '0',
			width: '100vw', height: '100vh',
			pointerEvents: 'none', zIndex: '2147483646',
		});
		document.body.appendChild(canvas);
		ctx = canvas.getContext('2d');
		if (ctx) ctx.font = '10px monospace';
		resizeCanvas();
		drawDebugOverlay();
	}

	resolveTargets();

	return {
		destroy: () => {
			window.removeEventListener('resize', onResize);
			clearTimeout(resizeTimer);
			observer.disconnect();

			if (config.debug) {
				cancelAnimationFrame(drawFrame);
				canvas?.remove();
			}

			trackedElements.forEach((state) => {
				state.ghost.remove();
				if (state.timeoutId) clearTimeout(state.timeoutId);
			});

			trackedElements.clear();
			queue.length = 0;
		},
	};
}
