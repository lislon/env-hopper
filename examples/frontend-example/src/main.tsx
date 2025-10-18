import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import '@env-hopper/frontend-core/src/index.css'
import './index.css'
import { App, appPropsFactory } from '@env-hopper/frontend-core'

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
