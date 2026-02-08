# Classy Scroll 🎩✨

A lightweight, performance-first library for scroll-based class toggling. Built with `IntersectionObserver` and TypeScript.

## Why Another Scroll Library?

Most scroll libraries (AOS, ScrollMagic, etc.) are powerful but often bloated, rely on scroll event listeners (causing layout thrashing), or require heavy configuration.

**Classy Scroll is different:**

- **🚀 Performance First:** Uses `IntersectionObserver` natively. No scroll event listeners. No jank.
- **📦 Zero Dependencies:** Tiny footprint (< 1kb minified).
- **♿ Accessibility Built-in:** Automatically disables animations if the user has `prefers-reduced-motion` enabled.
- **🎨 Stagger Support:** Easily stagger animations for grids or lists without complex CSS delays.
- **💪 TypeScript:** Fully typed for excellent DX.

## Installation

```bash
npm install classy-scroll
# or
yarn add classy-scroll
```

## Usage

### Basic

Add `data-swc-class` to your HTML elements (optional) or configure globally.

```html
<div class="box js-scroll">I fade in!</div>
<div class="box js-scroll" data-swc-delay="200">I fade in late!</div>
```

```typescript
import { classyScroll } from 'classy-scroll';

// Initialize
const observer = classyScroll('.js-scroll', {
  class: 'is-visible', // Class to toggle
  threshold: 0.2,      // Trigger when 20% visible
  once: true           // Only trigger once (default: true)
});

// Cleanup when done (e.g., in React useEffect)
// observer.destroy();
```

### Staggered Grid

Perfect for cards or list items.

```typescript
classyScroll('.card', {
  class: 'pop-in',
  stagger: 100 // 100ms delay between each element in the batch
});
```

## API

### `classyScroll(elements, options)`

**Arguments:**

- `elements`: `string` (selector), `NodeList`, `HTMLElement[]`, or single `HTMLElement`.
- `options`: Configuration object.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `class` | `string` | `'is-visible'` | CSS class to add when intersecting. |
| `threshold` | `number` | `0.1` | Intersection threshold (0.0 - 1.0). |
| `rootMargin` | `string` | `'0px'` | Margin around the root (viewport). |
| `once` | `boolean` | `true` | If `true`, stops observing after first trigger. |
| `stagger` | `number` | `0` | Delay in ms between processing batched elements. |
| `delay` | `number` | `0` | Global delay before adding class. |
| `debug` | `boolean` | `false` | Visualizes the intersection threshold on screen. |
| `callback` | `function` | `undefined` | Callback `(el) => void` when triggered. |

**HTML Attributes:**

- `data-swc-delay`: Overrides global `delay` for specific element.
- `data-swc-class`: Overrides global `class` for specific element.

## Browser Support

Works in all modern browsers supporting `IntersectionObserver` (96%+ global support).

## License

MIT
