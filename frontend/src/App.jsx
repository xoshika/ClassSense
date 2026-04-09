import { useState, useEffect } from 'react'
import LoginPage from './components/Login'
import Dashboard from './components/Dashboard'
import LoadingIndicator from './components/LoadingIndicator'
import { SessionProvider } from './context/SessionContext'
import './App.css'

const API_BASE = 'http://localhost:8000/api'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoadingComplete, setIsLoadingComplete] = useState(false)
  const [setupPrefs, setSetupPrefs] = useState({ num_chairs: 12, subject_name: '', teacher_name: '', room_number: '', student_names: [] })

  useEffect(() => {
    if (isLoggedIn) {
      fetch(`${API_BASE}/setup/preferences/`)
        .then(r => r.json())
        .then(data => {
          const savedNames = localStorage.getItem('classsense_student_names')
          setSetupPrefs({
            ...data,
            student_names: savedNames ? JSON.parse(savedNames) : Array.from({ length: data.num_chairs || 12 }, (_, i) => `Student ${i + 1}`)
          })
        })
        .catch(() => {})
    }
  }, [isLoggedIn])

  const handleLogin = () => setIsLoggedIn(true)
  const handleLogout = () => setIsLoggedIn(false)
  const handleLoadingComplete = () => setIsLoadingComplete(true)

  const updateSetupPrefs = async (prefs) => {
    setSetupPrefs(prefs)
    if (prefs.student_names) {
      localStorage.setItem('classsense_student_names', JSON.stringify(prefs.student_names))
    }
    await fetch(`${API_BASE}/setup/preferences/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        num_chairs: prefs.num_chairs,
        subject_name: prefs.subject_name,
        teacher_name: prefs.teacher_name,
        room_number: prefs.room_number
      })
    })
  }

  if (!isLoadingComplete) {
    return <LoadingIndicator onLoadingComplete={handleLoadingComplete} />
  }

  return (
    <SessionProvider>
      {isLoggedIn ? (
        <Dashboard onLogout={handleLogout} setupPrefs={setupPrefs} updateSetupPrefs={updateSetupPrefs} />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </SessionProvider>
  )
}

export default App