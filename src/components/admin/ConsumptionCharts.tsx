import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Legend
} from 'recharts';
import { Download, FileImage, FileText, TrendingUp, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Sample data for weekly cumulative consumption
const weeklyData = [
  { week: 'Sem 1', acumulado: 7.2, objetivo: 6.8 },
  { week: 'Sem 2', acumulado: 14.8, objetivo: 13.6 },
  { week: 'Sem 3', acumulado: 21.5, objetivo: 20.4 },
  { week: 'Sem 4', acumulado: 28.3, objetivo: 27.2 },
  { week: 'Sem 5', acumulado: 35.1, objetivo: 34.0 },
  { week: 'Sem 6', acumulado: 42.7, objetivo: 40.8 },
  { week: 'Sem 7', acumulado: 49.2, objetivo: 47.6 },
  { week: 'Sem 8', acumulado: 56.8, objetivo: 54.4 }
];

// Sample data for monthly comparison by variety
const varietyData = [
  { variedad: 'Finca La Esperanza', enero: 12.5, febrero: 14.2, marzo: 13.8, abril: 15.1 },
  { variedad: 'Montaña Azul', enero: 8.3, febrero: 9.1, marzo: 7.8, abril: 10.2 },
  { variedad: 'Origen Nariño', enero: 5.2, febrero: 6.8, marzo: 6.1, abril: 7.3 },
  { variedad: 'Valle del Cauca', enero: 3.1, febrero: 4.2, marzo: 3.8, abril: 4.5 },
  { variedad: 'Huila Premium', enero: 2.8, febrero: 3.1, marzo: 2.9, abril: 3.6 }
];

const months = ['enero', 'febrero', 'marzo', 'abril'];
const monthColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

interface ConsumptionChartsProps {
  className?: string;
}

export function ConsumptionCharts({ className }: ConsumptionChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('ultimo-mes');

  // Export chart as PNG
  const exportChartAsPNG = (chartId: string, filename: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
      toast({
        title: "Error",
        description: "No se pudo encontrar el gráfico para exportar",
        variant: "destructive"
      });
      return;
    }

    // Get the SVG element from Recharts
    const svgElement = chartElement.querySelector('svg');
    if (!svgElement) {
      toast({
        title: "Error", 
        description: "No se pudo obtener el gráfico",
        variant: "destructive"
      });
      return;
    }

    // Create canvas and convert SVG to PNG
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Set canvas size
    canvas.width = svgElement.clientWidth || 800;
    canvas.height = svgElement.clientHeight || 400;
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Download the PNG
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${filename}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            
            toast({
              title: "Exportado",
              description: `Gráfico guardado como ${filename}.png`
            });
          }
        });
      }
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  // Export chart as SVG
  const exportChartAsSVG = (chartId: string, filename: string) => {
    const chartElement = document.getElementById(chartId);
    if (!chartElement) {
      toast({
        title: "Error",
        description: "No se pudo encontrar el gráfico para exportar",
        variant: "destructive"
      });
      return;
    }

    const svgElement = chartElement.querySelector('svg');
    if (!svgElement) {
      toast({
        title: "Error",
        description: "No se pudo obtener el gráfico", 
        variant: "destructive"
      });
      return;
    }

    // Clone and prepare SVG for download
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportado",
      description: `Gráfico guardado como ${filename}.svg`
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Period Selector */}
      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg">Análisis de Consumo</CardTitle>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultimo-mes">Último mes</SelectItem>
                <SelectItem value="ultimos-3-meses">Últimos 3 meses</SelectItem>
                <SelectItem value="ultimo-trimestre">Último trimestre</SelectItem>
                <SelectItem value="ultimo-ano">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Weekly Cumulative Consumption Chart */}
      <Card className="shadow-warm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2" />
              Consumo Acumulado Semanal
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartAsPNG('weekly-chart', 'consumo-semanal')}
                className="flex items-center gap-2"
              >
                <FileImage className="h-4 w-4" />
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartAsSVG('weekly-chart', 'consumo-semanal')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                SVG
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div id="weekly-chart" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="week" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Kg', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [
                    `${value}kg`,
                    name === 'acumulado' ? 'Consumo Acumulado' : 'Objetivo'
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="acumulado"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  name="Consumo Acumulado"
                />
                <Line
                  type="monotone"
                  dataKey="objetivo"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 3 }}
                  name="Objetivo"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-gradient-light rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Insight:</strong> El consumo acumulado está un 4.2% por encima del objetivo semanal, 
              indicando una tendencia de crecimiento sostenida en el consumo de café.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Comparison by Variety Chart */}
      <Card className="shadow-warm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2" />
              Comparación Mensual por Variedad
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartAsPNG('variety-chart', 'variedades-mensual')}
                className="flex items-center gap-2"
              >
                <FileImage className="h-4 w-4" />
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChartAsSVG('variety-chart', 'variedades-mensual')}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                SVG
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div id="variety-chart" className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={varietyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="variedad" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Kg', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [
                    `${value}kg`,
                    typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : String(name)
                  ]}
                />
                <Legend />
                {months.map((month, index) => (
                  <Bar
                    key={month}
                    dataKey={month}
                    fill={monthColors[index]}
                    name={month.charAt(0).toUpperCase() + month.slice(1)}
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gradient-light rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Variedad estrella:</strong> Finca La Esperanza mantiene el liderazgo 
                con un crecimiento constante del 18% en abril.
              </p>
            </div>
            <div className="p-3 bg-gradient-light rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tendencia:</strong> Todas las variedades muestran crecimiento, 
                especialmente Origen Nariño con +40% vs enero.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}