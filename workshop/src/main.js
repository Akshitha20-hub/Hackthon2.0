import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./style.css";

// Fix Leaflet Default Marker Icon Issue in Vite/Webpack packing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ==========================================
// LuxeThread Atelier - Data Catalog
// ==========================================

const products = [
  {
    id: 1,
    title: "Cashmere Double-Breasted Overcoat",
    category: "Outerwear",
    price: 18999.0,
    oldPrice: 24999.0,
    rating: 4.8,
    reviewsCount: 38,
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
    badge: "Bestseller",
    description: "Indulge in supreme warmth and architectural tailoring. Crafted from premium Mongolian cashmere and lined with luxurious silk satin, this coat features structural shoulders, double-breasted horn buttons, and a clean, draping silhouette designed for modern layers.",
    colors: ["#2B2A29", "#C3B195", "#6F4E37"],
    sizes: ["S", "M", "L", "XL"],
    reviews: [
      { author: "Evelyn K.", rating: 5, text: "Absolutely stunning structure. Fits perfectly and feels incredibly soft." },
      { author: "Marcus T.", rating: 4.5, text: "Excellent warm lining, very comfortable for NYC winter. Received several compliments." }
    ]
  },
  {
    id: 2,
    title: "Chiffon Pleated Evening Gown",
    category: "Dresses",
    price: 14999.0,
    rating: 4.9,
    reviewsCount: 24,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
    badge: "Exclusive",
    description: "Make a breathtaking entrance. This floor-length gown features a delicate halter neckline, micro-pleated bodice, and cascading fluid silk chiffon skirts that billow beautifully with every step. Perfect for formal galas and summer soirées.",
    colors: ["#A52A2A", "#0F2A4A", "#1C1C1C"],
    sizes: ["XS", "S", "M", "L"],
    reviews: [
      { author: "Sophia R.", rating: 5, text: "The movement on this gown is magical! Felt like royalty wearing it." }
    ]
  },
  {
    id: 3,
    title: "Tailored Linen-Silk Blazer",
    category: "Outerwear",
    price: 9999.0,
    oldPrice: 12999.0,
    rating: 4.7,
    reviewsCount: 19,
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
    badge: "Sale",
    description: "Effortless Italian sophistication. A soft linen-blend fabric gives this blazer its signature breathable texture, while silk threads add a subtle lustre. Half-lined for comfort, featuring custom notch lapels and patch pockets.",
    colors: ["#F4F1EA", "#5A726E", "#2B2A29"],
    sizes: ["S", "M", "L", "XL"],
    reviews: [
      { author: "Julian H.", rating: 5, text: "Brilliant fabric. Perfect structure for smart casual meetings." }
    ]
  },
  {
    id: 4,
    title: "Satin Asymmetrical Wrap Dress",
    category: "Dresses",
    price: 6999.0,
    rating: 4.6,
    reviewsCount: 42,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
    badge: "Trending",
    description: "Flowing satin wrap dress featuring a structured waist tie, subtle cowl detailing at the bust, and an elegant asymmetrical ruffled hemline. Shimmers beautifully under soft lighting.",
    colors: ["#3D5246", "#B38B6D", "#0A0A0A"],
    sizes: ["XS", "S", "M", "L"],
    reviews: [
      { author: "Zara P.", rating: 5, text: "Slinks nicely over curves. Material has a great premium weight to it." }
    ]
  },
  {
    id: 5,
    title: "Luxe Heavyweight Fleece Hoodie",
    category: "Activewear",
    price: 4499.0,
    rating: 4.7,
    reviewsCount: 88,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    badge: "",
    description: "Our signature lounger. Cut from 480GSM organic cotton fleece, this heavy-weight hoodie has a relaxed, drop-shoulder crop fit with flatlock seams, double-layered hood, and minimal embroidered chest accents.",
    colors: ["#7A7A7A", "#1C1C1C", "#DED0B6"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    reviews: [
      { author: "Tariq A.", rating: 4, text: "Extremely thick and comfortable. Hood stands up nicely!" }
    ]
  },
  {
    id: 6,
    title: "Classic Leather Chelsea Boots",
    category: "Accessories",
    price: 8999.0,
    oldPrice: 11999.0,
    rating: 4.8,
    reviewsCount: 61,
    image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&auto=format&fit=crop&q=80",
    badge: "Sale",
    description: "Handcrafted in Portugal. Feature full-grain calfskin leather uppers, flexible elastic side gussets, pulling loops, and double-stitched Goodyear welted rubber soles for absolute durability.",
    colors: ["#1F1612", "#473024", "#000000"],
    sizes: ["8", "9", "10", "11", "12"],
    reviews: [
      { author: "Liam D.", rating: 5, text: "Superb leather quality. Took only two days to break in." }
    ]
  },
  {
    id: 7,
    title: "Suede Pebbled Crossbody Bag",
    category: "Accessories",
    price: 5999.0,
    rating: 4.5,
    reviewsCount: 14,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
    badge: "",
    description: "A compact crossbody structured with Italian suede leather. Designed with dual zip compartments, custom brass metal locks, and an adjustable, detachable guitar-style shoulder strap.",
    colors: ["#8B5A2B", "#0A0A0A", "#4A6E8A"],
    sizes: ["Medium Strap", "Large Strap", "Bespoke Crossbody"],
    reviews: [
      { author: "Rachel M.", rating: 4, text: "Gorgeous color. Wish it was slightly larger, but fits all daily essentials." }
    ]
  },
  {
    id: 8,
    title: "Gold Dial Milanese Mesh Watch",
    category: "Accessories",
    price: 15999.0,
    rating: 4.9,
    reviewsCount: 30,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&auto=format&fit=crop&q=80",
    badge: "Luxury",
    description: "Chrono dial featuring an ultra-slim 7mm case profile in brushed 24k gold-plated stainless steel, scratch-resistant sapphire crystal glass, Swiss quartz mechanism, and a flexible Milanese magnetic mesh band.",
    colors: ["#D4AF37", "#C0C0C0", "#E2B1B1"],
    sizes: ["Adjustable Mesh", "Slim Mesh", "Leather Strap"],
    reviews: [
      { author: "Aris V.", rating: 5, text: "Exceptional craftsmanship. The mesh strap is highly adjustable and secure." }
    ]
  },
  {
    id: 9,
    title: "Premium Tech Knit Joggers",
    category: "Activewear",
    price: 3499.0,
    rating: 4.6,
    reviewsCount: 54,
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop&q=80",
    badge: "",
    description: "Engineered high-performance joggers. Feature four-way stretch fabric, sweat-wicking knit structures, side-zippered phone utility pockets, and tapered cuffs for a sleek silhouette in and out of the studio.",
    colors: ["#1F2022", "#3C3D42", "#7E858B"],
    sizes: ["S", "M", "L", "XL"],
    reviews: [
      { author: "Daniel O.", rating: 5, text: "The stretch is incredible. Perfect for active days or traveling." }
    ]
  },
  {
    id: 10,
    title: "Waffle-Knit Merino Wool Sweater",
    category: "Outerwear",
    price: 7999.0,
    oldPrice: 9999.0,
    rating: 4.8,
    reviewsCount: 32,
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
    badge: "Sale",
    description: "Spun from 100% fine Merino wool fibers. Breathable, thermoregulating knit texture detailing a rib-stitched collar, cuffs, and hem. Offers cozy comfort that holds its shape beautifully.",
    colors: ["#FFFFFF", "#2F4F4F", "#C2B280"],
    sizes: ["S", "M", "L", "XL"],
    reviews: [
      { author: "George S.", rating: 5, text: "Incredibly cozy. Softest wool I've worn, non-scratchy." }
    ]
  },
  
  // NEW COLORFUL DRESSES AND ACTIVEWEAR
  {
    id: 11,
    title: "Floral Garden Silk Midi Dress",
    category: "Dresses",
    price: 4999.0,
    rating: 4.8,
    reviewsCount: 15,
    image: "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=600&auto=format&fit=crop&q=80",
    badge: "Colorful",
    description: "A canvas of botanical luxury. Cut from feather-light mulberry silk, this midi dress features a vintage floral motif in vibrant yellows and pinks, an open tie-back halter neck, and a tiered flutter hem that details elegance.",
    colors: ["#FFD700", "#FF1493", "#00F5FF"],
    sizes: ["S", "M", "L", "XL"],
    reviews: [
      { author: "Priya N.", rating: 5, text: "The floral print is so rich and vibrant! Perfect drape and silk quality." }
    ]
  },
  {
    id: 12,
    title: "Magenta Silk Sunset Cocktail Dress",
    category: "Dresses",
    price: 12499.0,
    rating: 4.9,
    reviewsCount: 20,
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80",
    badge: "Hot Release",
    description: "Capture the warmth of a sunset in pure silk. Radiating a bold magenta hue, this elegant cocktail dress has delicate double shoulder straps, structured corset wiring at the bodice, and a side-slit midi hem.",
    colors: ["#C71585", "#0000FF", "#D4AF37"],
    sizes: ["XS", "S", "M", "L", "XL"],
    reviews: [
      { author: "Aditi S.", rating: 5, text: "The color is absolutely gorgeous and stands out in a crowd! Stunning stitching." }
    ]
  },
  {
    id: 13,
    title: "Emerald Green Velvet Wrap Dress",
    category: "Dresses",
    price: 8999.0,
    rating: 4.7,
    reviewsCount: 11,
    image: "https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=600&auto=format&fit=crop&q=80",
    badge: "Chic",
    description: "Plush emerald green velvet dress styled into a timeless wrap structure. Features full long sleeves, deep V necklines, and a self-tying waist belt detailing luxurious comfort.",
    colors: ["#004B23", "#000080", "#1C1C1C"],
    sizes: ["S", "M", "L", "XL"],
    reviews: [
      { author: "Anjali K.", rating: 4.5, text: "High quality velvet, thick and warm for winter cocktail events." }
    ]
  },
  {
    id: 14,
    title: "Pastel Rainbow Active Crop Top",
    category: "Activewear",
    price: 2499.0,
    rating: 4.6,
    reviewsCount: 22,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
    badge: "Vibrant",
    description: "Workout in colors of delight. An engineered active crop top featuring soft pastel gradients, seamless ribbed knit structures, moisture-wicking technology, and racerback straps.",
    colors: ["#FFB6C1", "#E6E6FA", "#98FB98"],
    sizes: ["S", "M", "L"],
    reviews: [
      { author: "Sneha R.", rating: 5, text: "Incredibly cute pastel tone! High support strap and quick dry." }
    ]
  }
];

const branches = [
  {
    id: 1,
    name: "Paris Flagship Atelier",
    lat: 48.8698,
    lng: 2.3075,
    address: "15 Avenue des Champs-Élysées, 75008 Paris, France",
    phone: "+33 1 42 25 30 10",
    hours: "Mon - Sat: 10:00 AM - 8:00 PM, Sun: 11:00 AM - 7:00 PM"
  },
  {
    id: 2,
    name: "Milan Brera Maison",
    lat: 45.4718,
    lng: 9.1868,
    address: "Via Brera 12, 20121 Milan, Italy",
    phone: "+39 02 8901 0233",
    hours: "Tue - Sun: 10:30 AM - 7:30 PM, Closed Monday"
  },
  {
    id: 3,
    name: "New York Soho House",
    lat: 40.7246,
    lng: -74.0018,
    address: "128 Mercer St, New York, NY 10012, USA",
    phone: "+1 (212) 966-3020",
    hours: "Daily: 11:00 AM - 8:00 PM"
  },
  {
    id: 4,
    name: "London Bond St Showroom",
    lat: 51.5122,
    lng: -0.1438,
    address: "42 New Bond St, London W1S 2RY, United Kingdom",
    phone: "+44 20 7493 5020",
    hours: "Mon - Sat: 10:00 AM - 7:00 PM, Sun: 12:00 PM - 6:00 PM"
  },
  {
    id: 5,
    name: "Tokyo Shibuya Cube",
    lat: 35.6622,
    lng: 139.7018,
    address: "5-10-1 Jingumae, Shibuya-ku, Tokyo 150-0001, Japan",
    phone: "+81 3 5468 2030",
    hours: "Daily: 11:00 AM - 9:00 PM"
  }
];

// ==========================================
// Global State & Vouchers List
// ==========================================

let cart = JSON.parse(localStorage.getItem("atelier_cart")) || [];
let activeSection = "shop"; // 'shop', 'offers', 'branches'
let activeFilters = {
  category: "All",
  search: "",
  color: "All",
  size: "All",
  maxPrice: 30000,
};
let selectedSort = "default";
let map = null;
let activeBranchId = 1;
let promoDiscount = 0;
let promoCodeApplied = "";
let countdownTime = 2 * 3600 + 14 * 60 + 45; // 2h 14m 45s simulation

// Active valid promo codes database (Rupees discount mapping)
const validPromos = {
  FASHION20: { type: "percent", value: 20 },
  WELCOME50: { type: "flat", value: 2500 } // ₹2,500 flat discount code!
};

// ==========================================
// Initialization & Mounting
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  setupNavbarScroll();
  setupNavigation();
  setupThemeToggle();
  setupFilters();
  setupQuickView();
  setupCart();
  setupCheckout();
  setupOffersTab();
  
  // Render default listings
  renderProducts();
  updateCartBadge();
  
  // Flash sale countdown timer
  setInterval(tickCountdown, 1000);
});

