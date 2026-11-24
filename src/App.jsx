import { useEffect, useId, useRef, useState } from 'react'
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { useProducts } from './hooks/useProducts'
import './App.css'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="Coffee R Us home">
          <span className="brand-mark">CR</span>
          <span>Coffee <strong>R Us</strong><small>STORE ADMIN</small></span>
        </Link>
        <p className="nav-caption">WORKSPACE</p>
        <nav className="side-nav" aria-label="Main navigation">
          <NavLink end to="/">Overview</NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/products/new">Add product</NavLink>
        </nav>
        <div className="sidebar-note">
          <span className="online-dot" /> Store is open
          <small>All systems operational</small>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs"><span>Store</span><span>/</span><strong>Administration</strong></div>
          <div className="profile"><span className="profile-avatar">A</span><span>Admin<small>Store manager</small></span></div>
        </header>
        <main className="page-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<ProductFormPage />} />
            <Route path="/products/:id" element={<ProductDetailsPage />} />
            <Route path="/products/:id/edit" element={<ProductFormPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="page-footer"><span>Coffee R Us</span><span>Thoughtfully sourced. Carefully roasted.</span></footer>
      </div>
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="heading-description">{description}</p>}
      </div>
      {action}
    </div>
  )
}

function DashboardPage() {
  const { products, loading, error } = useProducts()
  const lowStock = products.filter((product) => Number(product.stock) < 20).length
  const stockCount = products.reduce((total, product) => total + Number(product.stock || 0), 0)

  return (
    <>
      <PageHeading
        eyebrow="MONDAY, YOUR STORE AT A GLANCE"
        title="Good coffee. Good business."
        description="A calm place to keep your shelves, prices, and product stories in order."
        action={<Link className="button button-primary" to="/products/new"><span aria-hidden="true">+</span> Add a product</Link>}
      />
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      <section className="stats-grid" aria-label="Store summary">
        <article className="stat-card"><span className="stat-label">Products listed</span><strong>{loading ? '—' : products.length.toString().padStart(2, '0')}</strong><span className="stat-foot">Across your coffee collection</span></article>
        <article className="stat-card stat-card-green"><span className="stat-label">Units in stock</span><strong>{loading ? '—' : stockCount.toLocaleString()}</strong><span className="stat-foot">Ready for the next order</span></article>
        <article className="stat-card stat-card-coral"><span className="stat-label">Running low</span><strong>{loading ? '—' : lowStock.toString().padStart(2, '0')}</strong><span className="stat-foot">Products below 20 units</span></article>
      </section>
      <section className="panel recent-panel">
        <div className="section-heading"><div><p className="eyebrow">YOUR CATALOG</p><h2>Recent products</h2></div><Link className="text-link" to="/products">View all products <span aria-hidden="true">→</span></Link></div>
        {loading ? <p className="empty-message">Loading your catalog…</p> : products.length ? (
          <div className="recent-list">
            {products.slice(0, 4).map((product) => <ProductRow key={product.id} product={product} />)}
          </div>
        ) : <p className="empty-message">Your catalog is ready for its first coffee.</p>}
      </section>
    </>
  )
}

