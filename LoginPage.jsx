import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Leaf, 
  Mail, 
  Apple, 
  Chrome,
  Loader2
} from 'lucide-react';

const LoginPage = ({ onLogin, isLoading }) => {
  const [demoForm, setDemoForm] = useState({
    email: 'demo@example.com',
    name: 'Demo Uživatel'
  });

  const handleDemoLogin = (e) => {
    e.preventDefault();
    onLogin('demo', demoForm);
  };

  const handleOAuthLogin = (provider) => {
    onLogin(provider);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="gentle-float">
            <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center mb-4">
              <Leaf className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kolo pohody</h1>
            <p className="text-muted-foreground mt-2">
              Váš průvodce k holistickému životu
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="transition-smooth hover:shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <h2 className="text-xl font-semibold">Přihlášení</h2>
            <p className="text-sm text-muted-foreground">
              Vyberte způsob přihlášení do aplikace
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OAuth Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => handleOAuthLogin('google')}
                variant="outline"
                className="w-full transition-smooth hover:bg-muted"
                disabled={isLoading}
              >
                <Chrome className="w-4 h-4 mr-2" />
                Pokračovat s Google
              </Button>
              
              <Button
                onClick={() => handleOAuthLogin('microsoft')}
                variant="outline"
                className="w-full transition-smooth hover:bg-muted"
                disabled={isLoading}
              >
                <Mail className="w-4 h-4 mr-2" />
                Pokračovat s Microsoft
              </Button>
              
              <Button
                onClick={() => handleOAuthLogin('apple')}
                variant="outline"
                className="w-full transition-smooth hover:bg-muted"
                disabled={isLoading}
              >
                <Apple className="w-4 h-4 mr-2" />
                Pokračovat s Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Nebo
                </span>
              </div>
            </div>

            {/* Demo Login Form */}
            <form onSubmit={handleDemoLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="demo-email">Demo přihlášení</Label>
                <Input
                  id="demo-email"
                  type="email"
                  placeholder="váš@email.cz"
                  value={demoForm.email}
                  onChange={(e) => setDemoForm(prev => ({ ...prev, email: e.target.value }))}
                  className="transition-smooth"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="demo-name">Jméno</Label>
                <Input
                  id="demo-name"
                  type="text"
                  placeholder="Vaše jméno"
                  value={demoForm.name}
                  onChange={(e) => setDemoForm(prev => ({ ...prev, name: e.target.value }))}
                  className="transition-smooth"
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full transition-smooth"
                disabled={isLoading || !demoForm.email || !demoForm.name}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Přihlašuji...
                  </>
                ) : (
                  'Demo přihlášení'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Co vás čeká:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Interaktivní kolo pohody pro sledování vašich potřeb
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Deník pro zaznamenání drobných radostí
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Jemná připomenutí a inspirace
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                Přehled vašeho růstu a pokroku
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            Přihlášením souhlasíte s našimi podmínkami použití a zásadami ochrany osobních údajů.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

