import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Coffee,
  Calendar,
  Truck,
  DollarSign,
  FileText,
  Send
} from 'lucide-react';
import { useState } from 'react';

const variedadesCafe = [
  { id: 1, nombre: 'Finca La Esperanza - Origen', precio: 4500, stock: 'Alto' },
  { id: 2, nombre: 'Blend Especial House', precio: 4000, stock: 'Medio' },
  { id: 3, nombre: 'Single Origin Premium', precio: 5700, stock: 'Bajo' },
  { id: 4, nombre: 'Descafeinado Natural', precio: 4200, stock: 'Alto' },
  { id: 5, nombre: 'Espresso Intenso', precio: 4300, stock: 'Medio' }
];

const historialReposiciones = [
  {
    id: 1,
    fecha: '2024-06-10',
    variedad: 'Finca La Esperanza - Origen',
    cantidad: '10kg',
    estado: 'Entregado',
    total: '$45.000',
    fechaEntrega: '2024-06-12'
  },
  {
    id: 2,
    fecha: '2024-05-25',
    variedad: 'Blend Especial House',
    cantidad: '8kg',
    estado: 'En Tránsito',
    total: '$32.000',
    fechaEntrega: '2024-06-16'
  },
  {
    id: 3,
    fecha: '2024-05-10',
    variedad: 'Single Origin Premium',
    cantidad: '5kg',
    estado: 'Entregado',
    total: '$28.500',
    fechaEntrega: '2024-05-12'
  }
];

export default function Reposicion() {
  const [variedadSeleccionada, setVariedadSeleccionada] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('');

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Entregado': return 'bg-success/10 text-success border-success/20';
      case 'En Tránsito': return 'bg-warning/10 text-warning border-warning/20';
      case 'Pendiente': return 'bg-accent/10 text-accent border-accent/20';
      case 'Cancelado': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getStockColor = (stock: string) => {
    switch (stock) {
      case 'Alto': return 'text-success';
      case 'Medio': return 'text-warning';
      case 'Bajo': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const calcularTotal = () => {
    if (!variedadSeleccionada || !cantidad) return 0;
    const variedad = variedadesCafe.find(v => v.id.toString() === variedadSeleccionada);
    if (!variedad) return 0;
    return variedad.precio * parseInt(cantidad);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la integración con webhook n8n/Odoo
    console.log('Enviando reposición:', {
      variedad: variedadSeleccionada,
      cantidad,
      observaciones,
      tipoEntrega,
      total: calcularTotal()
    });
    alert('Reposición solicitada exitosamente. Recibirás confirmación por email.');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reposición de Café</h1>
          <p className="text-muted-foreground">Gestión automática de pedidos y entregas</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-success/10 text-success">
            Stock Monitoreo: Activo
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Formulario de Reposición */}
        <div className="lg:col-span-2">
          <Card className="shadow-soft">
            <CardHeader className="bg-gradient-light rounded-t-lg">
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2 text-primary" />
                Nueva Reposición
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selección de Variedad */}
                <div className="space-y-2">
                  <Label htmlFor="variedad">Variedad de Café *</Label>
                  <Select value={variedadSeleccionada} onValueChange={setVariedadSeleccionada}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar variedad..." />
                    </SelectTrigger>
                    <SelectContent>
                      {variedadesCafe.map((variedad) => (
                        <SelectItem key={variedad.id} value={variedad.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{variedad.nombre}</span>
                            <div className="flex items-center space-x-2 ml-4">
                              <span className="text-sm font-medium">${variedad.precio}/kg</span>
                              <Badge variant="outline" className={`text-xs ${getStockColor(variedad.stock)}`}>
                                {variedad.stock}
                              </Badge>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Cantidad */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad (kg) *</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      placeholder="0"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      min="1"
                      max="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entrega">Tipo de Entrega</Label>
                    <Select value={tipoEntrega} onValueChange={setTipoEntrega}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="express">Express (24-48hs) + $2.000</SelectItem>
                        <SelectItem value="standard">Standard (3-5 días) Gratis</SelectItem>
                        <SelectItem value="programada">Programada (fecha específica)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Instrucciones especiales, horarios de entrega, etc..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Total */}
                {variedadSeleccionada && cantidad && (
                  <div className="bg-gradient-light p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Estimado:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${calcularTotal().toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      * Precio final confirmado en factura oficial
                    </p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-primary hover:bg-primary/90"
                    disabled={!variedadSeleccionada || !cantidad}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Solicitar Reposición
                  </Button>
                  <Button type="button" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Vista Previa
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recomendación Automática */}
          <Card className="border-secondary/20 bg-gradient-to-r from-secondary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center text-secondary text-lg">
                <Coffee className="h-5 w-5 mr-2" />
                Recomendación IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-background rounded border">
                <h4 className="font-semibold text-sm mb-1">Finca La Esperanza - Origen</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Basado en tu consumo: <strong>12kg</strong> recomendados
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Stock actual: 8 días restantes
                </div>
              </div>
              <Button size="sm" variant="outline" className="w-full">
                Aplicar Recomendación
              </Button>
            </CardContent>
          </Card>

          {/* Información Importante */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center text-accent text-lg">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Información Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <Truck className="h-4 w-4 mt-0.5 text-accent" />
                <div>
                  <p className="font-medium">Entregas</p>
                  <p className="text-muted-foreground">Lun-Vie 9:00-17:00hs</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <DollarSign className="h-4 w-4 mt-0.5 text-accent" />
                <div>
                  <p className="font-medium">Facturación</p>
                  <p className="text-muted-foreground">Integración automática con Odoo</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Package className="h-4 w-4 mt-0.5 text-accent" />
                <div>
                  <p className="font-medium">Pedido Mínimo</p>
                  <p className="text-muted-foreground">5kg por variedad</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historial de Reposiciones */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-secondary" />
            Historial de Reposiciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {historialReposiciones.map((reposicion) => (
              <div key={reposicion.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Package className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{reposicion.variedad}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Pedido: {reposicion.fecha}</span>
                      <span>•</span>
                      <span>{reposicion.cantidad}</span>
                      <span>•</span>
                      <span className="font-medium text-primary">{reposicion.total}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <Badge variant="outline" className={getEstadoColor(reposicion.estado)}>
                      {reposicion.estado}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Entrega: {reposicion.fechaEntrega}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}