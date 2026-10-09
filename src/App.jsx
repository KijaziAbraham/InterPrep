import { Routes, Route } from 'react-router-dom'
import InterPrep from './prep/InterPrep.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<InterPrep />} />
    </Routes>
  )
}

export default App
