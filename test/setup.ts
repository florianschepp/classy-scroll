import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

export const intersectionObservers = new Map<Element, { callback: IntersectionObserverCallback, observer: IntersectionObserver }>();

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
		intersectionObservers.set(element, { callback: this.callback, observer: this as unknown as IntersectionObserver });
	});

	unobserve = vi.fn((element: Element) => {
		intersectionObservers.delete(element);
	});

	disconnect = vi.fn(() => {
		for (const [element, data] of intersectionObservers.entries()) {
			if (data.observer === (this as unknown as IntersectionObserver)) {
				intersectionObservers.delete(element);
			}
		}
	});

	takeRecords = vi.fn(() => []);
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

export const mutationObservers = new Set<MutationObserverMock>();

export class MutationObserverMock {
	callback: MutationCallback;

	constructor(callback: MutationCallback) {
		this.callback = callback;
		mutationObservers.add(this);
	}

	observe = vi.fn();
	disconnect = vi.fn(() => {
		mutationObservers.delete(this);
	});
	takeRecords = vi.fn(() => []);

	trigger(records: MutationRecord[]) {
		this.callback(records, this as unknown as MutationObserver);
	}
}

vi.stubGlobal('MutationObserver', MutationObserverMock);

export function triggerIntersect(element: Element, isIntersecting: boolean) {
	const data = intersectionObservers.get(element);
	if (data) {
		const entry: IntersectionObserverEntry = {
			target: element,
			isIntersecting,
			boundingClientRect: element.getBoundingClientRect(),
			intersectionRatio: isIntersecting ? 1 : 0,
			intersectionRect: isIntersecting ? element.getBoundingClientRect() : {
				toJSON: () => {}, bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0,
			},
			rootBounds: null,
			time: Date.now(),
		};
		data.callback([entry], data.observer);
	}
}

export function triggerMutation(addedNodes: Node[], target: Node = document.body) {
	const records: MutationRecord[] = [{
		type: 'childList',
		target,
		addedNodes: {
			length: addedNodes.length,
			item: (index: number) => addedNodes[index],
			forEach: (
				callback: (
					node: Node, 
					index: number, 
					parent: NodeList,
				) => void,
			) => {
				addedNodes.forEach(
					(node, index) => callback(
						node,
						index,
						addedNodes as unknown as NodeList,
					),
				);
			},
		} as NodeList,
		removedNodes: [] as unknown as NodeList,
		previousSibling: null,
		nextSibling: null,
		attributeName: null,
		attributeNamespace: null,
		oldValue: null,
	}];

	mutationObservers.forEach(observer => observer.trigger(records));
}

export function getObserver(element: Element) {
	return intersectionObservers.get(element)?.observer;
}
