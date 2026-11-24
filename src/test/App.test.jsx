import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { ProductProvider } from '../context/ProductContext'

const seedProducts = [
  { id: 1, name: 'Vanilla Bean', description: 'Medium roast with a nutty flavor.', category: 'Medium Roast', origin: 'Colombia', price: 10, stock: 45, sku: 'COF-001' },
  { id: 2, name: 'House Blend', description: 'Dark roast with a rich flavor.', category: 'Dark Roast', origin: 'Vietnam', price: 12, stock: 30, sku: 'COF-002' },
]

function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ProductProvider><App /></ProductProvider>
    </MemoryRouter>,
  )
}

async function fillNewProductForm(user, name = 'Highland Morning') {
  await user.type(await screen.findByLabelText('Product name'), name)
  await user.type(screen.getByLabelText('Category'), 'Light Roast')
  await user.type(screen.getByLabelText('Origin'), 'Kenya')
  await user.type(screen.getByLabelText('SKU'), 'COF-006')
  await user.type(screen.getByLabelText('Description'), 'Bright and citrusy, grown at high altitude.')
  await user.type(screen.getByLabelText('Price (USD)'), '16.5')
  await user.type(screen.getByLabelText('Units in stock'), '22')
}

function mockProductApi() {
  let products = seedProducts.map((product) => ({ ...product }))
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET'
    const id = Number(String(url).split('/').at(-1))
    let result

    if (method === 'GET') result = products
    if (method === 'POST') {
      const body = JSON.parse(options.body)
      result = { ...body, id: 3 }
      products = [...products, result]
    }
    if (method === 'PATCH') {
      const body = JSON.parse(options.body)
      result = { ...products.find((product) => product.id === id), ...body }
      products = products.map((product) => product.id === id ? result : product)
    }
    if (method === 'DELETE') products = products.filter((product) => product.id !== id)

    return { ok: true, status: 200, json: async () => result }
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => mockProductApi())
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Coffee R Us product administration', () => {
  it('shows the inventory summary and navigates to the catalog', async () => {
    const user = userEvent.setup()
    renderApp()

    expect(await screen.findByRole('heading', { name: 'Good coffee. Good business.' })).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: 'Store summary' })
    expect(within(summary).getByText('02')).toBeInTheDocument()
    expect(within(summary).getByText('75')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Products', exact: true }))
    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
  })

  it('filters products by origin and shows an empty search result', async () => {
    const user = userEvent.setup()
    renderApp('/products')

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Vanilla Bean' })).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: /search products/i }), 'Vietnam')

    expect(screen.getByRole('link', { name: 'House Blend' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Vanilla Bean' })).not.toBeInTheDocument()

    const search = screen.getByRole('searchbox', { name: /search products/i })
    await user.clear(search)
    await user.type(search, 'not in the catalog')
    expect(screen.getByText(/no products match/i)).toBeInTheDocument()
  })

  it('shows product details for the selected route', async () => {
    renderApp('/products/2')

    expect(await screen.findByRole('heading', { name: 'House Blend', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('$12.00')).toBeInTheDocument()
    expect(screen.getByText('Vietnam')).toBeInTheDocument()
  })

  it('creates a product with a POST request', async () => {
    const user = userEvent.setup()
    const fetchMock = global.fetch
    renderApp('/products/new')

    await fillNewProductForm(user)
    await user.click(screen.getByRole('button', { name: 'Create product' }))

    expect(await screen.findByRole('heading', { name: 'Highland Morning', level: 2 })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/products$/), expect.objectContaining({ method: 'POST' }))
  })

  it('updates a product with PATCH and deletes it with confirmation', async () => {
    const user = userEvent.setup()
    const fetchMock = global.fetch
    renderApp('/products/1/edit')

    const priceInput = await screen.findByLabelText('Price (USD)')
    await user.clear(priceInput)
    await user.type(priceInput, '11.5')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('heading', { name: 'Vanilla Bean', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('$11.50')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/products\/1$/), expect.objectContaining({ method: 'PATCH' }))

    await user.click(screen.getByRole('button', { name: 'Delete product' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/products\/1$/), expect.objectContaining({ method: 'DELETE' })))
  })

  it('shows an error when the product server cannot load data', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))
    renderApp()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load products')
  })

  it('keeps the form open and shows an error when saving fails', async () => {
    const user = userEvent.setup()
    const originalFetch = global.fetch
    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      if (options.method === 'POST') return Promise.resolve({ ok: false, status: 500 })
      return originalFetch(url, options)
    }))
    renderApp('/products/new')

    await fillNewProductForm(user)
    await user.click(screen.getByRole('button', { name: 'Create product' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Request failed (500)')
    expect(screen.getByRole('button', { name: 'Create product' })).toBeInTheDocument()
  })

  it('shows a not-found page for an unknown route', async () => {
    renderApp('/this-page-does-not-exist')

    expect(await screen.findByRole('heading', { name: "We couldn't find that product." })).toBeInTheDocument()
  })
})