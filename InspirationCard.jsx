import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  RefreshCw, 
  Heart, 
  Lightbulb, 
  MessageCircle,
  Star,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api';

const inspirationIcons = {
  daily_quote: { icon: MessageCircle, label: 'Citát dne', color: 'text-blue-500' },
  wellness_tip: { icon: Lightbulb, label: 'Wellness tip', color: 'text-green-500' },
  reflection_prompt: { icon: Heart, label: 'Zamyšlení', color: 'text-purple-500' },
  affirmation: { icon: Star, label: 'Afirmace', color: 'text-yellow-500' }
};

const InspirationCard = ({ className = '' }) => {
  const [inspiration, setInspiration] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadDailyInspiration();
  }, []);

  const loadDailyInspiration = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getDailyInspiration();
      setInspiration(data);
    } catch (error) {
      console.error('Failed to load daily inspiration:', error);
      // Don't show error toast for inspiration - it's not critical
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewInspiration = async (type = null) => {
    try {
      setIsGenerating(true);
      const inspirationType = type || inspiration?.type || 'daily_quote';
      const data = await apiClient.generateInspiration(inspirationType);
      setInspiration(data);
      
      toast.success("Nová inspirace", {
        description: "Vygenerovali jsme pro vás novou inspiraci.",
      });
    } catch (error) {
      console.error('Failed to generate inspiration:', error);
      toast.error("Chyba při generování", {
        description: "Nepodařilo se vygenerovat novou inspiraci.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className={`gentle-float ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!inspiration) {
    return (
      <Card className={`gentle-float ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="gentle-pulse">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            Nepodařilo se načíst dnešní inspiraci.
          </p>
          <Button 
            onClick={() => generateNewInspiration()} 
            variant="outline"
            className="transition-smooth"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Zkusit znovu
          </Button>
        </CardContent>
      </Card>
    );
  }

  const config = inspirationIcons[inspiration.type] || inspirationIcons.daily_quote;
  const IconComponent = config.icon;

  return (
    <Card className={`gentle-float transition-smooth hover:shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center`}>
              <IconComponent className={`w-4 h-4 ${config.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg">Inspirace dne</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateNewInspiration()}
            disabled={isGenerating}
            className="transition-smooth"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          <blockquote className="text-foreground leading-relaxed italic border-l-4 border-primary pl-4">
            "{inspiration.content}"
          </blockquote>
          
          {inspiration.is_cached && (
            <p className="text-xs text-muted-foreground">
              Vaše dnešní inspirace
            </p>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNewInspiration('daily_quote')}
              disabled={isGenerating}
              className="transition-smooth"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Citát
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNewInspiration('wellness_tip')}
              disabled={isGenerating}
              className="transition-smooth"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Tip
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNewInspiration('reflection_prompt')}
              disabled={isGenerating}
              className="transition-smooth"
            >
              <Heart className="w-3 h-3 mr-1" />
              Zamyšlení
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateNewInspiration('affirmation')}
              disabled={isGenerating}
              className="transition-smooth"
            >
              <Star className="w-3 h-3 mr-1" />
              Afirmace
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InspirationCard;

