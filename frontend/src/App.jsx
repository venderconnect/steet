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
import VendorProfile from './pages/VendorProfile';
import SupplierProfilePage from './pages/SupplierProfilePage';
import MyProductsPage from './pages/MyProductsPage';
import ProductDetail from './pages/ProductDetail';
import ChatPage from './pages/ChatPage';
import InboxPage from './pages/InboxPage';
import CompletedOrdersPage from './pages/CompletedOrdersPage';

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
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/map-search" element={<MapSearch />} />
              <Route path="/suppliers/:id" element={<SupplierProfile />} />
              <Route path="/orders" element={<ProtectedRoute allowedRoles={['vendor', 'customer']}><Orders /></ProtectedRoute>} />
              <Route path="/supplier" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />
              
              <Route path="/profile" element={<ProtectedRoute><VendorProfile /></ProtectedRoute>} />
              <Route path="/supplier-profile-page" element={<ProtectedRoute allowedRoles={['supplier']}><SupplierProfilePage /></ProtectedRoute>} />

              <Route path="/my-products" element={<ProtectedRoute allowedRoles={['supplier']}><MyProductsPage /></ProtectedRoute>} />
              <Route path="/completed-orders" element={<ProtectedRoute allowedRoles={['supplier']}><CompletedOrdersPage /></ProtectedRoute>} />

              <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
              <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;