// Header Scrolled styling
function setupNavbarScroll() {
  const header = document.querySelector(".atelier-header");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
}

// ==========================================
// Section Navigation
// ==========================================

function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".page-section");

  navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.section;
      
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      sections.forEach(sec => sec.classList.remove("active"));
      const activeSec = document.getElementById(`section-${target}`);
      activeSec.classList.add("active");
      
      activeSection = target;

      // Handle map sizing refresh when shifting tab
      if (target === "branches") {
        setTimeout(initLeafletMap, 100);
      }
    });
  });
  
  // Hero CTA buttons routing
  const exploreBtn = document.getElementById("btn-hero-shop");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      document.querySelector('[data-section="shop"]').click();
    });
  }
  const offersCta = document.getElementById("btn-hero-offers");
  if (offersCta) {
    offersCta.addEventListener("click", () => {
      document.querySelector('[data-section="offers"]').click();
    });
  }
}

// Theme Toggle Layouts
function setupThemeToggle() {
  const toggleBtn = document.getElementById("btn-theme-toggle");
  if (!toggleBtn) return;
  
  const savedTheme = localStorage.getItem("atelier_theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    toggleBtn.querySelector("i").className = "fa-solid fa-moon";
  }

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    toggleBtn.querySelector("i").className = isLight ? "fa-solid fa-moon" : "fa-solid fa-sun";
    localStorage.setItem("atelier_theme", isLight ? "light" : "dark");
  });
}

