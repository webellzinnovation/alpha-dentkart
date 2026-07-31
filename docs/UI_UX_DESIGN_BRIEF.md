# UI/UX Design Brief — Alpha Dentkart

**Design Style:** Modern Luxury Clinical E-Commerce  
**Design Tokens File:** `index.css`  
**Typography:** Inter / System UI Sans-serif  
**Target Visual Emotion:** High Trust, Medical Precision, Premium Quality, Elegance

---

## 1. Color Palette Architecture

Alpha Dentkart shuns generic flat colors in favor of a curated luxury brand palette featuring rich gradients, glassmorphism highlights, and high-contrast clinical accents.

```
       Primary Brand Pink              Accent Teal/Cyan             Clinical Navy Dark
     ┌───────────────────┐           ┌───────────────────┐         ┌───────────────────┐
     │  #DD3B5F / Pink   │           │  #0EA5E9 / Cyan   │         │  #0F172A / Slate  │
     └───────────────────┘           └───────────────────┘         └───────────────────┘
```

### 1.1 Brand Color Tokens
- **Primary Brand Red/Pink:** `#DD3B5F` (Gradient Start) -> `#E11D48` (Gradient End)
- **Primary Hover Pink:** `#C0264B`
- **Luxury Brand Gradient:** `linear-gradient(135deg, #DD3B5F 0%, #BE123C 50%, #9F1239 100%)`
- **Glass Card Overlay:** `rgba(255, 255, 255, 0.85)` with `backdrop-filter: blur(16px)`
- **Dark Surface Background:** `#0F172A` (Slate 900)
- **Accent Green (In Stock):** `#10B981` (Emerald 500)
- **Warning Yellow (Low Stock):** `#F59E0B` (Amber 500)

---

## 2. Layout & Component Guidelines

### 2.1 Header & Navigation
- **Top Announcement Bar:** Dark navy background (`#0F172A`) with subtle white text displaying currency selector (`India INR`), free shipping threshold, daily deals, and support hotline.
- **Main Sticky Header:** Clean white background with backdrop blur (`backdrop-blur-md`), pill-shaped category dropdown search bar, active wishlist count badge, and luxury gradient Cart CTA button (`#DD3B5F`).
- **Mobile Bottom Navigation:** Fixed bottom bar (`h-[68px]`) with smooth backdrop blur, icon bounce animations on cart badge updates, and active item pill highlights (`bg-pink-50`).

### 2.2 Product Cards & Displays
- **Product Card Container:** Rounded corners (`rounded-2xl`), subtle border (`border-gray-100`), smooth hover translate effect (`hover:-translate-y-1 hover:shadow-xl`).
- **Image Display:** Aspect ratio 1:1 square with smooth lazy loading image placeholders.
- **Price Tags:** Bold gradient text styling (`bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-600`), displaying MRP strike-through and discount percentage pill.
- **Call-to-Action Buttons:** Full-width rounded gradient button with subtle glow shadow (`shadow-primary/20`).

---

## 3. Responsive Breakpoints
- **Mobile (`< 640px`):** Single/double column product grid, bottom navigation bar active, side drawer menu enabled, sticky cart button visible.
- **Tablet (`640px - 1024px`):** Three-column product grid, top search bar expands, bottom bar remains active.
- **Desktop (`> 1024px`):** Four-column product grid, full horizontal desktop navigation, top search bar with live autocomplete dropdown, sidebar filter panel visible in Shop view.

---

## 4. Accessibility & Micro-Interactions
- **Skip-to-Content Link:** WCAG AA compliant hidden link for screen-reader users.
- **Focus Rings:** Distinct primary color focus ring (`focus:ring-2 focus:ring-primary/20`) on all interactive inputs.
- **Micro-Animations:** Smooth 300ms transitions on button hover, cart badge bounce effect, skeleton pulse loading indicators.
