import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { useState } from 'react';

const recipes = [
  {
    id: 1,
    method: 'Espresso',
    icon: Coffee,
    ratio: '1:2',
    coffee: '18g',
    water: '36ml',
    time: '25-30s',
    grind: 'Fina',
    temp: '93°C',
    description: 'Extracción clásica para un espresso balanceado',
    steps: [
      'Moler 18g de café con molienda fina',
      'Distribuir uniformemente en el portafiltro',
      'Prensar con 30 libras de presión',
      'Extraer en 25-30 segundos'
    ]
  },
  {
    id: 2,
    method: 'V60',
    icon: Coffee,
    ratio: '1:16',
    coffee: '25g',
    water: '400ml',
    time: '3:30',
    grind: 'Media-fina',
    temp: '95°C',
    description: 'Método de filtrado que resalta la acidez y claridad',
    steps: [
      'Enjuagar el filtro con agua caliente',
      'Añadir 25g de café molido medio-fino',
      'Hacer blooming con 50ml por 30s',
      'Vertido en espiral hasta 400ml en 3:30'
    ]
  },
  {
    id: 3,
    method: 'Chemex',
    icon: Coffee,
    ratio: '1:15',
    coffee: '30g',
    water: '450ml',
    time: '4:00',
    grind: 'Media-gruesa',
    temp: '96°C',
    description: 'Café limpio y aromático con cuerpo sedoso',
    steps: [
      'Colocar filtro y enjuagar',
      'Añadir 30g de café molido medio-grueso',
      'Blooming con 60ml por 45s',
      'Vertido constante hasta 450ml en 4 minutos'
    ]
  }
];

export default function Recetas() {
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [nuevaReceta, setNuevaReceta] = useState({
    method: '',
    ratio: '',
    coffee: '',
    water: '',
    time: '',
    grind: '',
    temp: '',
    description: '',
    steps: ['']
  });

  const handleAgregarPaso = () => {
    setNuevaReceta({
      ...nuevaReceta,
      steps: [...nuevaReceta.steps, '']
    });
  };

  const handleEliminarPaso = (index: number) => {
    const nuevosSteps = nuevaReceta.steps.filter((_, i) => i !== index);
    setNuevaReceta({
      ...nuevaReceta,
      steps: nuevosSteps
    });
  };

  const handleSubmitReceta = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Nueva receta:', nuevaReceta);
    alert('Receta enviada para revisión del encargado');
    setMostrandoFormulario(false);
    setNuevaReceta({
      method: '',
      ratio: '',
      coffee: '',
      water: '',
      time: '',
      grind: '',
      temp: '',
      description: '',
      steps: ['']
    });
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recetas de Preparación</h1>
          <p className="text-muted-foreground">Métodos optimizados para Finca La Esperanza</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setMostrandoFormulario(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Receta
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Descargar Todas
          </Button>
        </div>
      </div>

      {/* Recipe Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="shadow-soft hover:shadow-warm transition-shadow">
            <CardHeader className="bg-gradient-light rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <recipe.icon className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle className="text-xl">{recipe.method}</CardTitle>
                </div>
                <Badge variant="secondary">{recipe.ratio}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{recipe.description}</p>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              {/* Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Scale className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="text-sm font-medium">Café</p>
                      <p className="text-lg font-bold">{recipe.coffee}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="text-sm font-medium">Tiempo</p>
                      <p className="text-lg font-bold">{recipe.time}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="text-sm font-medium">Temperatura</p>
                      <p className="text-lg font-bold">{recipe.temp}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-secondary" />
                    <div>
                      <p className="text-sm font-medium">Molienda</p>
                      <p className="text-lg font-bold">{recipe.grind}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Steps */}
              <div>
                <h4 className="font-semibold mb-3">Pasos de Preparación</h4>
                <ol className="space-y-2">
                  {recipe.steps.map((step, index) => (
                    <li key={index} className="flex text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-secondary/10 text-secondary rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="icon">
                  <Coffee className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips Section */}
      <Card className="border-secondary/20 bg-gradient-to-r from-secondary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center text-secondary">
            <Coffee className="h-5 w-5 mr-2" />
            Tips de Preparación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Calidad del Agua</h4>
              <p>Usar agua filtrada con TDS entre 75-150 ppm para mejor extracción.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Frescura del Café</h4>
              <p>Utilizar café tostado entre 7-21 días para obtener los mejores resultados.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para Nueva Receta */}
      {mostrandoFormulario && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <CardHeader className="bg-gradient-light rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-primary" />
                  Crear Nueva Receta Personal
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setMostrandoFormulario(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmitReceta} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="method">Método de Preparación *</Label>
                    <Input
                      id="method"
                      value={nuevaReceta.method}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, method: e.target.value})}
                      placeholder="Ej: V60 Personal"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ratio">Ratio *</Label>
                    <Input
                      id="ratio"
                      value={nuevaReceta.ratio}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, ratio: e.target.value})}
                      placeholder="Ej: 1:15"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="coffee">Café (g) *</Label>
                    <Input
                      id="coffee"
                      value={nuevaReceta.coffee}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, coffee: e.target.value})}
                      placeholder="Ej: 25g"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="water">Agua (ml) *</Label>
                    <Input
                      id="water"
                      value={nuevaReceta.water}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, water: e.target.value})}
                      placeholder="Ej: 375ml"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Tiempo *</Label>
                    <Input
                      id="time"
                      value={nuevaReceta.time}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, time: e.target.value})}
                      placeholder="Ej: 3:30"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grind">Molienda *</Label>
                    <Input
                      id="grind"
                      value={nuevaReceta.grind}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, grind: e.target.value})}
                      placeholder="Ej: Media-fina"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="temp">Temperatura *</Label>
                    <Input
                      id="temp"
                      value={nuevaReceta.temp}
                      onChange={(e) => setNuevaReceta({...nuevaReceta, temp: e.target.value})}
                      placeholder="Ej: 94°C"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={nuevaReceta.description}
                    onChange={(e) => setNuevaReceta({...nuevaReceta, description: e.target.value})}
                    placeholder="Describe las características de esta receta..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Pasos de Preparación *</Label>
                  <div className="space-y-2">
                    {nuevaReceta.steps.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="w-6 h-6 bg-secondary/10 text-secondary rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {index + 1}
                        </span>
                        <Input
                          value={step}
                          onChange={(e) => {
                            const nuevosSteps = [...nuevaReceta.steps];
                            nuevosSteps[index] = e.target.value;
                            setNuevaReceta({...nuevaReceta, steps: nuevosSteps});
                          }}
                          placeholder={`Paso ${index + 1}...`}
                          required
                        />
                        {nuevaReceta.steps.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEliminarPaso(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAgregarPaso}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Paso
                    </Button>
                  </div>
                </div>

                <div className="bg-gradient-light p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Nota:</strong> Tu receta será enviada al encargado para revisión. Una vez aprobada, 
                    podrá activarla para que todo el equipo la vea.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="flex-1 bg-gradient-primary hover:bg-primary/90">
                    <Check className="h-4 w-4 mr-2" />
                    Crear Receta
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setMostrandoFormulario(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}