// ==========================================
// Shop Section Logic
// ==========================================

function setupFilters() {
  // Category buttons
  const catBtns = document.querySelectorAll(".category-btn");
  catBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      catBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilters.category = btn.dataset.category;
      renderProducts();
    });
  });

  // Search Input
  const searchInput = document.getElementById("shop-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      activeFilters.search = e.target.value.toLowerCase().trim();
      renderProducts();
    });
  }

  // Price Slider (Rupee scale update)
  const priceSlider = document.getElementById("price-range");
  const priceVal = document.getElementById("price-max-val");
  if (priceSlider && priceVal) {
    priceSlider.addEventListener("input", (e) => {
      const val = e.target.value;
      priceVal.textContent = `₹${parseFloat(val).toLocaleString('en-IN')}`;
      activeFilters.maxPrice = parseFloat(val);
      renderProducts();
    });
  }

  // Color options
  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      colorOptions.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      activeFilters.color = opt.dataset.color;
      renderProducts();
    });
  });

  // Size options
  const sizeOptions = document.querySelectorAll(".size-option");
  sizeOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      sizeOptions.forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      activeFilters.size = opt.dataset.size;
      renderProducts();
    });
  });

  // Reset Filters Button
  const resetBtn = document.getElementById("btn-reset-filters");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Reset inputs & classes
      if (searchInput) searchInput.value = "";
      if (priceSlider) {
        priceSlider.value = 30000;
        priceVal.textContent = "₹30,000";
      }
      catBtns.forEach(b => b.classList.remove("active"));
      if (catBtns[0]) catBtns[0].classList.add("active");
      
      colorOptions.forEach(o => o.classList.remove("active"));
      if (colorOptions[0]) colorOptions[0].classList.add("active");
      
      sizeOptions.forEach(o => o.classList.remove("active"));
      if (sizeOptions[0]) sizeOptions[0].classList.add("active");

      activeFilters = {
        category: "All",
        search: "",
        color: "All",
        size: "All",
        maxPrice: 30000,
      };
      renderProducts();
    });
  }

  // Sort selectors
  const sortSelect = document.getElementById("sort-by");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      selectedSort = e.target.value;
      renderProducts();
    });
  }
}

