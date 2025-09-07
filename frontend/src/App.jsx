import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Orders from './pages/Orders';
import SupplierDashboard from './pages/SupplierDashboard';
import SupplierProfile from './pages/SupplierProfile';
import NotFound from './pages/NotFound';
import MapSearch from './pages/MapSearch';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/map-search" element={<MapSearch />} />
              <Route path="/suppliers/:id" element={<SupplierProfile />} />
              <Route path="/orders" element={<ProtectedRoute allowedRoles={['vendor', 'customer']}><Orders /></ProtectedRoute>} />
              <Route path="/supplier" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
