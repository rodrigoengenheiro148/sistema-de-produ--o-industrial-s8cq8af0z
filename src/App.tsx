import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Dashboard from './pages/Index'
import RawMaterial from './pages/RawMaterial'
import Production from './pages/Production'
import Yields from './pages/Yields'
import DailyAcidity from './pages/DailyAcidity'
import Quality from './pages/Quality'
import Inventory from './pages/Inventory'
import Shipping from './pages/Shipping'
import Settings from './pages/Settings'
import Factories from './pages/Factories'
import AdvancedReports from './pages/AdvancedReports'
import SeboInventory from './pages/gestao/SeboInventory'
import ProcessManagement from './pages/gestao/ProcessManagement'
import NotFound from './pages/NotFound'
import AccessDenied from './pages/AccessDenied'
import AuthPage from './pages/Auth'
import DashboardLayout from './layouts/DashboardLayout'
import { DataProvider } from '@/context/DataContext'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const App = () => (
  <AuthProvider>
    <DataProvider>
      <BrowserRouter
        future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/entrada-mp" element={<RawMaterial />} />
              <Route path="/producao" element={<Production />} />
              <Route path="/rendimentos" element={<Yields />} />
              <Route path="/acidez-diaria" element={<DailyAcidity />} />
              <Route path="/qualidade" element={<Quality />} />
              <Route
                path="/relatorios-avancados"
                element={<AdvancedReports />}
              />
              <Route path="/estoque" element={<Inventory />} />
              <Route path="/expedicao" element={<Shipping />} />
              <Route path="/fabricas" element={<Factories />} />
              <Route path="/settings" element={<Settings />} />

              {/* Gestão Routes */}
              <Route path="/gestao/estoque-sebo" element={<SeboInventory />} />
              <Route path="/gestao/processo" element={<ProcessManagement />} />

              <Route path="/access-denied" element={<AccessDenied />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </DataProvider>
  </AuthProvider>
)

export default App