// Filter and Sort Products
function renderProducts() {
  const grid = document.getElementById("products-grid");
  const countLabel = document.getElementById("products-count");
  if (!grid) return;

  let filtered = products.filter(p => {
    // Category match
    if (activeFilters.category !== "All" && p.category !== activeFilters.category) return false;
    
    // Search match
    if (activeFilters.search && !p.title.toLowerCase().includes(activeFilters.search) && !p.description.toLowerCase().includes(activeFilters.search)) return false;
    
    // Price match
    if (p.price > activeFilters.maxPrice) return false;
    
    // Color match
    if (activeFilters.color !== "All") {
      const pColorMap = {
        black: ["#1c1c1c", "#0a0a0a", "#1f2022", "#2b2a29", "#1f1612", "#1c1c1c"],
        white: ["#f4f1ea", "#ffffff"],
        gold: ["#d4af37", "#c5a880", "#b38b6d", "#c2b280", "#ffd700"],
        grey: ["#7a7a7a", "#3c3d42", "#7e858b"],
        brown: ["#6f4e37", "#8b5a2b", "#473024"]
      };
      const allowedHexes = pColorMap[activeFilters.color.toLowerCase()] || [];
      const hasMatch = p.colors.some(c => allowedHexes.includes(c.toLowerCase()));
      if (!hasMatch) return false;
    }
    
    // Size match
    if (activeFilters.size !== "All" && !p.sizes.includes(activeFilters.size) && !p.sizes.some(s => s.toLowerCase().includes("strap") || s.toLowerCase().includes("mesh") || s.toLowerCase().includes("crossbody"))) return false;
    
    return true;
  });

  // Sort logic
  if (selectedSort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (selectedSort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (selectedSort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  // Update label
  if (countLabel) {
    countLabel.textContent = `Showing ${filtered.length} products`;
  }

  // Update Badge Counts on filters
  updateFilterBadges();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-box-open" style="font-size: 48px; margin-bottom: 16px;"></i>
        <p>No products match your current filters. Try resetting them.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const isWishlist = localStorage.getItem(`wishlist_${p.id}`) === "true";
    const badgeHTML = p.badge ? `<span class="product-badge ${p.badge.toLowerCase() === 'sale' ? 'sale' : ''}">${p.badge}</span>` : "";
    const oldPriceHTML = p.oldPrice ? `<span class="product-old-price">₹${p.oldPrice.toLocaleString('en-IN')}</span>` : "";
    
    return `
      <article class="product-card">
        <div class="product-image-container">
          ${badgeHTML}
          <button class="wishlist-btn ${isWishlist ? 'active' : ''}" data-id="${p.id}" aria-label="Add to wishlist">
            <i class="fa-regular fa-heart"></i>
          </button>
          <img src="${p.image}" alt="${p.title}" class="product-image" loading="lazy" />
          <div class="product-actions-overlay">
            <button class="action-card-btn btn-card-primary btn-add-to-cart" data-id="${p.id}">
              <i class="fa-solid fa-bag-shopping"></i> Add to Cart
            </button>
            <button class="action-card-btn btn-card-secondary btn-quick-view" data-id="${p.id}">
              <i class="fa-regular fa-eye"></i> Quick View
            </button>
          </div>
        </div>
        <div class="product-info">
          <span class="product-category">${p.category}</span>
          <h3 class="product-title">${p.title}</h3>
          <div class="product-rating">
            <i class="fa-solid fa-star"></i>
            <span>${p.rating} (${p.reviewsCount})</span>
          </div>
          <div class="price-container">
            <span class="product-price">₹${p.price.toLocaleString('en-IN')}</span>
            ${oldPriceHTML}
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Attach event listeners
  grid.querySelectorAll(".wishlist-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWishlist(btn);
    });
  });

  grid.querySelectorAll(".btn-quick-view").forEach(btn => {
    btn.addEventListener("click", () => {
      openQuickViewModal(parseInt(btn.dataset.id));
    });
  });

  grid.querySelectorAll(".btn-add-to-cart").forEach(btn => {
    btn.addEventListener("click", () => {
      const pid = parseInt(btn.dataset.id);
      const prod = products.find(x => x.id === pid);
      if (prod) {
        // Default to first size and color
        addToCart(pid, prod.sizes[0], prod.colors[0], 1);
      }
    });
  });
}

function updateFilterBadges() {
  const catBtns = document.querySelectorAll(".category-btn");
  catBtns.forEach(btn => {
    const catName = btn.dataset.category;
    let count = 0;
    if (catName === "All") {
      count = products.length;
    } else {
      count = products.filter(x => x.category === catName).length;
    }
    const badge = btn.querySelector(".badge");
    if (badge) badge.textContent = count;
  });
}

function toggleWishlist(btn) {
  const id = btn.dataset.id;
  const isWish = btn.classList.contains("active");
  if (isWish) {
    btn.classList.remove("active");
    localStorage.removeItem(`wishlist_${id}`);
  } else {
    btn.classList.add("active");
    localStorage.setItem(`wishlist_${id}`, "true");
  }
}

// ==========================================
// Quick View Modal
// ==========================================

let qvModalState = {
  product: null,
  size: "",
  color: "",
  qty: 1
};

function setupQuickView() {
  const modal = document.getElementById("quickview-modal");
  const close = modal.querySelector(".modal-close");
  
  // Close modal click
  close.addEventListener("click", () => {
    modal.classList.remove("active");
  });
  
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  // Quantity Stepper
  const minus = document.getElementById("qv-qty-minus");
  const plus = document.getElementById("qv-qty-plus");
  const val = document.getElementById("qv-qty-val");

  minus.addEventListener("click", () => {
    if (qvModalState.qty > 1) {
      qvModalState.qty--;
      val.textContent = qvModalState.qty;
    }
  });

  plus.addEventListener("click", () => {
    qvModalState.qty++;
    val.textContent = qvModalState.qty;
  });

  // Modal Add to Cart
  const addToCartBtn = document.getElementById("btn-qv-add");
  addToCartBtn.addEventListener("click", () => {
    if (qvModalState.product) {
      addToCart(qvModalState.product.id, qvModalState.size, qvModalState.color, qvModalState.qty);
      modal.classList.remove("active");
    }
  });
}

function openQuickViewModal(productId) {
  const prod = products.find(x => x.id === productId);
  if (!prod) return;

  qvModalState = {
    product: prod,
    size: prod.sizes[0],
    color: prod.colors[0],
    qty: 1
  };

  const modal = document.getElementById("quickview-modal");
  
  // Populate elements
  document.getElementById("qv-img").src = prod.image;
  document.getElementById("qv-title").textContent = prod.title;
  document.getElementById("qv-desc").textContent = prod.description;
  document.getElementById("qv-price").textContent = `₹${prod.price.toLocaleString('en-IN')}`;
  
  const oldPriceEl = document.getElementById("qv-old-price");
  if (prod.oldPrice) {
    oldPriceEl.style.display = "inline";
    oldPriceEl.textContent = `₹${prod.oldPrice.toLocaleString('en-IN')}`;
  } else {
    oldPriceEl.style.display = "none";
  }

  // Size list
  const sizeCont = document.getElementById("qv-sizes-container");
  sizeCont.innerHTML = prod.sizes.map(s => {
    return `<button class="size-option ${s === qvModalState.size ? 'active' : ''}" data-size="${s}">${s}</button>`;
  }).join("");
  
  sizeCont.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      sizeCont.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      qvModalState.size = btn.dataset.size;
    });
  });

  // Color list
  const colorCont = document.getElementById("qv-colors-container");
  colorCont.innerHTML = prod.colors.map(c => {
    return `
      <button class="color-option ${c === qvModalState.color ? 'active' : ''}" data-color="${c}">
        <span class="color-dot" style="background-color: ${c}"></span>
      </button>
    `;
  }).join("");
  
  colorCont.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      colorCont.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      qvModalState.color = btn.dataset.color;
    });
  });

  // Reset Quantity
  document.getElementById("qv-qty-val").textContent = "1";

  // Reviews
  const reviewsCont = document.getElementById("qv-reviews");
  if (prod.reviews && prod.reviews.length > 0) {
    reviewsCont.innerHTML = prod.reviews.map(r => {
      const stars = `<i class="fa-solid fa-star"></i>`.repeat(Math.floor(r.rating)) + (r.rating % 1 !== 0 ? `<i class="fa-solid fa-star-half"></i>` : "");
      return `
        <div class="review-item">
          <div class="review-header">
            <span class="review-author">${r.author}</span>
            <div class="review-stars">${stars}</div>
          </div>
          <p class="review-text">"${r.text}"</p>
        </div>
      `;
    }).join("");
  } else {
    reviewsCont.innerHTML = `<p style="font-size: 13px; color: var(--text-muted); font-style: italic;">No reviews yet for this product.</p>`;
  }

  modal.classList.add("active");
}

// ==========================================
// Cart Drawer & Calculations
// ==========================================

function setupCart() {
  const cartBtn = document.getElementById("btn-cart-toggle");
  const drawer = document.getElementById("cart-drawer");
  const closeBtn = document.getElementById("cart-drawer-close");

  cartBtn.addEventListener("click", () => {
    drawer.classList.add("active");
    renderCart();
  });

  closeBtn.addEventListener("click", () => {
    drawer.classList.remove("active");
  });

  // Apply Coupon code
  const promoInput = document.getElementById("promo-input");
  const promoApply = document.getElementById("btn-promo-apply");
  const promoMsg = document.getElementById("promo-msg");

  promoApply.addEventListener("click", () => {
    const code = promoInput.value.toUpperCase().trim();
    if (!code) return;

    if (validPromos[code]) {
      promoCodeApplied = code;
      const promo = validPromos[code];
      
      if (promo.type === "percent") {
        promoDiscount = promo.value; // value represents percentage e.g. 20%
        promoMsg.className = "promo-msg success";
        promoMsg.innerHTML = `<i class="fa-solid fa-check"></i> Code ${code} applied successfully (${promo.value}% OFF!)`;
      } else if (promo.type === "flat") {
        promoDiscount = promo.value; // value represents flat discount (e.g. ₹2,500 off)
        promoMsg.className = "promo-msg success";
        promoMsg.innerHTML = `<i class="fa-solid fa-check"></i> Code ${code} applied successfully (₹${promo.value.toLocaleString('en-IN')} OFF!)`;
      }
      renderCart();
    } else {
      promoMsg.className = "promo-msg error";
      promoMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Invalid discount code.`;
      promoCodeApplied = "";
      promoDiscount = 0;
      renderCart();
    }
  });
}

