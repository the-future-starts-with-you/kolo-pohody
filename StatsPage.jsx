import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3,
  PieChart,
  Download,
  Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { toast } from 'sonner';
import apiClient from '../lib/api';

const StatsPage = () => {
  const [wellnessStats, setWellnessStats] = useState(null);
  const [journalStats, setJournalStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  const COLORS = ['#6B7F6B', '#A8B4A0', '#C8A89A', '#8C7B6F', '#5A6A70'];

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const [wellness, journal] = await Promise.all([
        apiClient.getWellnessStats({ days: timeRange }),
        apiClient.getJournalStats({ days: timeRange })
      ]);
      
      setWellnessStats(wellness);
      setJournalStats(journal);
    } catch (error) {
      console.error('Failed to load stats:', error);
      toast.error("Chyba při načítání statistik", {
        description: "Nepodařilo se načíst statistiky.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info("Export dat", {
        description: "Funkce exportu bude dostupná v další verzi.",
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error("Chyba při exportu", {
        description: "Nepodařilo se exportovat data.",
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Načítám statistiky...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Přehled vašeho pokroku</h2>
          <p className="text-muted-foreground">
            Sledujte svůj růst a vývoj v různých oblastech života.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background transition-smooth"
          >
            <option value="7">Posledních 7 dní</option>
            <option value="30">Posledních 30 dní</option>
            <option value="90">Posledních 90 dní</option>
            <option value="365">Poslední rok</option>
          </select>
          
          <Button onClick={handleExportData} variant="outline" className="transition-smooth">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {wellnessStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Průměrné skóre</p>
                  <p className="text-2xl font-bold">{wellnessStats.average_score?.toFixed(1) || '0.0'}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-2">
                {getTrendIcon(wellnessStats.score_trend || 0)}
                <span className="text-sm text-muted-foreground ml-1">
                  {wellnessStats.score_trend > 0 ? '+' : ''}{wellnessStats.score_trend?.toFixed(1) || '0.0'}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aktivních dní</p>
                  <p className="text-2xl font-bold">{wellnessStats.active_days || 0}</p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                z {timeRange} dní
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nejlepší kategorie</p>
                  <p className="text-lg font-bold">{wellnessStats.best_category?.name || 'Žádná'}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {wellnessStats.best_category?.average?.toFixed(1) || '0.0'}/10
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Záznamy v deníku</p>
                  <p className="text-2xl font-bold">{journalStats?.total_entries || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {journalStats?.entries_this_week || 0} tento týden
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wellness Trend Chart */}
        {wellnessStats?.daily_scores && (
          <Card>
            <CardHeader>
              <CardTitle>Vývoj wellness skóre</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={wellnessStats.daily_scores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis 
                    domain={[0, 10]}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [value.toFixed(1), 'Skóre']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="average_score" 
                    stroke="#6B7F6B" 
                    strokeWidth={2}
                    dot={{ fill: '#6B7F6B', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Comparison */}
        {wellnessStats?.category_averages && (
          <Card>
            <CardHeader>
              <CardTitle>Průměr podle kategorií</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={wellnessStats.category_averages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                  />
                  <YAxis 
                    domain={[0, 10]}
                    stroke="var(--muted-foreground)"
                  />
                  <Tooltip formatter={(value) => [value.toFixed(1), 'Průměr']} />
                  <Bar 
                    dataKey="average" 
                    fill="#A8B4A0"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Journal Stats */}
      {journalStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mood Distribution */}
          {journalStats.mood_distribution && (
            <Card>
              <CardHeader>
                <CardTitle>Rozložení nálad</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={journalStats.mood_distribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {journalStats.mood_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Popular Tags */}
          {journalStats.popular_tags && (
            <Card>
              <CardHeader>
                <CardTitle>Nejčastější štítky</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {journalStats.popular_tags.slice(0, 10).map((tag, index) => (
                    <div key={tag.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <span className="font-medium">{tag.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(tag.count / journalStats.popular_tags[0].count) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8 text-right">
                          {tag.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Data State */}
      {(!wellnessStats || !journalStats) && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="gentle-float">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Zatím žádná data</h3>
            <p className="text-muted-foreground mb-4">
              Začněte používat aplikaci pro zobrazení statistik vašeho pokroku.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatsPage;

