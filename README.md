# **Classy Scroll 🎩✨**

https://github.com/user-attachments/assets/4d966fae-ded3-481e-ab40-85baf1e796fa

A lightweight, performance-first library for scroll-based class toggling. Built with the IntersectionObserver API and TypeScript.

## **💡 The Philosophy**

We believe in **Separation of Concerns**.

* **JavaScript** handles the *trigger* (when to start).  
* **CSS** handles the *animation* (what happens).

This library does not include physics engines, timelines, or parallax math. It does one thing efficiently: **it toggles a class when an element enters the viewport.**

By default, classes are **persistent** and stay forever once added (perfect for reveal animations). Set `persistent: false` for bidirectional toggling (useful for progress indicators, nav highlights, etc.).

### **When to use Classy Scroll?**

| If you need... | Use... |
| :---- | :---- |
| **Complex Timelines** (Pinning, Scrubbing, Parallax) | **GSAP ScrollTrigger** (The industry standard) |
| **React-Specific Physics** (Springs, Gestures) | **Framer Motion** |
| **Pre-made Animations** (Standard fades/slides) | **AOS** (Great if you skip writing CSS) |
| **Total Creative Freedom** (Any CSS class toggle) | **Classy Scroll** 🎩 |

**Classy Scroll is designed for the 90% use case:** You want to trigger CSS transitions as you scroll, and you want it to be fast, accessible, and lightweight.

**Ghost Element Architecture:** v2.0 introduces "Ghost Elements." The library creates invisible clones of your targets to track intersections. This ensures that your CSS transforms (like `translateY(100px)`) never interfere with the scroll trigger math.

**Future-Proof Architecture:** By strictly delegating animation logic to CSS, this library is inherently forward-compatible. As browsers adopt new CSS features (like discrete property transitions), your animations gain those powers immediately without needing library updates.

## **📦 Installation**
```bash
npm install classy-scroll  
# or  
pnpm add classy-scroll
```
## **🛠 Usage & Recipes**

### **1\. The "Minimal" Way (Vanilla CSS)**

By default, the library toggles the class is-visible. You define your start state in CSS, and your end state using the toggled class.
```html
<div class="animated-element">Hello World</div>
 
<style>  
  /* Start State (Hidden) */  
  .animated-element {  
    opacity: 0;  
    transform: translateY(20px);  
    transition: opacity 0.6s, transform 0.6s;  
  }

  /* End State (Added by library) */  
  .animated-element.is-visible {  
    opacity: 1;  
    transform: translateY(0);  
  }  
</style>

<script>  
  import { classyScroll } from 'classy-scroll';  
    
  // Just pass the selector!  
  classyScroll('.animated-element');  
</script>
```
### **2\. With Tailwind CSS 🌊**

Classy Scroll works perfectly with utility classes. You set the "Start" utility classes in your HTML, and pass the "End" utility classes to the library.
```html
<div class="opacity-0 translate-y-8 transition-all duration-700 animated-element">  
  I fade in with Tailwind!  
</div>

<script>  
  import { classyScroll } from 'classy-scroll';

  classyScroll('.animated-element', {  
    // Pass the Tailwind utilities to add when visible  
    class: 'opacity-100 translate-y-0',   
    threshold: 0.5  
  });  
</script>
```
### **3\. Full Configuration**

For TypeScript users, here is the complete interface definition showing all available options and their types.
```typescript
export interface ClassyScrollOptions {
  /** Space-separated classes to add when element is in view. Default: 'is-visible' */
  class?: string;
  /** Fraction of the element (0.0–1.0) that must be visible to trigger. Default: 0.1 */
  threshold?: number;
  /** Margin around the root element (e.g. "10px 0px"). Default: '0px' */
  rootMargin?: string;
  /** If true, the class stays after being added. If false, the class toggles on/off. Default: true */
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
```
#### **Example Instantiation:**
```typescript
import { classyScroll } from 'classy-scroll';

classyScroll('.animated-element', {  
  class: 'my-active-class',  
  threshold: 0.5,   
  rootMargin: '-50px 0px',   
  persistent: true,  
  stagger: 100,  
  debug: true,  
  callback: (element) => console.log('Animated:', element)  
});
```
## **⚙️ API**

### **classyScroll(targets, options)**

**Arguments:**