function addToCart(productId, size, color, quantity) {
  const prod = products.find(x => x.id === productId);
  if (!prod) return;

  // Search if item with same size & color already exists
  const existing = cart.find(item => item.id === productId && item.size === size && item.color === color);
  
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      title: prod.title,
      price: prod.price,
      image: prod.image,
      size: size,
      color: color,
      quantity: quantity
    });
  }

  localStorage.setItem("atelier_cart", JSON.stringify(cart));
  updateCartBadge();
  
  // Slide open the cart drawer to show action feedback
  document.getElementById("cart-drawer").classList.add("active");
  renderCart();
}

function renderCart() {
  const wrapper = document.getElementById("cart-items");
  if (!wrapper) return;

  if (cart.length === 0) {
    wrapper.innerHTML = `
      <div class="cart-empty-message">
        <i class="fa-solid fa-bag-shopping"></i>
        <p>Your shopping cart is currently empty.</p>
        <button onclick="document.getElementById('cart-drawer').classList.remove('active')" class="btn-luxury" style="padding: 10px 20px; font-size: 11px; margin-top: 15px;">Continue Shopping</button>
      </div>
    `;
    
    // Reset summaries
    document.getElementById("cart-subtotal").textContent = "₹0";
    document.getElementById("cart-discount").textContent = "-₹0";
    document.getElementById("cart-shipping").textContent = "₹0";
    document.getElementById("cart-total").textContent = "₹0";
    document.getElementById("btn-cart-checkout").disabled = true;
    return;
  }

  document.getElementById("btn-cart-checkout").disabled = false;

  wrapper.innerHTML = cart.map((item, index) => {
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}" class="cart-item-img" />
        <div class="cart-item-details">
          <div>
            <h4 class="cart-item-title">${item.title}</h4>
            <div class="cart-item-meta">
              <span>Size: ${item.size}</span> | 
              <span style="display:inline-flex; align-items:center; gap: 4px;">
                Color: <span style="width: 10px; height: 10px; border-radius:50%; display:inline-block; background-color:${item.color}; border:1px solid #999;"></span>
              </span>
            </div>
          </div>
          <div class="cart-item-controls">
            <div class="cart-item-qty">
              <button class="btn-qty-dec" data-idx="${index}"><i class="fa-solid fa-minus"></i></button>
              <span>${item.quantity}</span>
              <button class="btn-qty-inc" data-idx="${index}"><i class="fa-solid fa-plus"></i></button>
            </div>
            <span class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
            <button class="cart-item-delete btn-delete-item" data-idx="${index}" aria-label="Delete item"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Steppers & deletion listeners
  wrapper.querySelectorAll(".btn-qty-dec").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      if (cart[idx].quantity > 1) {
        cart[idx].quantity--;
        saveAndReloadCart();
      }
    });
  });

  wrapper.querySelectorAll(".btn-qty-inc").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      cart[idx].quantity++;
      saveAndReloadCart();
    });
  });

  wrapper.querySelectorAll(".btn-delete-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.idx);
      cart.splice(idx, 1);
      saveAndReloadCart();
    });
  });

  calculateCartTotals();
}

