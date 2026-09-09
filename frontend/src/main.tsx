import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDemoGovernmentAuthUser } from './services/firebaseAuth'

// Automatically initialize demo Government Authentication user and matching Firestore document in dev mode
if (import.meta.env.DEV) {
  initDemoGovernmentAuthUser().catch((err) => {
    console.warn('[RAKSHA SETHU] Demo user auto-creation notice:', err);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
