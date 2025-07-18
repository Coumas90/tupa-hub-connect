import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import ModuleAccessGuard from '@/components/ModuleAccessGuard';
import {
  Download,
  FileText,
  Image,
  Video,
  Book,
  Search,
  Filter,
  Star,
  Eye,
  Coffee,
  Users,
  Megaphone
} from 'lucide-react';
import { useState } from 'react';

const recursos = [
  {
    id: 1,
    titulo: 'Manual Técnico Espresso',
    categoria: 'Técnico',
    tipo: 'PDF',
    descripcion: 'Guía completa para preparación perfecta de espresso',
    tamaño: '2.4 MB',
    fecha: '2024-06-01',
    descargas: 247,
    destacado: true,
    icono: Coffee
  },
  {
    id: 2,
    titulo: 'Flyer Promocional Junio',
    categoria: 'Marketing',
    tipo: 'PNG',
    descripcion: 'Material promocional para redes sociales',
    tamaño: '1.8 MB',
    fecha: '2024-06-15',
    descargas: 89,
    destacado: false,
    icono: Megaphone
  },
  {
    id: 3,
    titulo: 'Video Técnica V60',
    categoria: 'Técnico',
    tipo: 'MP4',
    descripcion: 'Demostración paso a paso método V60',
    tamaño: '12.5 MB',
    fecha: '2024-05-28',
    descargas: 156,
    destacado: true,
    icono: Video
  },
  {
    id: 4,
    titulo: 'Carta QR Digital',
    categoria: 'QR',
    tipo: 'PDF',
    descripcion: 'Menú digital con códigos QR personalizados',
    tamaño: '890 KB',
    fecha: '2024-06-10',
    descargas: 73,
    destacado: false,
    icono: Image
  },
  {
    id: 5,
    titulo: 'Manual Capacitación Baristas',
    categoria: 'Técnico',
    tipo: 'PDF',
    descripcion: 'Programa completo de entrenamiento para personal',
    tamaño: '4.2 MB',
    fecha: '2024-05-15',
    descargas: 312,
    destacado: true,
    icono: Users
  },
  {
    id: 6,
    titulo: 'Pack Flyers Temporada',
    categoria: 'Marketing',
    tipo: 'ZIP',
    descripcion: 'Colección completa de materiales estacionales',
    tamaño: '8.7 MB',
    fecha: '2024-06-05',
    descargas: 45,
    destacado: false,
    icono: Megaphone
  }
];

const categorias = ['Todos', 'Técnico', 'Marketing', 'QR', 'Flyers'];

export default function Recursos() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');

  const recursosFiltrados = recursos.filter(recurso => {
    const coincideBusqueda = recurso.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                            recurso.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === 'Todos' || recurso.categoria === categoriaFiltro;
    
    return coincideBusqueda && coincideCategoria;
  });

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'PDF': return FileText;
      case 'PNG': case 'JPG': return Image;
      case 'MP4': return Video;
      case 'ZIP': return Book;
      default: return FileText;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'PDF': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'PNG': case 'JPG': return 'bg-primary/10 text-primary border-primary/20';
      case 'MP4': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'ZIP': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <ModuleAccessGuard module="Recursos" requiredRole="barista">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Biblioteca de Recursos</h1>
            <p className="text-muted-foreground">Materiales técnicos, marketing y herramientas especializadas</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Descargar Todo
          </Button>
        </div>

        {/* Filtros */}
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar recursos..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {categorias.map((categoria) => (
                  <Button
                    key={categoria}
                    variant={categoriaFiltro === categoria ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoriaFiltro(categoria)}
                    className={categoriaFiltro === categoria ? "bg-gradient-primary" : ""}
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    {categoria}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Recursos */}
        <div className="space-y-4">
          {recursosFiltrados.map((recurso) => {
            const IconoTipo = getIconoTipo(recurso.tipo);
            return (
              <Card key={recurso.id} className="shadow-soft hover:shadow-warm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-3 bg-secondary/10 rounded-lg">
                        <recurso.icono className="h-6 w-6 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-semibold text-lg">{recurso.titulo}</h3>
                          {recurso.destacado && (
                            <Star className="h-4 w-4 text-accent fill-accent" />
                          )}
                          <Badge className={`${getTipoColor(recurso.tipo)} border`}>
                            {recurso.tipo}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{recurso.descripcion}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <Badge variant="outline">{recurso.categoria}</Badge>
                          <span>{recurso.tamaño}</span>
                          <span>{recurso.fecha}</span>
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {recurso.descargas} descargas
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Vista
                      </Button>
                      <Button size="sm" className="bg-gradient-primary hover:bg-primary/90">
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ModuleAccessGuard>
  );
}