function saveAndReloadCart() {
  localStorage.setItem("atelier_cart", JSON.stringify(cart));
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge-count");
  if (!badge) return;
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

function calculateCartTotals() {
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  let discountVal = 0;
  if (promoCodeApplied) {
    const promo = validPromos[promoCodeApplied];
    if (promo.type === "percent") {
      discountVal = subtotal * (promo.value / 100);
    } else if (promo.type === "flat") {
      discountVal = Math.min(promo.value, subtotal);
    }
  }

  // Free shipping on subtotal > ₹9,999, otherwise flat ₹499
  const shippingVal = subtotal > 9999 ? 0 : 499;
  const total = Math.max(0, subtotal - discountVal + shippingVal);

  document.getElementById("cart-subtotal").textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  document.getElementById("cart-discount").textContent = `-₹${discountVal.toLocaleString('en-IN')}`;
  document.getElementById("cart-shipping").textContent = shippingVal === 0 ? "FREE" : `₹${shippingVal.toLocaleString('en-IN')}`;
  document.getElementById("cart-total").textContent = `₹${total.toLocaleString('en-IN')}`;
}

// ==========================================
// Interactive Offers & Games
// ==========================================

function setupOffersTab() {
  // 1. FLASH SALE TIMER
  updateCountdownUI();

  // 2. SCRATCH CARD GAME (HTML5 Canvas scratch logic)
  initScratchCard();

  // 3. SPIN THE WHEEL GAME
  initSpinWheel();
}

function tickCountdown() {
  if (countdownTime > 0) {
    countdownTime--;
    updateCountdownUI();
  }
}

function updateCountdownUI() {
  const hrs = Math.floor(countdownTime / 3600);
  const mins = Math.floor((countdownTime % 3600) / 60);
  const secs = countdownTime % 60;

  const hEl = document.getElementById("timer-hrs");
  const mEl = document.getElementById("timer-mins");
  const sEl = document.getElementById("timer-secs");

  if (hEl && mEl && sEl) {
    hEl.textContent = String(hrs).padStart(2, "0");
    mEl.textContent = String(mins).padStart(2, "0");
    sEl.textContent = String(secs).padStart(2, "0");
  }
}

function initScratchCard() {
  const canvas = document.getElementById("scratch-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  
  // Set dimensions based on client bounding
  canvas.width = 320;
  canvas.height = 180;
  
  // Reset and paint silver top overlay
  ctx.fillStyle = "#888888";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some text instructions printed on canvas
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SCRATCH HERE FOR VOUCHER", canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "italic 11px Outfit, sans-serif";
  ctx.fillText("(Click & rub to reveal code)", canvas.width / 2, canvas.height / 2 + 15);

  let isDrawing = false;
  let scratchedAmount = 0;
  let hasRevealed = false;

  const scratch = (e) => {
    if (!isDrawing || hasRevealed) return;
    
    // Find scratch position relative to canvas
    const x = (e.clientX || e.touches[0].clientX) - canvas.getBoundingClientRect().left;
    const y = (e.clientY || e.touches[0].clientY) - canvas.getBoundingClientRect().top;
    
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Check scratching progress
    checkScratchProgress();
  };

  const checkScratchProgress = () => {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparent = 0;
    
    // Check every 10th pixel for transparency optimization
    for (let i = 0; i < pixels.length; i += 40) {
      if (pixels[i + 3] === 0) {
        transparent++;
      }
    }

    const percent = (transparent / (pixels.length / 40)) * 100;
    if (percent > 45 && !hasRevealed) {
      hasRevealed = true;
      canvas.style.opacity = 0;
      canvas.style.pointerEvents = "none";
      
      // Inject discount voucher code 'SCRATCH25' to active vouchers (25% off)
      validPromos["SCRATCH25"] = { type: "percent", value: 25 };
      
      // Notify user
      const codeReveal = document.getElementById("scratch-reveal");
      if (codeReveal) {
        codeReveal.querySelector("span").textContent = "YOUR UNLOCKED CODE (25% OFF)";
        alert("Congratulations! You've unlocked promo code 'SCRATCH25' (25% Off everything). Use it in your cart details.");
      }
    }
  };

  canvas.addEventListener("mousedown", (e) => { isDrawing = true; scratch(e); });
  canvas.addEventListener("mousemove", scratch);
  window.addEventListener("mouseup", () => isDrawing = false);

  canvas.addEventListener("touchstart", (e) => { isDrawing = true; scratch(e); });
  canvas.addEventListener("touchmove", scratch);
  window.addEventListener("touchend", () => isDrawing = false);
}

function initSpinWheel() {
  const spinBtn = document.getElementById("btn-spin-wheel");
  const wheel = document.getElementById("wheel-svg");
  if (!spinBtn || !wheel) return;

  const sectors = [
    { label: "10% OFF", code: "WHEEL10", value: 10, type: "percent" },
    { label: "TRY AGAIN", code: "", value: 0, type: "none" },
    { label: "30% OFF", code: "WHEEL30", value: 30, type: "percent" },
    { label: "FREE SHIP", code: "FREESHIP", value: 499, type: "flat" }, // flat shipping waiver
    { label: "15% OFF", code: "WHEEL15", value: 15, type: "percent" },
    { label: "JACKPOT 50%", code: "JACKPOT50", value: 50, type: "percent" }
  ];

  let isSpinning = false;

  spinBtn.addEventListener("click", () => {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;

    // Pick a sector randomly
    const targetIdx = Math.floor(Math.random() * sectors.length);
    const sectorAngle = 360 / sectors.length;
    
    // Rotate multiple circles plus target sector center angle
    const baseSpins = 5 * 360; // 5 full rotations
    const finalAngle = baseSpins + (360 - (targetIdx * sectorAngle + (sectorAngle / 2)));
    
    wheel.style.transform = `rotate(${finalAngle}deg)`;

    setTimeout(() => {
      isSpinning = false;
      spinBtn.disabled = false;
      const prize = sectors[targetIdx];

      if (prize.value > 0) {
        // Register voucher
        validPromos[prize.code] = { type: prize.type, value: prize.value };
        
        alert(`You won: ${prize.label}! Use promo code: ${prize.code} in the cart.`);
      } else {
        alert("Oops! Unfortunate spin. Try reloading the page to spin again!");
      }
    }, 5100); // match 5s CSS transition curve + buffer
  });
}

// ==========================================
// Branches Map & Locator
// ==========================================

function initLeafletMap() {
  if (map !== null) {
    // Already initialized
    map.invalidateSize();
    return;
  }

  // Milan center coordinate roughly
  map = L.map("map").setView([35.0, 0.0], 2);

  // Load OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);

  // Render Pins for each branch
  branches.forEach(b => {
    const marker = L.marker([b.lat, b.lng]).addTo(map);
    
    // Custom popup
    const popupContent = `
      <div style="font-family: var(--font-body); padding: 5px;">
        <h4 style="font-family: var(--font-heading); color: var(--accent-gold); margin-bottom: 5px;">${b.name}</h4>
        <p style="font-size: 11px; margin-bottom: 3px;"><strong>Addr:</strong> ${b.address}</p>
        <p style="font-size: 11px; margin-bottom: 3px;"><strong>Phone:</strong> ${b.phone}</p>
        <p style="font-size: 11px;"><strong>Hours:</strong> ${b.hours}</p>
      </div>
    `;
    marker.bindPopup(popupContent);
    
    marker.on("click", () => {
      highlightBranchCard(b.id);
    });
  });

  // Load branch list elements
  renderBranchList();
  
  // Geolocation trigger
  const geoBtn = document.getElementById("btn-find-closest");
  if (geoBtn) {
    geoBtn.addEventListener("click", findClosestBranch);
  }
}

function renderBranchList() {
  const container = document.getElementById("branch-list");
  if (!container) return;

  container.innerHTML = branches.map(b => {
    return `
      <div class="branch-card ${b.id === activeBranchId ? 'active' : ''}" data-id="${b.id}" id="branch-card-${b.id}">
        <h4 class="branch-name">${b.name}</h4>
        <div class="branch-details">
          <p><i class="fa-solid fa-map-pin"></i> ${b.address}</p>
          <p><i class="fa-solid fa-phone"></i> ${b.phone}</p>
          <p><i class="fa-solid fa-clock"></i> ${b.hours}</p>
        </div>
      </div>
    `;
  }).join("");

  // Add click card events
  container.querySelectorAll(".branch-card").forEach(card => {
    card.addEventListener("click", () => {
      const bid = parseInt(card.dataset.id);
      focusBranch(bid);
    });
  });
}

function focusBranch(branchId) {
  activeBranchId = branchId;
  const b = branches.find(x => x.id === branchId);
  if (!b || !map) return;

  // Highlight card
  highlightBranchCard(branchId);

  // Pan Map smoothly
  map.flyTo([b.lat, b.lng], 13, {
    animate: true,
    duration: 1.5
  });

  // Open Marker Popup (find marker by coordinates matching)
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      const latlng = layer.getLatLng();
      if (Math.abs(latlng.lat - b.lat) < 0.001 && Math.abs(latlng.lng - b.lng) < 0.001) {
        layer.openPopup();
      }
    }
  });
}

