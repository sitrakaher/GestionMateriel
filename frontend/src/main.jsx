import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NotificationProvider } from './context/notificationContext.jsx'
import { AuthProvider } from './context/authContext.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <AuthProvider>
      <NotificationProvider>
      {/* <BrowserRouter> */}
      <App/>
      {/* </BrowserRouter> */}
      </NotificationProvider>
    </AuthProvider> 
  </StrictMode>
)