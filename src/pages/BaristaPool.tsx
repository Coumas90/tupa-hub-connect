import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Star, 
  Coffee, 
  Calendar, 
  Clock, 
  MapPin,
  Award,
  Filter,
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  Send,
  Phone,
  Mail
} from 'lucide-react';
import { useState } from 'react';

const baristasDisponibles = [
  {
    id: 1,
    nombre: 'Roberto Silva',
    avatar: '',
    rating: 4.9,
    experiencia: '5 años',
    especialidades: ['Espresso', 'Latte Art', 'Filtrado'],
    certificaciones: ['Barista Avanzado', 'SCA Brewing', 'Latte Art Champion'],
    ubicacion: 'Palermo, CABA',
    tarifa: 3500,
    disponibilidad: 'Inmediata',
    telefono: '+54 11 3456-7890',
    email: 'roberto@baristapool.com',
    completados: 142,
    descripcion: 'Especialista en café de especialidad con amplia experiencia en cafeterías premium.',
    disponibleDesde: '09:00',
    disponibleHasta: '18:00'
  },
  {
    id: 2,
    nombre: 'Valentina López',
    avatar: '',
    rating: 4.8,
    experiencia: '3 años',
    especialidades: ['Filtrado', 'Métodos Manuales', 'Cata'],
    certificaciones: ['Barista Intermedio', 'Q Grader Level 1'],
    ubicacion: 'Villa Crespo, CABA',
    tarifa: 3200,
    disponibilidad: 'Esta semana',
    telefono: '+54 11 3456-7891',
    email: 'valentina@baristapool.com',
    completados: 89,
    descripcion: 'Experta en métodos de filtrado y cata profesional de cafés.',
    disponibleDesde: '08:00',
    disponibleHasta: '16:00'
  },
  {
    id: 3,
    nombre: 'Diego Martínez',
    avatar: '',
    rating: 4.7,
    experiencia: '4 años',
    especialidades: ['Espresso', 'Máquinas Profesionales', 'Gestión'],
    certificaciones: ['Barista Avanzado', 'Técnico en Equipos'],
    ubicacion: 'San Telmo, CABA',
    tarifa: 3800,
    disponibilidad: 'Próxima semana',
    telefono: '+54 11 3456-7892',
    email: 'diego@baristapool.com',
    completados: 203,
    descripcion: 'Especialista en equipos profesionales y gestión de equipos de trabajo.',
    disponibleDesde: '10:00',
    disponibleHasta: '19:00'
  }
];

const turnos = [
  {
    id: 1,
    barista: 'Ana Rodriguez',
    fecha: '2024-06-18',
    horario: '09:00 - 17:00',
    estado: 'Confirmado',
    tarifa: 3200,
    especialidad: 'Espresso & Latte Art'
  },
  {
    id: 2,
    barista: 'Carlos Mendez',
    fecha: '2024-06-20',
    horario: '14:00 - 22:00',
    estado: 'Pendiente',
    tarifa: 3500,
    especialidad: 'Filtrado Premium'
  }
];

import ModuleAccessGuard from '@/components/ModuleAccessGuard';

