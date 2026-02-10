export interface classyScrollOptions {
    class?: string;
    threshold?: number | number[];
    rootMargin?: string;
    once?: boolean;
    stagger?: number;
    delay?: number;
    debug?: boolean;
    callback?: (element: HTMLElement) => void;
}

export type ClassyTargets = string | Element | ArrayLike<Element> | null | undefined;

export function classyScroll(
    targetInput: ClassyTargets,
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

    const trackedElements = new WeakSet<HTMLElement>();
    const globalDebugElements: HTMLElement[] = [];

    const queue: HTMLElement[] = [];
    let isProcessing = false;
    const timeouts = new WeakMap<HTMLElement, number>();
    const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const applyClass = (element: HTMLElement) => {
        const elementClass = element.dataset.csClass || className;
        const elementDelay = parseInt(element.dataset.csDelay || '0', 10) || delay;
        const doApply = () => {
            element.classList.add(...elementClass.split(' '));
            if (callback) callback(element);
        };
        if (elementDelay > 0 && !isReduced()) {
            const id = window.setTimeout(doApply, elementDelay);
            timeouts.set(element, id);
        } else {
            doApply();
        }
    };

    const processQueue = () => {
        isProcessing = true;
        const element = queue.shift() as HTMLElement;
        applyClass(element);
        const wait = isReduced() ? 0 : stagger;
        if (queue.length > 0) {
            setTimeout(processQueue, wait);
        } else {
            setTimeout(() => {
                if (queue.length > 0) processQueue();
                else isProcessing = false;
            }, wait);
        }
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const element = entry.target as HTMLElement;
            if (entry.isIntersecting) {
                if (once) observer.unobserve(element);
                if (stagger > 0 && !isReduced()) {
                    if (!queue.includes(element) && !element.classList.contains(className.split(' ')[0])) {
                        queue.push(element);
                        if (!isProcessing) processQueue();
                    }
                } else {
                    applyClass(element);
                }
            } else {
                if (!once) {
                    const elementIndexInQueue = queue.indexOf(element);
                    if (elementIndexInQueue > -1) queue.splice(elementIndexInQueue, 1);
                    const timeoutId = timeouts.get(element);
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                        timeouts.delete(element);
                    }
                    const elementClass = element.dataset.csClass || className;
                    element.classList.remove(...elementClass.split(' '));
                }
            }
        });
    }, { threshold, rootMargin });

    const addElementDebug = (element: HTMLElement) => {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        const createMarker = (isBottom: boolean) => {
            const marker = document.createElement('div');
            Object.assign(marker.style, {
                position: 'absolute',
                [isBottom ? 'bottom' : 'top']: '0',
                left: '50%',
                width: '100vw',
                height: '0px',
                transform: 'translateX(-50%)',
                zIndex: '9998',
                pointerEvents: 'none',
            });

            const dash = document.createElement('div');
            Object.assign(dash.style, {
                position: 'absolute',
                right: '0',
                [isBottom ? 'bottom' : 'top']: '0',
                width: '50px',
                height: '0px',
                [isBottom ? 'borderBottom' : 'borderTop']: '2px solid blue',
            });

            const label = document.createElement('span');
            label.textContent = isBottom ? 'Bot' : 'Top';
            Object.assign(label.style, {
                position: 'absolute',
                right: '52px',
                [isBottom ? 'bottom' : 'top']: '-6px',
                color: 'blue',
                fontSize: '9px',
                fontWeight: 'bold',
            });

            marker.appendChild(dash);
            marker.appendChild(label);
            marker.dataset.csDebug = "true";
            element.appendChild(marker);
        };

        createMarker(false);
        createMarker(true);
    };

    const register = (element: HTMLElement) => {
        if (trackedElements.has(element)) return;
        trackedElements.add(element);
        observer.observe(element);
        if (debug) addElementDebug(element);
    };

    if (typeof targetInput === 'string') {
        const found = document.querySelectorAll(targetInput);
        found.forEach(el => register(el as HTMLElement));
    } else if (targetInput instanceof Element) {
        register(targetInput as HTMLElement);
    } else if (targetInput && (targetInput as ArrayLike<Element>).length) {
        Array.from(targetInput as ArrayLike<Element>).forEach(el => register(el as HTMLElement));
    }

    let mutationObserver: MutationObserver | null = null;
    if (typeof targetInput === 'string') {
        mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            if (node.matches(targetInput)) {
                                register(node);
                            }
                            const nested = node.querySelectorAll(targetInput);
                            nested.forEach((el) => register(el as HTMLElement));
                        }
                    });
                }
            });
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (debug) {
        const parts = rootMargin.split(' ').map(p => p.trim());
        let marginTop = '0px';
        let marginBottom = '0px';

        if (parts.length === 1) { marginTop = parts[0]; marginBottom = parts[0]; }
        else if (parts.length === 2) { marginTop = parts[0]; marginBottom = parts[0]; }
        else if (parts.length === 3) { marginTop = parts[0]; marginBottom = parts[2]; }
        else if (parts.length === 4) { marginTop = parts[0]; marginBottom = parts[2]; }

        const createZone = (isBottom: boolean, margin: string, color: string) => {
            const zone = document.createElement('div');
            Object.assign(zone.style, {
                position: 'fixed',
                [isBottom ? 'bottom' : 'top']: margin.startsWith('-') ? Math.abs(parseFloat(margin)) + (margin.includes('%') ? '%' : 'px') : margin,
                right: '0',
                width: '100%',
                height: '0px',
                [isBottom ? 'borderBottom' : 'borderTop']: `2px dashed ${color}`,
                zIndex: '9999',
                pointerEvents: 'none',
            });

            const label = document.createElement('span');
            label.textContent = `Trigger Zone ${isBottom ? 'Bottom' : 'Top'} (${margin})`;
            Object.assign(label.style, {
                position: 'absolute',
                [isBottom ? 'bottom' : 'top']: '2px',
                right: '0',
                background: color,
                color: 'white',
                fontSize: '10px',
                padding: '2px 4px'
            });

            zone.appendChild(label);
            document.body.appendChild(zone);
            globalDebugElements.push(zone);
        };

        createZone(false, marginTop, 'red');
        createZone(true, marginBottom, 'green');
    }

    return {
        destroy: () => {
            observer.disconnect();
            if (mutationObserver) mutationObserver.disconnect();
            globalDebugElements.forEach(element => element.remove());
            if (debug) {
                // We cannot iterate trackedElements (WeakSet), so we query the DOM for cleanup
                document.querySelectorAll('[data-cs-debug="true"]').forEach(el => el.remove());
            }
            queue.length = 0;
        },
    };
}