* targets: string (selector), NodeList, HTMLElement[], or single HTMLElement.  
  * *Note: Unlike v1.x, the library no longer uses MutationObserver to watch for new elements. For dynamic content, re-initialize the library or use framework lifecycle hooks.*
* options: Configuration object (optional).

### **HTML Data Attributes**

You can override global settings on a per-element basis.
```html
<div
  class="box"   
  data-cs-delay="500"   
  data-cs-class="special-pop"
>  
  I wait 500ms and get a custom class  
</div>
```

## **🕵️ Debug Mode**

Debugging scroll interactions is usually painful. Enable `debug: true` to visualize exactly where your trigger zones are.

```typescript
classyScroll('.box', {  
  debug: true,  
  rootMargin: '-20% 0px', // Trigger line moves 20% up from bottom
  threshold: 0.5
});
```

### **What You'll See:**
Our high-performance Canvas 2D overlay paints your scroll math in real-time without cluttering the DOM:

* **Dashed Lines (Viewport Margins):**
  * **Red Dashed Line:** Your Top `rootMargin` boundary (Exit zone).
  * **Green Dashed Line:** Your Bottom `rootMargin` boundary (Entry zone).
* **Solid Tracking Lines (Element Thresholds):**
  * **Blue Line (En):** Tracks the exact pixel where the element **Enters** (based on your `threshold` %).
  * **Blue Line (Ex):** Tracks the exact pixel where the element **Exits** (only active when `persistent: false`).
* **Dynamic Labels:** Right-aligned badges (e.g., `[.js-fade] Entry: -10% 0px`) linking the specific threshold to its target element.

**How to use it:** Simply scroll and watch the solid Element lines (Blue) collide with the dashed Viewport lines (Red/Green). The moment they touch, your CSS classes swap!

## **🧩 Framework Examples**

### **React / Next.js (Dynamic Content)**

Since v2.0, the library no longer uses a global `MutationObserver`. For dynamic lists, initialize the library inside a `useEffect` and include your data in the dependency array. This ensures new items are registered and old "ghost" elements are cleaned up correctly.
```tsx
import { useState, useEffect } from 'react';  
import { classyScroll } from 'classy-scroll';

export const DynamicList = () => {  
  const [items, setItems] = useState([1, 2, 3]);

  useEffect(() => {  
    // Re-initialize when items change to account for new DOM nodes
    const { destroy } = classyScroll('.animated-element', {   
        stagger: 100,  
        persistent: true   
    });  
    return () => destroy();  
  }, [items]); // The "items" dependency replaces the old MutationObserver logic

  return (  
    <div>  
      <button onClick={() => setItems([...items, items.length + 1])}>  
        Add Item  
      </button>  
        
      {items.map(i => (  
        // This new item will animate automatically when added!  
        <div key={i} className="animated-element">  
          Item {i}  
        </div>  
      ))}  
    </div>  
  );  
};
```
### **Vue / Nuxt**

Works great with onMounted.
```vue
<script setup>  
import { onMounted, onUnmounted } from 'vue';  
import { classyScroll } from 'classy-scroll';

let scroller;

onMounted(() => {  
  scroller = classyScroll('.animated-element', { stagger: 50 });  
});

onUnmounted(() => {  
  scroller?.destroy();  
});  
</script>
```
## **🚀 Migration Guide (v1.x → v2.0)**

### **Breaking Changes**

1. **MutationObserver Removed:** The library no longer automatically watches the DOM. You must call `classyScroll` when new elements are added or use framework lifecycle hooks (like `useEffect` or `onMounted`).
2. **`once` renamed to `persistent`:** The default is now `true`.
3. **Threshold Narrowing:** The `threshold` option now strictly accepts a single `number` (0.0 to 1.0). Arrays are no longer supported to ensure Ghost Element stability.

**v1.x (Old):**
```typescript
classyScroll('.element', { once: true });  // Class added once
classyScroll('.element', { once: false }); // Class toggles
classyScroll('.element', { threshold: [0, 0.5, 1] }); // Array allowed
```

**v2.x (New):**
```typescript
classyScroll('.element', { persistent: true });  // Class persists (default)
classyScroll('.element', { persistent: false }); // Class toggles
classyScroll('.element', { threshold: 0.5 }); // Must be a single number
```

## **License**

MIT © 2026
