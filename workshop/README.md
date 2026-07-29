# E-Commerce Website (LuxeThread Atelier)

An interactive, premium, high-fidelity Fashion E-Commerce website built with Vite, Vanilla JS, and custom styling. The application is set up with Indian Currency (₹), interactive games, dynamic shopping flows, and Leaflet map branches integrations.

## 📸 Output Screenshot

Below is a preview of the homepage:

![Atelier Homepage Screenshot](output_ss.jpg)

---

## ✨ Features Checklist

*   **Premium Visuals & Hero Section**: Includes a high-resolution, custom-generated fashion hero banner styled with dark glassmorphic overlays.
*   **Curated Catalog**: Features 14 high-quality fashion products (Cashmere overcoats, silk evening gowns, blazers, accessories) with full color/size options and ratings.
*   **Indian Currency (₹) Support**: All prices, subtotals, taxations, and deliveries are formatted to Indian Rupees (INR) with localized digit groupings (e.g. `₹18,999`).
*   **Interactive Cart Drawer**: Slide-out shopping bag panel supporting quantity adjustments, item deletions, coupon applying codes, and automated free-shipping checking (for orders over `₹9,999`).
*   **Interactive Gamified Offers**:
    *   **Scratch Card**: Canvas-based click-and-scratch card to reveal the code `SCRATCH25` (unlocks 25% Off).
    *   **Spin The Wheel**: SVG sectors spin-to-win game offering code prizes like `WHEEL30` or `JACKPOT50` (50% Off!).
    *   **Flash Sale Countdown**: Real-time ticker counting down hours, minutes, and seconds.
*   **Maison Branches Map**:
    *   Interactive global map (using **Leaflet**) showing store pins in Paris, Milan, London, Tokyo, and New York.
    *   Clicking store cards pans map views (`map.flyTo`) and opens styled custom popups.
    *   Includes a **Find Closest Store** button utilizing browser geolocation to calculate distances using the Haversine formula.
*   **Simulated Checkout Tracker**:
    *   Full shipping address validation form.
    *   Animated vertical timeline showing shipping stages updating dynamically: `Order Confirmed` ➜ `Packing` ➜ `In Transit` ➜ `Delivered`.

---

## 🛠️ Technology Stack

*   **Core Logic**: Vanilla JavaScript (ES6 Modules)
*   **Styling**: Vanilla CSS (CSS Variables, Flexbox, Grids, Glassmorphism, CSS Transitions)
*   **Bundler**: Vite
*   **Dependencies**: Leaflet Map API

---

## 🚀 Running the Project

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start the local development server**:
    ```bash
    npm run dev
    ```
    *(Note: Vite is configured to automatically open your default web browser directly on start!)*
3.  **Compile production bundle**:
    ```bash
    npm run build
    ```