function ProductsPage() {
  const { products, loading, error } = useProducts()
  const [query, setQuery] = useState('')
  const searchId = useId()
  const filteredProducts = products.filter((product) =>
    [product.name, product.category, product.origin, product.sku]
      .some((value) => String(value || '').toLowerCase().includes(query.trim().toLowerCase())),
  )

  return (
    <>
      <PageHeading
        eyebrow="THE COFFEE COLLECTION"
        title="Products"
        description="Search the catalog and keep every detail up to date."
        action={<Link className="button button-primary" to="/products/new"><span aria-hidden="true">+</span> Add a product</Link>}
      />
      <section className="panel catalog-panel">
        <div className="catalog-toolbar">
          <label className="search-field" htmlFor={searchId}><span aria-hidden="true">⌕</span><input id={searchId} aria-label="Search products by name, origin, or SKU" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, origin, SKU…" /></label>
          <span className="result-count">{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</span>
        </div>
        {error && <p className="notice notice-error" role="alert">{error}</p>}
        {loading ? <p className="empty-message">Loading products…</p> : filteredProducts.length ? (
          <div className="product-list">
            {filteredProducts.map((product) => <ProductRow key={product.id} product={product} />)}
          </div>
        ) : <p className="empty-message">No products match “{query}”. Try another search.</p>}
      </section>
    </>
  )
}

function ProductRow({ product }) {
  const lowStock = Number(product.stock) < 20
  return (
    <article className="product-row">
      <img className="product-thumb" src={product.image || fallbackImage} alt={`${product.name} coffee`} />
      <div className="product-info"><Link to={`/products/${product.id}`} className="product-name">{product.name}</Link><span>{product.category} <span className="bullet">·</span> {product.origin}</span></div>
      <span className="product-sku">{product.sku}</span>
      <span className="product-stock"><span className={lowStock ? 'stock-dot stock-low' : 'stock-dot'} />{product.stock} in stock</span>
      <strong className="product-price">{currency.format(Number(product.price))}</strong>
      <Link to={`/products/${product.id}`} className="row-action" aria-label={`View ${product.name}`}>View <span aria-hidden="true">→</span></Link>
    </article>
  )
}

const fallbackImage = 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=960&q=85'

function ProductFormPage() {
  const { products, createProduct, updateProduct, loading } = useProducts()
  const { id } = useParams()
  const navigate = useNavigate()
  const product = id ? products.find((item) => String(item.id) === id) : null
  const editing = Boolean(id)

  if (loading && editing) return <p className="empty-message">Loading product…</p>
  if (editing && !product) return <NotFoundPage />

  async function handleSave(values) {
    const savedProduct = editing
      ? await updateProduct(id, values)
      : await createProduct(values)
    navigate(`/products/${savedProduct.id}`)
  }

  return (
    <>
      <PageHeading eyebrow={editing ? 'UPDATE YOUR CATALOG' : 'GROW YOUR COLLECTION'} title={editing ? 'Edit product' : 'Add a product'} description={editing ? 'Make a change and keep the catalog current.' : 'Give a new coffee a place on your shelves.'} />
      <ProductForm key={product?.id || 'new'} product={product} onSave={handleSave} onCancel={() => navigate(editing ? `/products/${id}` : '/products')} />
    </>
  )
}

function ProductForm({ product, onSave, onCancel }) {
  const fieldsId = useId()
  const nameRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [values, setValues] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    origin: product?.origin || '',
    price: product?.price ?? '',
    stock: product?.stock ?? '',
    sku: product?.sku || '',
    image: product?.image || '',
  })

  useEffect(() => { nameRef.current?.focus() }, [])

  function updateField(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submitForm(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      await onSave({ ...values, price: Number(values.price), stock: Number(values.stock) })
    } catch (error) {
      setFormError(error.message || 'The product could not be saved. Please try again.')
      setSaving(false)
    }
  }

  const inputId = (name) => `${fieldsId}-${name}`
  return (
    <form className="panel product-form" onSubmit={submitForm}>
      {formError && <p className="notice notice-error" role="alert">{formError}</p>}
      <div className="form-section-title"><span>01</span><div><h2>Product details</h2><p>Start with the information customers recognize.</p></div></div>
      <div className="form-grid">
        <label className="form-field" htmlFor={inputId('name')}>Product name<input ref={nameRef} id={inputId('name')} name="name" value={values.name} onChange={updateField} required maxLength="80" placeholder="e.g. Highland Morning" /></label>
        <label className="form-field" htmlFor={inputId('category')}>Category<input id={inputId('category')} name="category" value={values.category} onChange={updateField} required placeholder="e.g. Medium Roast" /></label>
        <label className="form-field" htmlFor={inputId('origin')}>Origin<input id={inputId('origin')} name="origin" value={values.origin} onChange={updateField} required placeholder="e.g. Kenya" /></label>
        <label className="form-field" htmlFor={inputId('sku')}>SKU<input id={inputId('sku')} name="sku" value={values.sku} onChange={updateField} required placeholder="e.g. COF-006" /></label>
        <label className="form-field form-field-wide" htmlFor={inputId('description')}>Description<textarea id={inputId('description')} name="description" value={values.description} onChange={updateField} required rows="3" placeholder="Share what makes this coffee special." /></label>
      </div>
      <div className="form-section-title form-section-spaced"><span>02</span><div><h2>Price & inventory</h2><p>Set a price and the quantity currently on hand.</p></div></div>
      <div className="form-grid form-grid-short">
        <label className="form-field" htmlFor={inputId('price')}>Price (USD)<span className="input-prefix"><span aria-hidden="true">$</span><input id={inputId('price')} aria-label="Price (USD)" name="price" type="number" value={values.price} onChange={updateField} required min="0" step="0.01" placeholder="0.00" /></span></label>
        <label className="form-field" htmlFor={inputId('stock')}>Units in stock<input id={inputId('stock')} name="stock" type="number" value={values.stock} onChange={updateField} required min="0" step="1" placeholder="0" /></label>
      </div>
      <div className="form-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}</button></div>
    </form>
  )
}

