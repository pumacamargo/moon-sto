import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { Layout } from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import { PlannedPortfolio } from './pages/PlannedPortfolio'
import { Transfers } from './pages/Transfers'
import { Performance } from './pages/Performance'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <CurrencyProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/planned" element={<PlannedPortfolio />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CurrencyProvider>
  )
}