function highlightBranchCard(branchId) {
  activeBranchId = branchId;
  document.querySelectorAll(".branch-card").forEach(card => {
    card.classList.remove("active");
  });
  const activeCard = document.getElementById(`branch-card-${branchId}`);
  if (activeCard) {
    activeCard.classList.add("active");
    activeCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// Distance solver (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findClosestBranch() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  alert("Accessing location...");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const uLat = pos.coords.latitude;
      const uLng = pos.coords.longitude;

      let closest = null;
      let minDist = Infinity;

      branches.forEach(b => {
        const d = calculateDistance(uLat, uLng, b.lat, b.lng);
        if (d < minDist) {
          minDist = d;
          closest = b;
        }
      });

      if (closest) {
        alert(`Found your closest store: ${closest.name} (${Math.round(minDist)} km away). Directing map there...`);
        focusBranch(closest.id);
      }
    },
    (err) => {
      alert(`Geolocation error: ${err.message}. Defaulting to Paris Flagship.`);
      focusBranch(1);
    }
  );
}

// ==========================================
// Simulated Checkout & Order Tracking
// ==========================================

let checkoutStepsTimer = null;

function setupCheckout() {
  const checkoutBtn = document.getElementById("btn-cart-checkout");
  const checkoutModal = document.getElementById("checkout-modal");
  const closeBtn = checkoutModal.querySelector(".modal-close");
  const form = document.getElementById("checkout-form");

  checkoutBtn.addEventListener("click", () => {
    // Close cart drawer
    document.getElementById("cart-drawer").classList.remove("active");
    
    // Reset order timeline UI steps
    resetTimeline();
    
    // Open checkout modal
    checkoutModal.classList.add("active");
  });

  closeBtn.addEventListener("click", () => {
    checkoutModal.classList.remove("active");
    if (checkoutStepsTimer) clearInterval(checkoutStepsTimer);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Verify forms fields
    const name = document.getElementById("checkout-name").value;
    const email = document.getElementById("checkout-email").value;
    const address = document.getElementById("checkout-address").value;
    
    if (!name || !email || !address) {
      alert("Please fill in all shipping details.");
      return;
    }

    // Trigger simulation timeline progress
    startCheckoutSimulation();
  });
}

