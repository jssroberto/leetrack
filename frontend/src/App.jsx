import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <Routes>
      {/* We will create these page components in the next phase */}
      <Route path="/login" element={<h1>Login Page</h1>} />
      <Route path="/" element={<h1>Dashboard Page</h1>} />
      <Route path="/settings" element={<h1>Settings Page</h1>} />
    </Routes>
  )
}

export default App
