import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  BookOpen, 
  BarChart3, 
  Settings,
  Leaf
} from 'lucide-react';

const Navigation = ({ currentPage, onPageChange, user, onLogout }) => {
  const navItems = [
    { id: 'home', label: 'Domů', icon: Home },
    { id: 'journal', label: 'Deník', icon: BookOpen },
    { id: 'stats', label: 'Statistiky', icon: BarChart3 },
  ];

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Kolo pohody</h1>
              <p className="text-xs text-muted-foreground">
                Vítejte, {user?.name}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onPageChange(item.id)}
                  className="transition-smooth"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <select
              value={currentPage}
              onChange={(e) => onPageChange(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Odhlásit se
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden mt-4 flex justify-center">
          <div className="flex bg-muted rounded-lg p-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onPageChange(item.id)}
                  className="transition-smooth"
                >
                  <IconComponent className="w-4 h-4" />
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;

