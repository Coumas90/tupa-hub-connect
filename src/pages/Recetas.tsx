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
  Settings
} from 'lucide-react';

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
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Recetas de Preparación</h1>
          <p className="text-muted-foreground">Métodos optimizados para Finca La Esperanza</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Descargar Todas
        </Button>
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
    </div>
  );
}