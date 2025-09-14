import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { App, appPropsFactory } from '@env-hopper/frontend-core'

// import { registerSW } from 'virtual:pwa-register';

// registerSW();

// Render the app

const props = appPropsFactory()

const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <App {...props} />
    </StrictMode>,
  )
}
