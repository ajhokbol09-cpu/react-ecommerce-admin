# Coffee R Us Store Admin

A responsive React single-page application for maintaining a small coffee catalog. It uses React Router for page navigation, React context and a custom hook for shared product state, and JSON Server as a simulated API. The colors are inspired by the South Sudan national flag.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

Install dependencies. Then start the API and frontend in separate terminals:

```sh
npm install
npm run server
npm run dev
```

The frontend is served at `http://localhost:5173` and the API at `http://localhost:3001`. JSON Server saves product changes in `db.json`. To use another API address, set `VITE_API_URL` before starting Vite.

## Routes

- `/` - Store overview and inventory summary
- `/products` - Searchable product catalog
- `/products/new` - Create a product
- `/products/:id` - Product details and delete action
- `/products/:id/edit` - Edit product information

## Data and state

`ProductProvider` owns the shared `products`, `loading`, and `error` state. It loads the catalog with `GET` and updates the shared list after successful `POST`, `PATCH`, and `DELETE` requests. The `useProducts` custom hook reads this context, so pages do not need to pass the catalog through several levels of components.

There is also local state for the catalog search text and product form values, saving status, and form errors. `useId` gives form controls unique IDs, and `useRef` focuses the product name field when the form opens.

## Tests and checks

```sh
npm run test:run
npm run lint
npm run build
```

The Vitest and React Testing Library suite checks the dashboard, navigation, product search and details, product creation, product updates, confirmed deletion, unknown routes, and API error messages.

## Component structure

```text
main.jsx
└── BrowserRouter
    └── ProductProvider
        └── App / Layout
            ├── DashboardPage
            │   └── ProductRow
            ├── ProductsPage
            │   └── ProductRow
            ├── ProductFormPage
            │   └── ProductForm
            └── ProductDetailsPage
                └── Delete confirmation dialog
```

`ProductProvider` is the parent for the routed pages and shares product data and CRUD functions through context. `DashboardPage`, `ProductsPage`, `ProductFormPage`, and `ProductDetailsPage` read that shared state with `useProducts`. `ProductsPage` gives each `ProductRow` a `product` prop. `ProductFormPage` gives `ProductForm` the current `product` (when editing), an `onSave` function, and an `onCancel` function. `ProductForm` keeps its input values locally and calls `onSave` when submitted.