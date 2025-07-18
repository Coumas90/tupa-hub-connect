import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import {
  Coffee,
  Download,
  Clock,
  Thermometer,
  Scale,
  Settings,
  Plus,
  X,
  Edit,
  Check
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const recipes = [
  {
    id: 1,
    method: 'Espresso',
    name: 'Espresso TUPÁ Signature',
    creator: 'TUPÁ Official',
    isOfficial: true,
    isActive: true,
    description: 'Receta oficial optimizada para nuestros granos',
    ratio: '1:2',
    coffee: '18g',
    time: '25-30 seg',
    grind: 'Fino',
    temp: '92°C',
    notes: 'Buscar crema densa y color avellana. Sabor balanceado con notas frutales.'
  },
  {
    id: 2,
    method: 'V60',
    name: 'V60 Filtrado Clásico',
    creator: 'Ana García',
    isOfficial: false,
    isActive: false,
    description: 'Método pour-over para resaltar acidez',
    ratio: '1:16',
    coffee: '22g',
    time: '3:30 min',
    grind: 'Medio-fino',
    temp: '93°C',
    notes: 'Vertido en espiral, pausa de 30s en blooming. Ideal para cafés de origen.'
  },
  {
    id: 3,
    method: 'Chemex',
    name: 'Chemex Suave',
    creator: 'Carlos López',
    isOfficial: false,
    isActive: false,
    description: 'Preparación limpia y suave',
    ratio: '1:15',
    coffee: '30g',
    time: '4:00 min',
    grind: 'Medio-grueso',
    temp: '94°C',
    notes: 'Filtro Chemex, vertido lento y constante. Cuerpo limpio y brillante.'
  }
];

export default function Recetas() {
  const { toast } = useToast();
  const [recipeList, setRecipeList] = useState(recipes);
  const [activeRecipe, setActiveRecipe] = useState(recipes.find(r => r.isActive));
  const [showForm, setShowForm] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    method: '',
    name: '',
    description: '',
    ratio: '',
    coffee: '',
    time: '',
    grind: '',
    temp: '',
    notes: ''
  });

  const handleCreateRecipe = () => {
    const recipe = {
      id: recipeList.length + 1,
      ...newRecipe,
      creator: 'Usuario TUPÁ', // En producción vendría del contexto de auth
      isOfficial: false,
      isActive: false
    };
    setRecipeList([...recipeList, recipe]);
    setNewRecipe({
      method: '',
      name: '',
      description: '',
      ratio: '',
      coffee: '',
      time: '',
      grind: '',
      temp: '',
      notes: ''
    });
    setShowForm(false);
    toast({
      title: "Receta creada exitosamente",
      description: `La receta "${recipe.name}" fue añadida a tu colección.`,
    });
  };

  const setAsActive = (recipe: any) => {
    const updatedRecipes = recipeList.map(r => ({
      ...r,
      isActive: r.id === recipe.id
    }));
    setRecipeList(updatedRecipes);
    setActiveRecipe(recipe);
    toast({
      title: "Receta activada",
      description: `"${recipe.name}" es ahora la receta activa para todo el equipo.`,
    });
  };

  const downloadRecipe = (recipe: any) => {
    const content = `
RECETA: ${recipe.name}
Método: ${recipe.method}
Creador: ${recipe.creator}

PARÁMETROS:
- Ratio: ${recipe.ratio}
- Café: ${recipe.coffee}
- Tiempo: ${recipe.time}
- Molienda: ${recipe.grind}
- Temperatura: ${recipe.temp}

DESCRIPCIÓN:
${recipe.description}

NOTAS:
${recipe.notes}

---
Generado por TUPÁ Hub
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receta-${recipe.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ModuleAccessGuard module="Recetas" requiredRole="barista">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recetas</h1>
            <p className="text-muted-foreground">Parámetros de preparación para cada método</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="bg-gradient-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Receta
          </Button>
        </div>

        {/* Receta Activa */}
        {activeRecipe && (
          <Card className="shadow-glow border-accent/20">
            <CardHeader className="bg-gradient-light rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Coffee className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{activeRecipe.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gradient-primary text-white">Activa</Badge>
                      <Badge variant="outline">{activeRecipe.method}</Badge>
                      {activeRecipe.isOfficial && (
                        <Badge variant="secondary">Oficial TUPÁ</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => downloadRecipe(activeRecipe)}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Parámetros de Preparación</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-secondary/10 rounded-lg text-center">
                        <Scale className="h-5 w-5 mx-auto mb-1 text-secondary" />
                        <div className="font-semibold">{activeRecipe.ratio}</div>
                        <div className="text-xs text-muted-foreground">Ratio</div>
                      </div>
                      <div className="p-3 bg-secondary/10 rounded-lg text-center">
                        <Coffee className="h-5 w-5 mx-auto mb-1 text-secondary" />
                        <div className="font-semibold">{activeRecipe.coffee}</div>
                        <div className="text-xs text-muted-foreground">Café</div>
                      </div>
                      <div className="p-3 bg-secondary/10 rounded-lg text-center">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-secondary" />
                        <div className="font-semibold">{activeRecipe.time}</div>
                        <div className="text-xs text-muted-foreground">Tiempo</div>
                      </div>
                      <div className="p-3 bg-secondary/10 rounded-lg text-center">
                        <Thermometer className="h-5 w-5 mx-auto mb-1 text-secondary" />
                        <div className="font-semibold">{activeRecipe.temp}</div>
                        <div className="text-xs text-muted-foreground">Temperatura</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium mb-1">Molienda</h5>
                    <p className="text-sm text-muted-foreground">{activeRecipe.grind}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">Descripción</h5>
                    <p className="text-sm text-muted-foreground">{activeRecipe.description}</p>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Notas de Preparación</h5>
                    <p className="text-sm text-muted-foreground">{activeRecipe.notes}</p>
                  </div>
                  <div>
                    <h5 className="font-medium mb-1">Creador</h5>
                    <p className="text-sm text-muted-foreground">{activeRecipe.creator}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Todas las Recetas */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Todas las Recetas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipeList.map((recipe) => (
              <Card key={recipe.id} className={`shadow-soft hover:shadow-warm transition-shadow ${recipe.isActive ? 'border-accent/40' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{recipe.method}</Badge>
                        {recipe.isOfficial && (
                          <Badge variant="secondary" className="text-xs">Oficial</Badge>
                        )}
                        {recipe.isActive && (
                          <Badge className="bg-gradient-primary text-white text-xs">Activa</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{recipe.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <Scale className="h-3 w-3" />
                      <span>{recipe.ratio}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Coffee className="h-3 w-3" />
                      <span>{recipe.coffee}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{recipe.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Thermometer className="h-3 w-3" />
                      <span>{recipe.temp}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex space-x-2">
                    {!recipe.isActive && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setAsActive(recipe)}
                        className="flex-1"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Activar
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => downloadRecipe(recipe)}
                      className={recipe.isActive ? "flex-1" : ""}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Creado por: {recipe.creator}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Modal de Nueva Receta */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Crear Nueva Receta</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="method">Método de Preparación</Label>
                    <Input
                      id="method"
                      value={newRecipe.method}
                      onChange={(e) => setNewRecipe({...newRecipe, method: e.target.value})}
                      placeholder="Ej: Espresso, V60, Chemex"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nombre de la Receta</Label>
                    <Input
                      id="name"
                      value={newRecipe.name}
                      onChange={(e) => setNewRecipe({...newRecipe, name: e.target.value})}
                      placeholder="Ej: Mi Espresso Perfecto"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newRecipe.description}
                    onChange={(e) => setNewRecipe({...newRecipe, description: e.target.value})}
                    placeholder="Breve descripción de la receta"
                  />
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="ratio">Ratio</Label>
                    <Input
                      id="ratio"
                      value={newRecipe.ratio}
                      onChange={(e) => setNewRecipe({...newRecipe, ratio: e.target.value})}
                      placeholder="1:2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="coffee">Cantidad Café</Label>
                    <Input
                      id="coffee"
                      value={newRecipe.coffee}
                      onChange={(e) => setNewRecipe({...newRecipe, coffee: e.target.value})}
                      placeholder="18g"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Tiempo</Label>
                    <Input
                      id="time"
                      value={newRecipe.time}
                      onChange={(e) => setNewRecipe({...newRecipe, time: e.target.value})}
                      placeholder="25-30 seg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="temp">Temperatura</Label>
                    <Input
                      id="temp"
                      value={newRecipe.temp}
                      onChange={(e) => setNewRecipe({...newRecipe, temp: e.target.value})}
                      placeholder="92°C"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="grind">Tipo de Molienda</Label>
                  <Input
                    id="grind"
                    value={newRecipe.grind}
                    onChange={(e) => setNewRecipe({...newRecipe, grind: e.target.value})}
                    placeholder="Fino, Medio, Grueso"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas de Preparación</Label>
                  <Textarea
                    id="notes"
                    value={newRecipe.notes}
                    onChange={(e) => setNewRecipe({...newRecipe, notes: e.target.value})}
                    placeholder="Instrucciones detalladas, consejos y observaciones"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleCreateRecipe} 
                    className="flex-1 bg-gradient-primary hover:bg-primary/90"
                    disabled={!newRecipe.method || !newRecipe.name}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Receta
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ModuleAccessGuard>
  );
}