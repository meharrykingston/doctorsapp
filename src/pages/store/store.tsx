import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AppIcon, type IconName } from '../../components/ui/icons'
import { createPharmacyOrder, fetchPharmacyProducts, type PharmacyProduct } from '../../services/pharmacyApi'
import type { AppRoute } from '../../types/routes'
import { getDoctorProfile } from '../../utils/doctorProfile'
import './store.css'

type StoreProps = {
  onNavigate: (route: AppRoute) => void
}

type Product = {
  id: string
  name: string
  price: number
  icon: IconName
  imageUrl: string
  gallery: string[]
  category: 'Diagnostic Tools' | 'Clinical Supplies' | 'Protective Care' | 'Devices'
  inStock: boolean
  specs: string[]
  description: string
  rating: number
  reviews: number
  imageTone: 'blue' | 'mint' | 'amber' | 'indigo'
}

type CheckoutStep = 1 | 2 | 3
type PaymentMethod = 'UPI' | 'Card' | 'Net Banking'
type CheckoutItem = { productId: string; quantity: number }

const productsFallback: Product[] = [
  {
    id: 'p1',
    name: 'Premium Stethoscope',
    price: 2500,
    icon: 'stethoscope',
    imageUrl: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
    ],
    category: 'Diagnostic Tools',
    inStock: true,
    specs: ['Dual-head chestpiece', 'Acoustic precision', '5-year warranty'],
    description: 'Cardiology-grade acoustic stethoscope with soft sealing eartips.',
    rating: 4.8,
    reviews: 1248,
    imageTone: 'blue',
  },
  {
    id: 'p2',
    name: 'Digital Thermometer',
    price: 500,
    icon: 'thermometer',
    imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=900&q=80',
    ],
    category: 'Devices',
    inStock: true,
    specs: ['Fast 15 sec read', 'Fever alarm', 'Auto power-off'],
    description: 'Quick digital temperature checks for OPD and home visits.',
    rating: 4.5,
    reviews: 852,
    imageTone: 'mint',
  },
  {
    id: 'p3',
    name: 'BP Monitor',
    price: 1800,
    icon: 'syringe',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=900&q=80',
    ],
    category: 'Devices',
    inStock: true,
    specs: ['Large display', '120 memory slots', 'WHO indicator'],
    description: 'Digital blood pressure monitor suited for daily practice.',
    rating: 4.6,
    reviews: 643,
    imageTone: 'indigo',
  },
  {
    id: 'p4',
    name: 'Pulse Oximeter',
    price: 1200,
    icon: 'store',
    imageUrl: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
    ],
    category: 'Diagnostic Tools',
    inStock: true,
    specs: ['SpO2 + Pulse', 'OLED display', 'Low battery indicator'],
    description: 'Portable finger pulse oximeter for instant oxygen checks.',
    rating: 4.4,
    reviews: 718,
    imageTone: 'blue',
  },
  {
    id: 'p5',
    name: 'Disposable Gloves (100)',
    price: 500,
    icon: 'gloves',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=900&q=80',
    ],
    category: 'Protective Care',
    inStock: true,
    specs: ['Latex free', 'Powder free', 'Single-use clinical grade'],
    description: 'Safe and comfortable disposable gloves for everyday procedures.',
    rating: 4.7,
    reviews: 2110,
    imageTone: 'mint',
  },
  {
    id: 'p6',
    name: 'Surgical Masks (50)',
    price: 300,
    icon: 'mask',
    imageUrl: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=900&q=80',
    ],
    category: 'Protective Care',
    inStock: true,
    specs: ['3-ply protection', 'Breathable', 'Elastic earloops'],
    description: 'Daily surgical mask pack for OPD and clinic operations.',
    rating: 4.5,
    reviews: 1430,
    imageTone: 'amber',
  },
  {
    id: 'p7',
    name: 'Hand Sanitizer (500ml)',
    price: 200,
    icon: 'bottle',
    imageUrl: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584634731339-252c581abfc5?auto=format&fit=crop&w=900&q=80',
    ],
    category: 'Clinical Supplies',
    inStock: true,
    specs: ['70% alcohol', 'Quick dry', 'Pump bottle'],
    description: 'Clinic-grade sanitizer for infection-safe patient handling.',
    rating: 4.6,
    reviews: 968,
    imageTone: 'mint',
  },
  {
    id: 'p8',
    name: 'Otoscope',
    price: 3500,
    icon: 'otoscope',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=500&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80',
    ],
    category: 'Diagnostic Tools',
    inStock: false,
    specs: ['LED illumination', 'Magnified lens', 'Carry case included'],
    description: 'High-clarity otoscope for ENT examination workflows.',
    rating: 4.3,
    reviews: 420,
    imageTone: 'indigo',
  },
]