function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, loading, deleteProduct } = useProducts()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const product = products.find((item) => String(item.id) === id)

  if (loading) return <p className="empty-message">Loading product…</p>
  if (!product) return <NotFoundPage />

  async function handleDelete() {
    try {
      await deleteProduct(id)
      navigate('/products')
    } catch (error) {
      setDeleteError(error.message || 'The product could not be deleted.')
      setConfirmingDelete(false)
    }
  }

  return (
    <>
      <PageHeading eyebrow="PRODUCT RECORD" title={product.name} description={`${product.category} · ${product.origin}`} action={<Link className="button button-primary" to={`/products/${id}/edit`}>Edit product</Link>} />
      {deleteError && <p className="notice notice-error" role="alert">{deleteError}</p>}
      <section className="panel detail-panel">
        <img className="detail-image" src={product.image || fallbackImage} alt={`${product.name} coffee`} />
        <div className="detail-copy"><p className="eyebrow">{product.sku}</p><h2>{product.name}</h2><p className="detail-description">{product.description}</p><div className="detail-facts"><div><span>Price</span><strong>{currency.format(Number(product.price))}</strong></div><div><span>Available stock</span><strong>{product.stock} units</strong></div><div><span>Origin</span><strong>{product.origin}</strong></div><div><span>Category</span><strong>{product.category}</strong></div></div>
          <div className="detail-actions"><Link className="button button-primary" to={`/products/${id}/edit`}>Edit product</Link><button className="button button-danger" type="button" onClick={() => setConfirmingDelete(true)}>Delete product</button></div>
        </div>
      </section>
      {confirmingDelete && <div className="dialog-backdrop" role="presentation"><section className="confirm-dialog" role="alertdialog" aria-labelledby="delete-title" aria-describedby="delete-description"><p className="eyebrow">REMOVE FROM CATALOG</p><h2 id="delete-title">Delete {product.name}?</h2><p id="delete-description">This product will be removed from your store catalog. This action cannot be undone.</p><div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setConfirmingDelete(false)}>Keep product</button><button className="button button-danger" type="button" onClick={handleDelete}>Confirm delete</button></div></section></div>}
    </>
  )
}

function NotFoundPage() {
  return <section className="not-found"><p className="eyebrow">NOT FOUND</p><h1>We couldn't find that product.</h1><p>It may have been removed or the address may be incorrect.</p><Link className="button button-primary" to="/products">Back to products</Link></section>
}

function App() {
  return (
    <Layout />
  )
}

export default App