export default function BaristaPool() {
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrandoSolicitud, setMostrandoSolicitud] = useState(false);
  
  // Form state
  const [fechaSolicitud, setFechaSolicitud] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFin, setHorarioFin] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const getDisponibilidadColor = (disponibilidad: string) => {
    switch (disponibilidad) {
      case 'Inmediata': return 'bg-success/10 text-success border-success/20';
      case 'Esta semana': return 'bg-warning/10 text-warning border-warning/20';
      case 'Próxima semana': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Confirmado': return 'bg-success/10 text-success border-success/20';
      case 'Pendiente': return 'bg-warning/10 text-warning border-warning/20';
      case 'Cancelado': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getIniciales = (nombre: string) => {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const baristsasFiltrados = baristasDisponibles.filter(barista => {
    const coincideBusqueda = barista.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            barista.especialidades.some(esp => esp.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideEspecialidad = !filtroEspecialidad || filtroEspecialidad === 'todas' || barista.especialidades.includes(filtroEspecialidad);
    const coincideUbicacion = !filtroUbicacion || filtroUbicacion === 'todas' || barista.ubicacion.includes(filtroUbicacion);
    
    return coincideBusqueda && coincideEspecialidad && coincideUbicacion;
  });

  const handleSolicitar = (baristaId: number) => {
    setMostrandoSolicitud(true);
    // Lógica para pre-llenar datos del barista seleccionado
  };

  const handleSubmitSolicitud = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la integración con webhook
    console.log('Enviando solicitud de barista:', {
      fecha: fechaSolicitud,
      horarioInicio,
      horarioFin,
      observaciones
    });
    alert('Solicitud enviada exitosamente. Recibirás confirmación en breve.');
    setMostrandoSolicitud(false);
  };

  return (
    <ModuleAccessGuard module="Barista Pool" requiredRole="encargado">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Barista Pool</h1>
          <p className="text-muted-foreground">Red especializada de baristas para refuerzo temporal</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setMostrandoSolicitud(!mostrandoSolicitud)}>
            <Plus className="h-4 w-4 mr-2" />
            {mostrandoSolicitud ? 'Ver Pool' : 'Nueva Solicitud'}
          </Button>
        </div>
      </div>

      {!mostrandoSolicitud ? (
        <>
          {/* Filtros */}
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o especialidad..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filtroEspecialidad} onValueChange={setFiltroEspecialidad}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="Espresso">Espresso</SelectItem>
                    <SelectItem value="Filtrado">Filtrado</SelectItem>
                    <SelectItem value="Latte Art">Latte Art</SelectItem>
                    <SelectItem value="Cata">Cata</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroUbicacion} onValueChange={setFiltroUbicacion}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="Palermo">Palermo</SelectItem>
                    <SelectItem value="Villa Crespo">Villa Crespo</SelectItem>
                    <SelectItem value="San Telmo">San Telmo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Baristas Disponibles */}
          <div className="grid lg:grid-cols-2 gap-6">
            {baristsasFiltrados.map((barista) => (
              <Card key={barista.id} className="shadow-soft hover:shadow-warm transition-shadow">
                <CardHeader className="bg-gradient-light rounded-t-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={barista.avatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                          {getIniciales(barista.nombre)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-xl">{barista.nombre}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-accent fill-accent mr-1" />
                            <span className="font-semibold">{barista.rating}</span>
                          </div>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{barista.experiencia}</span>
                        </div>
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {barista.ubicacion}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={getDisponibilidadColor(barista.disponibilidad)}>
                      {barista.disponibilidad}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">{barista.descripcion}</p>

                  {/* Especialidades */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Especialidades</h4>
                    <div className="flex flex-wrap gap-1">
                      {barista.especialidades.map((esp, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Coffee className="h-3 w-3 mr-1" />
                          {esp}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Certificaciones */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Certificaciones</h4>
                    <div className="space-y-1">
                      {barista.certificaciones.slice(0, 2).map((cert, index) => (
                        <div key={index} className="flex items-center text-xs">
                          <Award className="h-3 w-3 mr-1 text-secondary" />
                          {cert}
                        </div>
                      ))}
                      {barista.certificaciones.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{barista.certificaciones.length - 2} más
                        </span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Info adicional */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tarifa por hora</p>
                      <p className="font-bold text-primary">${barista.tarifa}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Turnos completados</p>
                      <p className="font-bold">{barista.completados}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Disponible desde</p>
                      <p className="font-medium">{barista.disponibleDesde}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hasta</p>
                      <p className="font-medium">{barista.disponibleHasta}</p>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      className="flex-1 bg-gradient-primary hover:bg-primary/90"
                      onClick={() => handleSolicitar(barista.id)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Solicitar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mis Turnos */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-secondary" />
                Mis Turnos Programados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {turnos.map((turno) => (
                  <div key={turno.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Users className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{turno.barista}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {turno.fecha}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {turno.horario}
                          </span>
                          <span className="font-medium text-primary">${turno.tarifa}/hr</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{turno.especialidad}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getEstadoColor(turno.estado)}>
                      {turno.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Formulario de Solicitud */
        <Card className="shadow-soft max-w-2xl mx-auto">
          <CardHeader className="bg-gradient-light rounded-t-lg">
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2 text-primary" />
              Nueva Solicitud de Barista
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmitSolicitud} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha Requerida *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={fechaSolicitud}
                    onChange={(e) => setFechaSolicitud(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Especialidad Preferida</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="espresso">Espresso</SelectItem>
                      <SelectItem value="filtrado">Filtrado</SelectItem>
                      <SelectItem value="latte-art">Latte Art</SelectItem>
                      <SelectItem value="cualquiera">Cualquiera</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inicio">Horario Inicio *</Label>
                  <Input
                    id="inicio"
                    type="time"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fin">Horario Fin *</Label>
                  <Input
                    id="fin"
                    type="time"
                    value={horarioFin}
                    onChange={(e) => setHorarioFin(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones y Requerimientos</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Describe el tipo de evento, máquinas disponibles, nivel requerido, etc..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bg-gradient-light p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Información del Proceso</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Recibirás confirmación en 2-4 horas</li>
                  <li>• Los baristas son pre-evaluados por TUPÁ</li>
                  <li>• Pago directo al barista según tarifa acordada</li>
                  <li>• Incluye seguro de responsabilidad civil</li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-primary hover:bg-primary/90"
                  disabled={!fechaSolicitud || !horarioInicio || !horarioFin}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Solicitud
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setMostrandoSolicitud(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      </div>
    </ModuleAccessGuard>
  );
}