const tonePalette: Product['imageTone'][] = ['blue', 'mint', 'amber', 'indigo']

function pickIcon(category?: string | null): IconName {
  if (!category) return 'store'
  const normalized = category.toLowerCase()
  if (normalized.includes('diagnostic')) return 'stethoscope'
  if (normalized.includes('device')) return 'thermometer'
  if (normalized.includes('protect')) return 'mask'
  if (normalized.includes('clinical') || normalized.includes('supply')) return 'bottle'
  return 'store'
}

function mapProduct(item: PharmacyProduct, index: number): Product {
  const gallery = item.image_urls_json?.length ? item.image_urls_json : [
    'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=900&q=80',
  ]
  return {
    id: item.id,
    name: item.name,
    price: Number(item.base_price_inr ?? 0),
    icon: pickIcon(item.category),
    imageUrl: gallery[0],
    gallery,
    category: (item.category as Product['category']) ?? 'Devices',
    inStock: typeof item.in_stock === 'boolean' ? item.in_stock : true,
    specs: ['Clinic grade', 'Verified quality', 'Fast delivery'],
    description: item.description ?? 'Doctor essentials curated for daily practice.',
    rating: 4.5,
    reviews: 500 + index * 37,
    imageTone: tonePalette[index % tonePalette.length],
  }
}

function formatINR(value: number) {
  return `INR ${new Intl.NumberFormat('en-IN').format(value)}`
}

