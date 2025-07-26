import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Brain, 
  Users, 
  Lightbulb, 
  Briefcase, 
  Smile,
  Plus,
  Edit3
} from 'lucide-react';

const iconMap = {
  body: Heart,
  mind: Brain,
  relationships: Users,
  inspiration: Lightbulb,
  work: Briefcase,
  fun: Smile,
  default: Plus
};

const WellnessWheel = ({ categories = [], entries = [], onScoreUpdate, onCategoryEdit }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [scores, setScores] = useState({});

  useEffect(() => {
    // Initialize scores from entries
    const scoreMap = {};
    entries.forEach(entry => {
      if (entry.entry) {
        scoreMap[entry.category.id] = entry.entry.score;
      }
    });
    setScores(scoreMap);
  }, [entries]);

  const handleScoreChange = (categoryId, newScore) => {
    setScores(prev => ({ ...prev, [categoryId]: newScore[0] }));
    onScoreUpdate(categoryId, newScore[0]);
  };

  const getSegmentPath = (index, total, score = 0) => {
    const centerX = 200;
    const centerY = 200;
    const outerRadius = 150;
    const innerRadius = 40;
    const scoreRadius = innerRadius + (outerRadius - innerRadius) * (score / 10);
    
    const angleStep = (2 * Math.PI) / total;
    const startAngle = index * angleStep - Math.PI / 2;
    const endAngle = (index + 1) * angleStep - Math.PI / 2;
    
    const x1 = centerX + Math.cos(startAngle) * innerRadius;
    const y1 = centerY + Math.sin(startAngle) * innerRadius;
    const x2 = centerX + Math.cos(endAngle) * innerRadius;
    const y2 = centerY + Math.sin(endAngle) * innerRadius;
    
    const x3 = centerX + Math.cos(endAngle) * scoreRadius;
    const y3 = centerY + Math.sin(endAngle) * scoreRadius;
    const x4 = centerX + Math.cos(startAngle) * scoreRadius;
    const y4 = centerY + Math.sin(startAngle) * scoreRadius;
    
    const largeArcFlag = angleStep > Math.PI ? 1 : 0;
    
    return `M ${x1} ${y1} 
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
            L ${x3} ${y3}
            A ${scoreRadius} ${scoreRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
            Z`;
  };

  const getTextPosition = (index, total) => {
    const centerX = 200;
    const centerY = 200;
    const textRadius = 120;
    
    const angleStep = (2 * Math.PI) / total;
    const angle = index * angleStep - Math.PI / 2 + angleStep / 2;
    
    const x = centerX + Math.cos(angle) * textRadius;
    const y = centerY + Math.sin(angle) * textRadius;
    
    return { x, y };
  };

  if (!categories.length) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="gentle-float">
            <Plus className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Vítejte v Kole pohody</h3>
          <p className="text-muted-foreground mb-4">
            Začněte svou cestu k lepší pohodě vytvořením svých prvních kategorií.
          </p>
          <Button onClick={() => onCategoryEdit(null)} className="transition-smooth">
            <Plus className="w-4 h-4 mr-2" />
            Přidat kategorii
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Wellness Wheel */}
      <Card className="wellness-wheel">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* SVG Wheel */}
            <div className="flex-shrink-0">
              <svg width="400" height="400" viewBox="0 0 400 400" className="drop-shadow-lg">
                {/* Background circle */}
                <circle
                  cx="200"
                  cy="200"
                  r="150"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="2"
                  opacity="0.3"
                />
                
                {/* Category segments */}
                {categories.map((category, index) => {
                  const score = scores[category.id] || 0;
                  const IconComponent = iconMap[category.icon] || iconMap.default;
                  const textPos = getTextPosition(index, categories.length);
                  
                  return (
                    <g key={category.id}>
                      {/* Segment path */}
                      <path
                        d={getSegmentPath(index, categories.length, score)}
                        fill={category.color || '#A8B4A0'}
                        opacity={selectedCategory === category.id ? 0.9 : 0.7}
                        className="wellness-segment transition-smooth"
                        onClick={() => setSelectedCategory(
                          selectedCategory === category.id ? null : category.id
                        )}
                      />
                      
                      {/* Category text */}
                      <text
                        x={textPos.x}
                        y={textPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-sm font-medium fill-current pointer-events-none"
                        style={{ fill: 'var(--foreground)' }}
                      >
                        {category.name}
                      </text>
                      
                      {/* Score text */}
                      <text
                        x={textPos.x}
                        y={textPos.y + 16}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-bold pointer-events-none"
                        style={{ fill: 'var(--foreground)' }}
                      >
                        {score}/10
                      </text>
                    </g>
                  );
                })}
                
                {/* Center circle */}
                <circle
                  cx="200"
                  cy="200"
                  r="35"
                  fill="var(--card)"
                  stroke="var(--primary)"
                  strokeWidth="3"
                />
                <text
                  x="200"
                  y="200"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-semibold"
                  style={{ fill: 'var(--primary)' }}
                >
                  Pohoda
                </text>
              </svg>
            </div>
            
            {/* Controls */}
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Vaše kolo pohody</h3>
                <p className="text-muted-foreground">
                  Klikněte na segment pro úpravu nebo použijte ovládací prvky níže.
                </p>
              </div>
              
              {/* Category controls */}
              <div className="space-y-4">
                {categories.map((category) => {
                  const IconComponent = iconMap[category.icon] || iconMap.default;
                  const score = scores[category.id] || 0;
                  const isSelected = selectedCategory === category.id;
                  
                  return (
                    <div
                      key={category.id}
                      className={`p-4 rounded-lg border transition-smooth ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border bg-card hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="outline" className="ml-auto">
                          {score}/10
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCategoryEdit(category)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Slider
                          value={[score]}
                          onValueChange={(value) => handleScoreChange(category.id, value)}
                          max={10}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Nízká</span>
                          <span>Vysoká</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Button 
                onClick={() => onCategoryEdit(null)} 
                variant="outline" 
                className="w-full transition-smooth"
              >
                <Plus className="w-4 h-4 mr-2" />
                Přidat kategorii
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4">Přehled dnešního dne</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / categories.length) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Průměr</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {Math.max(...Object.values(scores), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Nejvyšší</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {Math.min(...Object.values(scores).filter(s => s > 0), 10) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Nejnižší</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {Object.values(scores).filter(s => s > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Vyplněno</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WellnessWheel;