function resetTimeline() {
  const steps = document.querySelectorAll(".timeline-step");
  const progressLine = document.getElementById("timeline-progress");
  
  steps.forEach(s => s.className = "timeline-step");
  if (progressLine) progressLine.style.height = "0%";
  if (checkoutStepsTimer) clearInterval(checkoutStepsTimer);
  
  // Submit btn state
  document.getElementById("btn-place-order").disabled = false;
  document.getElementById("btn-place-order").innerHTML = '<i class="fa-solid fa-lock"></i> Authorize & Place Order';
}

function startCheckoutSimulation() {
  const steps = document.querySelectorAll(".timeline-step");
  const progressLine = document.getElementById("timeline-progress");
  const submitBtn = document.getElementById("btn-place-order");

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> Processing Payment...';

  let currentStep = 0;
  
  // Step intervals (cycles status step by step every 3 seconds)
  checkoutStepsTimer = setInterval(() => {
    if (currentStep < steps.length) {
      // Mark previous completed
      if (currentStep > 0) {
        steps[currentStep - 1].classList.remove("active");
        steps[currentStep - 1].classList.add("completed");
      }
      
      // Mark current active
      steps[currentStep].classList.add("active");
      
      // Update progress bar line height percent
      const progressPercent = (currentStep / (steps.length - 1)) * 100;
      progressLine.style.height = `${progressPercent}%`;

      currentStep++;
    } else {
      // Finished all steps
      steps[steps.length - 1].classList.remove("active");
      steps[steps.length - 1].classList.add("completed");
      clearInterval(checkoutStepsTimer);

      setTimeout(() => {
        alert("Simulation Complete! Your order was successfully delivered. Cart has been reset.");
        
        // Reset Cart and Storage
        cart = [];
        localStorage.removeItem("atelier_cart");
        updateCartBadge();
        
        // Close modal
        document.getElementById("checkout-modal").classList.remove("active");
      }, 800);
    }
  }, 3000); // 3 seconds per delivery stage update
}
