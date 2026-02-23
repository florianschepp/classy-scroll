# Changelog

## [2.0.0] - 2026-02-23

### 🚀 The "Ghost Element" Refactor (Major Architecture Change)
* **Decoupled Intersection Tracking:** The library no longer observes your animated elements directly. Instead, it generates an invisible **Ghost Element** (a layout-stable clone) for every target. 
    * **Why?** This ensures that complex CSS transforms (like `translateY(100px)`) or layout shifts during animation do not move the trigger point, resulting in 100% reliable intersection math regardless of your CSS.
* **Canvas 2D Debug Engine:** Replaced DOM-based debug markers with a high-performance Canvas overlay.
    * **Benefit:** Zero DOM pollution. You can debug your scroll logic without markers affecting your CSS selectors or layout flow.

### ♿ Accessibility Upgrade: "Hard-Wired" Motion Support
* **Bypassing the Queue:** While `prefers-reduced-motion` was supported in v1.x, it has been moved deeper into the core.
    * **The Change:** If a user has reduced motion enabled, the library now **short-circuits the internal queue**. It skips the overhead of `setTimeout` and `processQueue` loops entirely, snapping elements to their visible state instantly. This reduces CPU cycles and ensures zero "stagger lag" for users with motion sensitivities.

### ⚠️ Breaking Changes: Removing the MutationObserver
* **Dropped `MutationObserver` support:** The library no longer automatically watches the `document.body` for new elements matching your selector.
    * **The "Why":** In the new Ghost system, creating ghosts for every dynamic DOM change without a strict lifecycle (like React's `useEffect` or Vue's `onMounted`) led to potential memory leaks and orphaned ghost elements.
    * **Migration:** If you are using a modern framework, initialize `classyScroll` within your component’s mount hook. For vanilla dynamic content, manually call `classyScroll` on the newly injected elements.
* **Renamed `once` → `persistent`:** Default value changed to `true`. This aligns with the industry-standard "reveal" pattern. Use `persistent: false` if you want elements to hide again when scrolling up.
* **threshold type change:** Simplified `threshold` to a single `number`. Multi-threshold arrays were removed to optimize the Ghost Element sync logic.
