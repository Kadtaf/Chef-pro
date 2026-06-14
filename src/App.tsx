import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Public Pages
import PublicLayout from './components/public/PublicLayout';
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Pricing from './pages/public/Pricing';
import Portfolio from './pages/public/Portfolio';
import Recipes from './pages/public/Recipes';
import RecipeDetail from './pages/public/RecipeDetail';
import Contact from './pages/public/Contact';
import Reviews from './pages/public/Reviews';
import Legal from './pages/public/Legal';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminRecipes from './pages/admin/Recipes';
import RecipeEditor from './pages/admin/RecipeEditor';
import TechnicalSheets from './pages/admin/TechnicalSheets';
import TechnicalSheetEditor from './pages/admin/TechnicalSheetEditor';
import Menus from './pages/admin/Menus';
import MenuEditor from './pages/admin/MenuEditor';
import Cards from './pages/admin/Cards';
import CardEditor from './pages/admin/CardEditor';
import HACCP from './pages/admin/HACCP';
import Missions from './pages/admin/Missions';
import MissionEditor from './pages/admin/MissionEditor';
import Revenues from './pages/admin/Revenues';
import Comments from './pages/admin/Comments';
import PortfolioAdmin from './pages/admin/PortfolioAdmin';
import SettingsPage from './pages/admin/Settings';
import AIStudio from './pages/admin/AIStudio';
import AdminContactSubmissions from './pages/admin/ContactSubmissions';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoutes() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="recipes" element={<AdminRecipes />} />
          <Route path="recipes/new" element={<RecipeEditor />} />
          <Route path="recipes/:id/edit" element={<RecipeEditor />} />
          <Route path="technical-sheets" element={<TechnicalSheets />} />
          <Route path="technical-sheets/new" element={<TechnicalSheetEditor />} />
          <Route path="technical-sheets/:id/edit" element={<TechnicalSheetEditor />} />
          <Route path="menus" element={<Menus />} />
          <Route path="menus/new" element={<MenuEditor />} />
          <Route path="menus/:id/edit" element={<MenuEditor />} />
          <Route path="cards" element={<Cards />} />
          <Route path="cards/new" element={<CardEditor />} />
          <Route path="cards/:id/edit" element={<CardEditor />} />
          <Route path="haccp" element={<HACCP />} />
          <Route path="missions" element={<Missions />} />
          <Route path="missions/new" element={<MissionEditor />} />
          <Route path="missions/:id/edit" element={<MissionEditor />} />
          <Route path="revenues" element={<Revenues />} />
          <Route path="comments" element={<Comments />} />
          <Route path="portfolio" element={<PortfolioAdmin />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="ai-studio" element={<AIStudio />} />
          <Route path="contact-submissions" element={<AdminContactSubmissions />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="a-propos" element={<About />} />
              <Route path="services" element={<Services />} />
              <Route path="tarifs" element={<Pricing />} />
              <Route path="portfolio" element={<Portfolio />} />
              <Route path="recettes" element={<Recipes />} />
              <Route path="recettes/:slug" element={<RecipeDetail />} />
              <Route path="contact" element={<Contact />} />
              <Route path="avis" element={<Reviews />} />
              <Route path="mentions-legales" element={<Legal />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />

            {/* Admin Routes */}
            <Route path="/admin/*">
              <Route path="*" element={<AdminRoutes />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
