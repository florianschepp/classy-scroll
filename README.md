# **Classy Scroll 🎩✨**

A lightweight, **performance-first** library for scroll-based class toggling. Built with IntersectionObserver and TypeScript.

## **💡 The Philosophy**

We believe in **Separation of Concerns**.

* **JavaScript** handles the *trigger* (when to start).  
* **CSS** handles the *animation* (what happens).

This library does not include physics engines, timelines, or parallax math. It does one thing efficiently: **it toggles a class when an element enters the viewport.**

### **When to use Classy Scroll?**

| If you need... | Use... |
| :---- | :---- |
| **Complex Timelines** (Pinning, Scrubbing, Parallax) | **GSAP ScrollTrigger** (The industry standard) |
| **React-Specific Physics** (Springs, Gestures) | **Framer Motion** |
| **Pre-made Animations** (Standard fades/slides) | **AOS** (Great if you skip writing CSS) |
| **Total Creative Freedom** (Any CSS class toggle) | **Classy Scroll** 🎩 |

**Classy Scroll is designed for the 90% use case:** You want to trigger CSS transitions as you scroll, and you want it to be fast, accessible, and lightweight.

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
export interface classyScrollOptions {  
  /** Space-separated classes to add when element is in view. Default: 'is-visible' */  
  class?: string;  
  /** Visibility threshold (0.0 to 1.0). Default: 0.1 */  
  threshold?: number | number[];  
  /** Margin around the root element (e.g. "10px 0px"). Default: '0px' */  
  rootMargin?: string;  
  /** If true, the class is added once and never removed. Default: false */  
  once?: boolean;  
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
  once: true,  
  stagger: 100,  
  debug: true,  
  callback: (element) => console.log('Animated:', element)  
});
```
## **⚙️ API**

### **classyScroll(targets, options)**

**Arguments:**

* targets: string (selector), NodeList, HTMLElement[], or single HTMLElement.  
  * *Note: If you pass a selector string (e.g. ".card"), the library will automatically enable **MutationObserver** to watch for new elements matching that selector.*  
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

Debugging scroll interactions is usually painful. Enable debug: true to visualize exactly where your trigger zones are.
```typescript
classyScroll('.box', {  
  debug: true,  
  rootMargin: '-20% 0px' // Trigger line moves 20% up from bottom  
});
```
* **Green Line:** Start Trigger (Bottom).  
* **Red Line:** End Trigger (Top).  
* **Blue Markers:** Top/Bottom boundaries of your elements.

## **🧩 Framework Examples**

### **React / Next.js (Dynamic Content)**

Because classyScroll uses a MutationObserver when you pass a string selector, it automatically detects new elements added to the DOM (e.g., loading a list).
```tsx
import { useState, useEffect } from 'react';  
import { classyScroll } from 'classy-scroll';

export const DynamicList = () => {  
  const [items, setItems] = useState([1, 2, 3]);

  useEffect(() => {  
    // We pass a string selector, so it watches for new .animated-element nodes automatically  
    const { destroy } = classyScroll('.animated-element', {   
        stagger: 100,  
        once: true   
    });  
    return () => destroy();  
  }, []);

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
## **License**

MIT © 2026
