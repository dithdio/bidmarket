import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx' 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Wrap the App component in the Provider */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)