import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { UrgentHarvest } from './components/UrgentHarvest';
import { CategoryButtons } from './components/CategoryButtons';
import { HowItWorks } from './components/HowItWorks';
import { PopularStaples } from './components/PopularStaples';
import { FounderLetter } from './components/FounderLetter';
import { BottomNav } from './components/BottomNav';
import { ProductDetails } from './components/ProductDetails';
import { Cart } from './components/Cart';
import { Checkout } from './components/Checkout';
import { Success } from './components/Success';
import { Categories } from './components/Categories';
import { SearchBar } from './components/SearchBar';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { GoogleMapsProvider } from './contexts/GoogleMapsContext';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { Terms } from './pages/Terms';
import { Orders } from './pages/Orders';
import { OrderTracking } from './components/OrderTracking';
import { FloatingSupportButton } from './components/FloatingSupportButton';
import { ScrollToTop } from './components/ScrollToTop';
import { AlgoliaTestPanel } from './components/AlgoliaTestPanel';

function MainLayout() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const isHome = location.pathname === '/';

  const showSearch = ['/', '/categories'].includes(location.pathname);

  const hideBottomNav = ['/product', '/cart', '/checkout', '/success', '/login', '/about', '/contact', '/faq', '/terms', '/orders'].some(path =>
    location.pathname.startsWith(path)
  );

  const hideHeader = ['/product', '/cart', '/checkout', '/success', '/login', '/about', '/contact', '/faq', '/terms', '/orders'].some(path =>
    location.pathname.startsWith(path)
  );

  // Show floating support button on all pages except login and contact page
  const showFloatingSupport = isAuthenticated && !location.pathname.startsWith('/login') && !location.pathname.startsWith('/contact');

  // Show  loading screen during initial authentication check to prevent login page flash
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/image/logo.svg"
            alt="Vrisham Organic"
            className="h-16 mb-4"
          />
          <div className="flex items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-gray-600 text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && <Header />}
      {showSearch && <SearchBar />}
      <div className={`${showSearch ? 'pt-[60px]' : 'pt-[60px]'} ${hideHeader ? 'pt-0' : ''} pb-20`}>
        {isHome ? (
          <>
            <Hero />
            <UrgentHarvest />
            <CategoryButtons />
            <HowItWorks />
            <PopularStaples />
            <FounderLetter />
          </>
        ) : null}
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Home route - now accessible to everyone */}
          <Route path="/" element={
            <div>{/* Home content is rendered in the MainLayout */}</div>
          } />
          {/* Categories route - accessible to everyone */}
          <Route path="/categories" element={<Categories />} />

          {/* Cart route - accessible to everyone, but checkout requires auth */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/success" element={
            <ProtectedRoute>
              <Success />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/orders/:orderId" element={
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          } />

          {/* Info pages */}
          <Route path="/about" element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          } />
          <Route path="/faq" element={
            <ProtectedRoute>
              <FAQ />
            </ProtectedRoute>
          } />
          <Route path="/terms" element={
            <ProtectedRoute>
              <Terms />
            </ProtectedRoute>
          } />

          {/* Redirect to home for any other routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!hideBottomNav && <BottomNav />}
      {showFloatingSupport && <FloatingSupportButton />}
      {process.env.NODE_ENV === 'development' && <AlgoliaTestPanel />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <CartProvider>
          <GoogleMapsProvider>
            <MainLayout />
          </GoogleMapsProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
