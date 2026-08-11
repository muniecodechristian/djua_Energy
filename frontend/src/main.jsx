import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

// 1. Initialisation du Query Client de TanStack
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Évite de recharger les données dès que tu changes d'onglet
      retry: 1,                   // Nombre de tentatives en cas d'échec d'une requête
      staleTime: 1000 * 60 * 5,   // Les données sont considérées comme fraîches pendant 5 minutes
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)