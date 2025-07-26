import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import LoginPage from './components/LoginPage';
import Navigation from './components/Navigation';
import WellnessWheel from './components/WellnessWheel';
import JournalPage from './components/JournalPage';
import StatsPage from './components/StatsPage';
import InspirationCard from './components/InspirationCard';
import apiClient from './lib/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          apiClient.setToken(token);
          const userData = await apiClient.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
          await loadUserData();
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('access_token');
          apiClient.setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const loadUserData = async () => {
    try {
      const [categoriesData, entriesData] = await Promise.all([
        apiClient.getCategories(),
        apiClient.getTodayEntries()
      ]);
      
      setCategories(categoriesData);
      setTodayEntries(entriesData);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error("Chyba při načítání dat", {
        description: "Nepodařilo se načíst vaše data. Zkuste to prosím znovu.",
      });
    }
  };

  const handleLogin = async (provider, formData = null) => {
    setIsLoading(true);
    try {
      let response;
      
      if (provider === 'demo' && formData) {
        response = await apiClient.demoLogin(formData.email, formData.name);
      } else {
        // For OAuth providers, redirect to backend OAuth endpoint
        window.location.href = `http://localhost:5000/auth/login/${provider}`;
        return;
      }

      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        await loadUserData();
        
        toast.success("Přihlášení úspěšné", {
          description: `Vítejte zpět, ${response.user.name}!`,
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error("Chyba při přihlášení", {
        description: error.message || "Nepodařilo se přihlásit. Zkuste to prosím znovu.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.logout();
      setIsAuthenticated(false);
      setUser(null);
      setCategories([]);
      setTodayEntries([]);
      setCurrentPage('home');
      
      toast.success("Odhlášení úspěšné", {
        description: "Byli jste úspěšně odhlášeni.",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails on server, clear local state
      localStorage.removeItem('access_token');
      apiClient.setToken(null);
      setIsAuthenticated(false);
      setUser(null);
      setCategories([]);
      setTodayEntries([]);
      setCurrentPage('home');
    }
  };

  const handleScoreUpdate = async (categoryId, score) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await apiClient.createEntry({
        category_id: categoryId,
        score: score,
        entry_date: today,
        note: ''
      });
      
      // Reload today's entries to reflect the change
      const updatedEntries = await apiClient.getTodayEntries();
      setTodayEntries(updatedEntries);
      
      toast.success("Skóre aktualizováno", {
        description: "Vaše hodnocení bylo úspěšně uloženo.",
      });
    } catch (error) {
      console.error('Failed to update score:', error);
      toast.error("Chyba při ukládání", {
        description: "Nepodařilo se uložit hodnocení. Zkuste to prosím znovu.",
      });
    }
  };

  const handleCategoryEdit = (category) => {
    // TODO: Implement category editing modal
    toast.info("Funkce v přípravě", {
      description: "Úprava kategorií bude dostupná v další verzi.",
    });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Jak se dnes cítíte?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Aktualizujte své kolo pohody a sledujte svůj pokrok v různých oblastech života.
              </p>
            </div>

            {/* Daily Inspiration */}
            <div className="max-w-2xl mx-auto">
              <InspirationCard />
            </div>

            {/* Wellness Wheel */}
            <WellnessWheel
              categories={categories}
              entries={todayEntries}
              onScoreUpdate={handleScoreUpdate}
              onCategoryEdit={handleCategoryEdit}
            />
          </div>
        );
      case 'journal':
        return <JournalPage />;
      case 'stats':
        return <StatsPage />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="gentle-pulse">
            <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="text-muted-foreground">Načítám aplikaci...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onLogin={handleLogin} isLoading={isLoading} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderCurrentPage()}
      </main>

      <Toaster />
    </div>
  );
}

export default App;