function Store({ onNavigate }: StoreProps) {
  const PAGE_SIZE = 4
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<'All' | Product['category']>('All')
  const [products, setProducts] = useState<Product[]>(productsFallback)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([])
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>(1)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<'clinic' | 'home'>('clinic')
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const doctorProfile = getDoctorProfile()

  const productMap = useMemo(() => new Map(products.map((item) => [item.id, item])), [products])
  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0)

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((item) => {
      const byCategory = activeCategory === 'All' || item.category === activeCategory
      const byQuery = !q || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(q)
      return byCategory && byQuery
    })
  }, [query, activeCategory])

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  )

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = productMap.get(productId)
          if (!product || quantity <= 0) return null
          return { product, quantity }
        })
        .filter((item): item is { product: Product; quantity: number } => Boolean(item)),
    [cart, productMap],
  )

  const checkoutSummary = useMemo(() => {
    const rows = checkoutItems
      .map(({ productId, quantity }) => {
        const product = productMap.get(productId)
        if (!product || quantity <= 0) return null
        return { product, quantity, lineTotal: product.price * quantity }
      })
      .filter((item): item is { product: Product; quantity: number; lineTotal: number } => Boolean(item))
    const subtotal = rows.reduce((sum, row) => sum + row.lineTotal, 0)
    const walletUse = Math.floor(subtotal * 0.1)
    const payable = Math.max(0, subtotal - walletUse)
    return { rows, subtotal, walletUse, payable }
  }, [checkoutItems, productMap])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeCategory, query])

  useEffect(() => {
    let active = true
    async function loadProducts() {
      try {
        const rows = await fetchPharmacyProducts({ limit: 60, audience: 'doctor' })
        if (!active || !rows?.length) return
        setProducts(rows.map((item, index) => mapProduct(item, index)))
      } catch {
        if (active) setProducts(productsFallback)
      }
    }
    loadProducts()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedProduct || selectedProduct.gallery.length <= 1) return
    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev === selectedProduct.gallery.length - 1 ? 0 : prev + 1))
    }, 2600)
    return () => window.clearInterval(interval)
  }, [selectedProduct])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (!entry?.isIntersecting) return
        setVisibleCount((prev) => (prev < filteredProducts.length ? Math.min(prev + PAGE_SIZE, filteredProducts.length) : prev))
      },
      { rootMargin: '180px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [filteredProducts.length])

  function addToCart(productId: string) {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }))
  }

  function updateCartQuantity(productId: string, quantity: number) {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      return { ...prev, [productId]: quantity }
    })
  }

  function openBuyNow(productId: string) {
    setCheckoutItems([{ productId, quantity: 1 }])
    setCheckoutStep(1)
    setOrderPlaced(false)
    setCheckoutOpen(true)
    setSelectedProduct(null)
    setIsCartOpen(false)
  }

  function openProductPreview(product: Product) {
    setSelectedProduct(product)
    setActiveSlide(0)
  }

  function openCheckoutFromCart() {
    if (!cartItems.length) return
    setCheckoutItems(cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })))
    setCheckoutStep(1)
    setOrderPlaced(false)
    setCheckoutOpen(true)
    setIsCartOpen(false)
  }

  function closeCheckout() {
    setCheckoutOpen(false)
    setCheckoutStep(1)
  }

  async function placeOrder() {
    const doctorName = doctorProfile.fullName ?? 'Doctor'
    await createPharmacyOrder({
      companyReference: doctorProfile.companyId ?? 'astikan-demo-company',
      companyName: 'Astikan',
      doctor: {
        email: doctorProfile.email,
        phone: doctorProfile.mobile,
        fullName: doctorName,
        handle: doctorProfile.userId ?? doctorName,
      },
      orderSource: 'doctor_store',
      subtotalInr: checkoutSummary.subtotal,
      walletUsedInr: checkoutSummary.walletUse,
      onlinePaymentInr: checkoutSummary.payable,
      items: checkoutSummary.rows.map((row) => ({
        productId: row.product.id,
        sku: row.product.id,
        name: row.product.name,
        category: row.product.category,
        description: row.product.description,
        price: row.product.price,
        quantity: row.quantity,
        imageUrls: row.product.gallery,
      })),
    })
    setOrderPlaced(true)
    const checkoutIds = new Set(checkoutItems.map((item) => item.productId))
    setCart((prev) => {
      const next = { ...prev }
      checkoutIds.forEach((productId) => {
        delete next[productId]
      })
      return next
    })
  }

  return (
    <section className="store-page">
      <header className="mobile-topbar">
        <button type="button" className="bar-icon" aria-label="back" onClick={() => onNavigate('dashboard')}>
          <AppIcon name="arrow-left" className="bar-svg" />
        </button>
        <h1>Astikan Store</h1>
        <div className="bar-right">
          <button type="button" className="bar-icon" aria-label="open cart" onClick={() => setIsCartOpen(true)}>
            <AppIcon name="cart" className="bar-svg" />
            {cartCount > 0 ? <span className="dot">{cartCount}</span> : null}
          </button>
        </div>
      </header>

      <main className="store-content">
        <section className="zepto-banner card-rise" style={{ '--d': '0ms' } as CSSProperties}>
          <div className="banner-art" aria-hidden="true">
            <span className="banner-dot a" />
            <span className="banner-dot b" />
            <span className="banner-pill"><AppIcon name="store" className="tiny" /></span>
          </div>
          <h2>Doctor Essentials in Minutes</h2>
          <p>Zepto speed with Amazon-level product detail, quality and trust for your clinic.</p>
          <div className="banner-row">
            <span>Delivery in 15-30 mins</span>
          </div>
        </section>

        <section className="search-row card-rise" style={{ '--d': '35ms' } as CSSProperties}>
          <div className="search-box">
            <AppIcon name="search" className="tiny" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clinic products..." />
          </div>
        </section>

        <section className="category-slider card-rise" style={{ '--d': '55ms' } as CSSProperties}>
          {([
            { key: 'All', icon: 'sparkles', label: 'All' },
            { key: 'Diagnostic Tools', icon: 'stethoscope', label: 'Diagnostics' },
            { key: 'Devices', icon: 'thermometer', label: 'Devices' },
            { key: 'Clinical Supplies', icon: 'bottle', label: 'Supplies' },
            { key: 'Protective Care', icon: 'mask', label: 'Protective' },
          ] as const).map((item) => (
            <button
              key={item.key}
              type="button"
              className={activeCategory === item.key ? 'active' : ''}
              onClick={() => setActiveCategory(item.key)}
            >
              <AppIcon name={item.icon} className="tiny" /> {item.label}
            </button>
          ))}
        </section>

        <section className="product-list">
          {visibleProducts.map((product, idx) => (
            <article
              key={product.id}
              className="product-card card-rise"
              style={{ '--d': `${80 + idx * 20}ms` } as CSSProperties}
              onClick={() => openProductPreview(product)}
            >
              <button type="button" className={`product-image-box ${product.imageTone}`} onClick={() => openProductPreview(product)}>
                <span className="badge">Astikan Choice</span>
                <img src={product.imageUrl} alt={product.name} className="product-photo" />
              </button>

              <div className="product-main">
                <h4>{product.name}</h4>
                <p className="rating-row">
                  <strong>{product.rating.toFixed(1)} â˜…</strong>
                  <span>({new Intl.NumberFormat('en-IN').format(product.reviews)})</span>
                </p>
                <p>{product.description}</p>
                <div className="meta">
                  <span>{product.category}</span>
                  <span className={product.inStock ? 'stock' : 'out'}>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                </div>
              </div>

              <div className="product-side">
                <strong>{formatINR(product.price)}</strong>
                <button
                  type="button"
                  className="buy-btn icon-only-action"
                  onClick={(event) => {
                    event.stopPropagation()
                    addToCart(product.id)
                  }}
                  disabled={!product.inStock}
                  aria-label="Add to cart"
                >
                  <AppIcon name="cart" className="btn-icon" />
                </button>
              </div>
            </article>
          ))}
        </section>

        {visibleCount < filteredProducts.length ? (
          <section className="scroll-sentinel-wrap card-rise" style={{ '--d': '165ms' } as CSSProperties}>
            <div ref={loadMoreRef} className="scroll-sentinel">
              <span className="scroll-loader" />
            </div>
          </section>
        ) : null}
      </main>

      {selectedProduct ? (
        <div className="product-modal-overlay" role="dialog" aria-modal="true" onClick={() => setSelectedProduct(null)}>
          <section className="product-modal-card product-detail-card" onClick={(event) => event.stopPropagation()}>
            <div className={`detail-hero ${selectedProduct.imageTone}`}>
              <button type="button" className="ghost detail-close" onClick={() => setSelectedProduct(null)}>
                <AppIcon name="arrow-left" className="btn-icon" />
              </button>
              <button
                type="button"
                className="slider-nav prev"
                aria-label="previous image"
                onClick={() => setActiveSlide((prev) => (prev === 0 ? selectedProduct.gallery.length - 1 : prev - 1))}
              >
                <AppIcon name="arrow-left" className="btn-icon" />
              </button>
              <div className="detail-slider-window">
                <div className="detail-slider-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                  {selectedProduct.gallery.map((image, idx) => (
                    <img key={`${selectedProduct.id}-${idx}`} src={image} alt={`${selectedProduct.name} ${idx + 1}`} className="detail-main-photo" />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="slider-nav next"
                aria-label="next image"
                onClick={() => setActiveSlide((prev) => (prev === selectedProduct.gallery.length - 1 ? 0 : prev + 1))}
              >
                <AppIcon name="play" className="btn-icon" />
              </button>
            </div>
            <div className="thumb-row">
              {selectedProduct.gallery.map((image, idx) => (
                <button
                  key={`${selectedProduct.id}-thumb-${idx}`}
                  type="button"
                  className={`thumb ${activeSlide === idx ? 'active' : ''}`}
                  onClick={() => setActiveSlide(idx)}
                >
                  <img src={image} alt={`${selectedProduct.name} ${idx + 1}`} className="thumb-photo" />
                </button>
              ))}
            </div>
            <h3>{selectedProduct.name}</h3>
            <p className="detail-rating">
              {selectedProduct.rating.toFixed(1)} â˜… ({new Intl.NumberFormat('en-IN').format(selectedProduct.reviews)} ratings)
            </p>
            <p>{selectedProduct.description}</p>
            <ul>
              {selectedProduct.specs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
              <div className="modal-footer">
                <strong>{formatINR(selectedProduct.price)}</strong>
                <div className="detail-actions">
                  <button
                    type="button"
                    className="ghost icon-only-action"
                    aria-label="add to cart"
                    onClick={() => addToCart(selectedProduct.id)}
                    disabled={!selectedProduct.inStock}
                  >
                    <AppIcon name="cart" className="btn-icon" />
                  </button>
                  <button type="button" className="primary" onClick={() => openBuyNow(selectedProduct.id)} disabled={!selectedProduct.inStock}>
                    <AppIcon name="wallet" className="btn-icon" /> Buy Now
                  </button>
                </div>
              </div>
          </section>
        </div>
      ) : null}

      {isCartOpen ? (
        <div className="product-modal-overlay" role="dialog" aria-modal="true" onClick={() => setIsCartOpen(false)}>
          <section className="product-modal-card cart-sheet" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>Your Cart</h3>
              <button type="button" className="ghost icon-only-action" onClick={() => setIsCartOpen(false)} aria-label="Close cart">
                <AppIcon name="close" className="btn-icon" />
              </button>
            </header>

            <div className="cart-list">
              {cartItems.length ? (
                cartItems.map(({ product, quantity }) => (
                  <article key={product.id} className="cart-item">
                    <span className={`cart-thumb ${product.imageTone}`}>
                      <img src={product.imageUrl} alt={product.name} className="cart-photo" />
                    </span>
                    <div className="cart-main">
                      <h4>{product.name}</h4>
                      <p>{formatINR(product.price)}</p>
                    </div>
                    <div className="qty-box">
                      <button type="button" onClick={() => updateCartQuantity(product.id, quantity - 1)}>
                        -
                      </button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => updateCartQuantity(product.id, quantity + 1)}>
                        +
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="empty">Cart is empty. Add products to continue.</p>
              )}
            </div>

            <footer className="cart-footer">
              <div>
                <small>Items: {cartCount}</small>
                <strong>{formatINR(cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}</strong>
              </div>
              <button type="button" className="primary" onClick={openCheckoutFromCart} disabled={!cartItems.length}>
                Proceed to Checkout
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {checkoutOpen ? (
        <div className="product-modal-overlay" role="dialog" aria-modal="true" onClick={closeCheckout}>
          <section className="product-modal-card checkout-sheet" onClick={(event) => event.stopPropagation()}>
            {orderPlaced ? (
              <section className="order-success">
                <div className="success-icon">âœ“</div>
                <h3>Order placed successfully</h3>
                <p>Your order is confirmed and delivery partner is being assigned.</p>
                <button type="button" className="primary" onClick={closeCheckout}>
                  Continue Shopping
                </button>
              </section>
            ) : (
              <>
                <header className="checkout-head">
                  <h3>Checkout</h3>
                  <button type="button" className="ghost" onClick={closeCheckout}>
                    Close
                  </button>
                </header>

                <div className="checkout-steps">
                  <span className={checkoutStep >= 1 ? 'active' : ''}>1. Billing</span>
                  <span className={checkoutStep >= 2 ? 'active' : ''}>2. Payment</span>
                  <span className={checkoutStep >= 3 ? 'active' : ''}>3. Review</span>
                </div>

                {checkoutStep === 1 ? (
                  <section className="step-card">
                    <h4>Select Billing Address</h4>
                    <button type="button" className={`address-card ${selectedAddress === 'clinic' ? 'active' : ''}`} onClick={() => setSelectedAddress('clinic')}>
                      <strong>Clinic Address</strong>
                      <p>Astikan MedCare, Koramangala, Bengaluru</p>
                    </button>
                    <button type="button" className={`address-card ${selectedAddress === 'home' ? 'active' : ''}`} onClick={() => setSelectedAddress('home')}>
                      <strong>Home Address</strong>
                      <p>HSR Layout Sector 2, Bengaluru</p>
                    </button>
                  </section>
                ) : null}

                {checkoutStep === 2 ? (
                  <section className="step-card">
                    <h4>Payment Split</h4>
                    <p className="pay-note">Wallet auto-applied up to 10% of order value.</p>
                    <div className="split-row">
                      <span>Subtotal</span>
                      <strong>{formatINR(checkoutSummary.subtotal)}</strong>
                    </div>
                    <div className="split-row wallet">
                      <span>Wallet Usage (10%)</span>
                      <strong>- {formatINR(checkoutSummary.walletUse)}</strong>
                    </div>
                    <div className="split-row total">
                      <span>Payable</span>
                      <strong>{formatINR(checkoutSummary.payable)}</strong>
                    </div>
                    <div className="pay-methods">
                      {(['UPI', 'Card', 'Net Banking'] as const).map((method) => (
                        <button key={method} type="button" className={paymentMethod === method ? 'active' : ''} onClick={() => setPaymentMethod(method)}>
                          {method}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                {checkoutStep === 3 ? (
                  <section className="step-card">
                    <h4>Review Order</h4>
                    <div className="review-list">
                      {checkoutSummary.rows.map((row) => (
                        <article key={row.product.id}>
                          <span>{row.product.name} x {row.quantity}</span>
                          <strong>{formatINR(row.lineTotal)}</strong>
                        </article>
                      ))}
                    </div>
                    <div className="split-row">
                      <span>Payment Mode</span>
                      <strong>{paymentMethod}</strong>
                    </div>
                    <div className="split-row total">
                      <span>Final Payable</span>
                      <strong>{formatINR(checkoutSummary.payable)}</strong>
                    </div>
                  </section>
                ) : null}

                <footer className="checkout-footer">
                  <button type="button" className="ghost" onClick={() => setCheckoutStep((prev) => (prev > 1 ? ((prev - 1) as CheckoutStep) : prev))} disabled={checkoutStep === 1}>
                    Back
                  </button>
                  {checkoutStep < 3 ? (
                    <button type="button" className="primary" onClick={() => setCheckoutStep((prev) => (prev < 3 ? ((prev + 1) as CheckoutStep) : prev))}>
                      Continue
                    </button>
                  ) : (
                    <button type="button" className="primary" onClick={placeOrder}>
                      Place Order
                    </button>
                  )}
                </footer>
              </>
            )}
          </section>
        </div>
      ) : null}

      <nav className="bottom-nav">
        <button type="button" className="nav-item" onClick={() => onNavigate('dashboard')}>
          <AppIcon name="home" className="nav-svg" />
          <span>Home</span>
        </button>
        <button type="button" className="nav-item" onClick={() => onNavigate('patients')}>
          <AppIcon name="patients" className="nav-svg" />
          <span>Patients</span>
        </button>
        <button type="button" className="nav-item" onClick={() => onNavigate('appointments')}>
          <AppIcon name="calendar" className="nav-svg" />
          <span>Appointments</span>
        </button>
        <button type="button" className="nav-item" onClick={() => onNavigate('freelance-cases')}>
          <AppIcon name="sparkles" className="nav-svg" />
          <span>Explore</span>
        </button>
        <button type="button" className="nav-item active" onClick={() => onNavigate('store')}>
          <AppIcon name="store" className="nav-svg" />
          <span>Store</span>
        </button>
      </nav>
    </section>
  )
}

export default Store

