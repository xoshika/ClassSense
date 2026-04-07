import { useState } from 'react'
import LoginPage from './components/Login'
import Dashboard from './components/Dashboard'
import LoadingIndicator from './components/LoadingIndicator'
import './App.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)

  const handleLogin = () => {
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  const handleLoadingComplete = () => {
    setIsLoadingComplete(true)
  }

  if (!isLoadingComplete) {
    return <LoadingIndicator onLoadingComplete={handleLoadingComplete} />
  }

  return isLoggedIn ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  )
}

export default App
