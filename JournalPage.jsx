import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Heart, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit3,
  Calendar,
  Smile,
  Star,
  Coffee,
  Sun
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../lib/api';

const JournalPage = () => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    tags: '',
    mood: 'neutral'
  });
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const moodIcons = {
    happy: { icon: Smile, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    excited: { icon: Star, color: 'text-orange-500', bg: 'bg-orange-50' },
    content: { icon: Coffee, color: 'text-green-500', bg: 'bg-green-50' },
    peaceful: { icon: Sun, color: 'text-blue-500', bg: 'bg-blue-50' },
    neutral: { icon: Heart, color: 'text-gray-500', bg: 'bg-gray-50' }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.getJournalEntries({ limit: 50 });
      setEntries(data);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
      toast.error("Chyba při načítání", {
        description: "Nepodařilo se načíst záznamy z deníku.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      toast.error("Vyplňte všechna pole", {
        description: "Název a obsah jsou povinné.",
      });
      return;
    }

    try {
      const entryData = {
        title: newEntry.title.trim(),
        content: newEntry.content.trim(),
        tags: newEntry.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        mood: newEntry.mood,
        entry_date: new Date().toISOString().split('T')[0]
      };

      await apiClient.createJournalEntry(entryData);
      
      setNewEntry({ title: '', content: '', tags: '', mood: 'neutral' });
      setIsAddingEntry(false);
      await loadEntries();
      
      toast.success("Záznam přidán", {
        description: "Váš záznam byl úspěšně uložen do deníku.",
      });
    } catch (error) {
      console.error('Failed to add entry:', error);
      toast.error("Chyba při ukládání", {
        description: "Nepodařilo se uložit záznam.",
      });
    }
  };

  const handleEditEntry = async (entryId, updatedData) => {
    try {
      await apiClient.updateJournalEntry(entryId, updatedData);
      await loadEntries();
      setEditingEntry(null);
      
      toast.success("Záznam aktualizován", {
        description: "Změny byly úspěšně uloženy.",
      });
    } catch (error) {
      console.error('Failed to update entry:', error);
      toast.error("Chyba při aktualizaci", {
        description: "Nepodařilo se uložit změny.",
      });
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Opravdu chcete smazat tento záznam?')) return;

    try {
      await apiClient.deleteJournalEntry(entryId);
      await loadEntries();
      
      toast.success("Záznam smazán", {
        description: "Záznam byl úspěšně odstraněn.",
      });
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast.error("Chyba při mazání", {
        description: "Nepodařilo se smazat záznam.",
      });
    }
  };

  const handleTogglePrivacy = async (entryId, isPrivate) => {
    try {
      await apiClient.toggleJournalPrivacy(entryId, !isPrivate);
      await loadEntries();
      
      toast.success("Soukromí změněno", {
        description: isPrivate ? "Záznam je nyní viditelný." : "Záznam je nyní skrytý.",
      });
    } catch (error) {
      console.error('Failed to toggle privacy:', error);
      toast.error("Chyba při změně soukromí", {
        description: "Nepodařilo se změnit nastavení soukromí.",
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Načítám deník...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Deník drobných radostí</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Zaznamenávejte své každodenní radosti, objevy a momenty vděčnosti.
        </p>
      </div>

      {/* Add Entry Button */}
      {!isAddingEntry && (
        <Card className="transition-smooth hover:shadow-md">
          <CardContent className="p-6">
            <Button 
              onClick={() => setIsAddingEntry(true)}
              className="w-full h-16 text-lg transition-smooth"
              variant="outline"
            >
              <Plus className="w-5 h-5 mr-2" />
              Přidat nový záznam
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Entry Form */}
      {isAddingEntry && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nový záznam
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Název</label>
              <Input
                placeholder="Co vás dnes potěšilo?"
                value={newEntry.title}
                onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                className="transition-smooth"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Obsah</label>
              <Textarea
                placeholder="Popište svou radost nebo objev..."
                value={newEntry.content}
                onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="transition-smooth"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Štítky (oddělené čárkami)</label>
                <Input
                  placeholder="rodina, příroda, úspěch..."
                  value={newEntry.tags}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, tags: e.target.value }))}
                  className="transition-smooth"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Nálada</label>
                <select
                  value={newEntry.mood}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, mood: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background transition-smooth"
                >
                  <option value="happy">Šťastný</option>
                  <option value="excited">Nadšený</option>
                  <option value="content">Spokojený</option>
                  <option value="peaceful">Klidný</option>
                  <option value="neutral">Neutrální</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddEntry} className="transition-smooth">
                Uložit záznam
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingEntry(false);
                  setNewEntry({ title: '', content: '', tags: '', mood: 'neutral' });
                }}
                className="transition-smooth"
              >
                Zrušit
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="gentle-float">
                <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Zatím žádné záznamy</h3>
              <p className="text-muted-foreground mb-4">
                Začněte zapisovat své drobné radosti a objevy.
              </p>
              <Button onClick={() => setIsAddingEntry(true)} className="transition-smooth">
                <Plus className="w-4 h-4 mr-2" />
                Přidat první záznam
              </Button>
            </CardContent>
          </Card>
        ) : (
          entries.map((entry) => {
            const MoodIcon = moodIcons[entry.mood]?.icon || Heart;
            const moodConfig = moodIcons[entry.mood] || moodIcons.neutral;
            
            return (
              <Card key={entry.id} className={`transition-smooth hover:shadow-md ${entry.is_private ? 'border-dashed border-muted-foreground/30' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${moodConfig.bg} flex items-center justify-center`}>
                        <MoodIcon className={`w-5 h-5 ${moodConfig.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{entry.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(entry.entry_date)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePrivacy(entry.id, entry.is_private)}
                        className="transition-smooth"
                      >
                        {entry.is_private ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingEntry(entry)}
                        className="transition-smooth"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="transition-smooth hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-foreground mb-4 leading-relaxed">{entry.content}</p>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {entry.is_private && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <EyeOff className="w-4 h-4" />
                        Tento záznam je skrytý a vidíte ho pouze vy.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JournalPage;

