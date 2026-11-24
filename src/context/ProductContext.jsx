import { useEffect, useState } from 'react'
import { ProductContext } from './productContextValue'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request(path, options) {
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}). Please try again.`)
  }

  if (response.status === 204) return null
  return response.json()
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    request('/products')
      .then((data) => {
        if (active) setProducts(data)
      })
      .catch(() => {
        if (active) setError('Could not load products. Make sure the product server is running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  async function createProduct(product) {
    const savedProduct = await request('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
    setProducts((current) => [...current, savedProduct])
    setError('')
    return savedProduct
  }

  async function updateProduct(id, updates) {
    const savedProduct = await request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    setProducts((current) => current.map((product) =>
      String(product.id) === String(id) ? savedProduct : product,
    ))
    setError('')
    return savedProduct
  }

  async function deleteProduct(id) {
    await request(`/products/${id}`, { method: 'DELETE' })
    setProducts((current) => current.filter((product) => String(product.id) !== String(id)))
    setError('')
  }

  return (
    <ProductContext.Provider value={{ products, loading, error, createProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  )
}