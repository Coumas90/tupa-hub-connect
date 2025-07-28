import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  UserPlus,
  Star,
  Award,
  Coffee,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  MoreVertical
} from 'lucide-react';
import { useState } from 'react';
import { AddBaristaModal } from '@/components/AddBaristaModal';

const miembrosEquipo = [
  {
    id: 1,
    nombre: 'María González',
    rol: 'Encargada',
    avatar: '',
    email: 'maria@cafeteria.com',
    telefono: '+54 11 2345-6789',
    fechaIngreso: '2023-01-15',
    certificaciones: ['Barista Avanzado', 'Latte Art', 'Gestión Equipos'],
    progresoAcademia: 95,
    experiencia: '3 años',
    especialidad: 'Espresso & Gestión',
    estado: 'Activo',
    ultimaActividad: '2024-06-15'
  },
  {
    id: 2,
    nombre: 'Carlos Mendoza',
    rol: 'Barista Senior',
    avatar: '',
    email: 'carlos@cafeteria.com',
    telefono: '+54 11 2345-6790',
    fechaIngreso: '2023-03-20',
    certificaciones: ['Barista Básico', 'Métodos Filtrado'],
    progresoAcademia: 78,
    experiencia: '2 años',
    especialidad: 'Filtrado & V60',
    estado: 'Activo',
    ultimaActividad: '2024-06-14'
  },
  {
    id: 3,
    nombre: 'Ana Rodríguez',
    rol: 'Barista Junior',
    avatar: '',
    email: 'ana@cafeteria.com',
    telefono: '+54 11 2345-6791',
    fechaIngreso: '2024-02-10',
    certificaciones: ['Barista Básico'],
    progresoAcademia: 45,
    experiencia: '6 meses',
    especialidad: 'Bebidas Clásicas',
    estado: 'En Entrenamiento',
    ultimaActividad: '2024-06-13'
  },
  {
    id: 4,
    nombre: 'Luis Morales',
    rol: 'Barista',
    avatar: '',
    email: 'luis@cafeteria.com',
    telefono: '+54 11 2345-6792',
    fechaIngreso: '2023-08-05',
    certificaciones: ['Barista Básico', 'Atención Cliente'],
    progresoAcademia: 65,
    experiencia: '1 año',
    especialidad: 'Espresso & Cappuccino',
    estado: 'Activo',
    ultimaActividad: '2024-06-12'
  }
];

import ModuleAccessGuard from '@/components/ModuleAccessGuard';

export default function MiEquipo() {
  const [vistaDetallada, setVistaDetallada] = useState(false);
  const [showAddBaristaModal, setShowAddBaristaModal] = useState(false);

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'Encargada': return 'bg-primary/10 text-primary border-primary/20';
      case 'Barista Senior': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Barista Junior': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Activo': return 'bg-success/10 text-success border-success/20';
      case 'En Entrenamiento': return 'bg-warning/10 text-warning border-warning/20';
      case 'Inactivo': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const getIniciales = (nombre: string) => {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <ModuleAccessGuard module="Mi Equipo" requiredRole="encargado">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Equipo</h1>
          <p className="text-muted-foreground">Gestión y seguimiento del personal</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setVistaDetallada(!vistaDetallada)}>
            <Eye className="h-4 w-4 mr-2" />
            {vistaDetallada ? 'Vista Simple' : 'Vista Detallada'}
          </Button>
          <Button 
            className="bg-gradient-primary hover:bg-primary/90"
            onClick={() => setShowAddBaristaModal(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Solicitar Alta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Equipo</p>
                <p className="text-2xl font-bold">{miembrosEquipo.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{miembrosEquipo.filter(m => m.estado === 'Activo').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Award className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Certificados</p>
                <p className="text-2xl font-bold">{miembrosEquipo.reduce((acc, m) => acc + m.certificaciones.length, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progreso Promedio</p>
                <p className="text-2xl font-bold">
                  {Math.round(miembrosEquipo.reduce((acc, m) => acc + m.progresoAcademia, 0) / miembrosEquipo.length)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vista Simple */}
      {!vistaDetallada && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {miembrosEquipo.map((miembro) => (
            <Card key={miembro.id} className="shadow-soft hover:shadow-warm transition-shadow">
              <CardHeader className="bg-gradient-light rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={miembro.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getIniciales(miembro.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{miembro.nombre}</CardTitle>
                      <Badge variant="outline" className={getRolColor(miembro.rol)}>
                        {miembro.rol}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="outline" className={getEstadoColor(miembro.estado)}>
                    {miembro.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Especialidad</p>
                  <p className="font-medium">{miembro.especialidad}</p>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progreso Academia</span>
                    <span>{miembro.progresoAcademia}%</span>
                  </div>
                  <Progress value={miembro.progresoAcademia} className="h-2" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Certificaciones</p>
                  <div className="flex flex-wrap gap-1">
                    {miembro.certificaciones.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Vista Detallada */}
      {vistaDetallada && (
        <div className="space-y-4">
          {miembrosEquipo.map((miembro) => (
            <Card key={miembro.id} className="shadow-soft">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={miembro.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {getIniciales(miembro.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-bold">{miembro.nombre}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className={getRolColor(miembro.rol)}>
                          {miembro.rol}
                        </Badge>
                        <Badge variant="outline" className={getEstadoColor(miembro.estado)}>
                          {miembro.estado}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Información Personal
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{miembro.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Teléfono</p>
                        <p className="font-medium">{miembro.telefono}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha Ingreso</p>
                        <p className="font-medium">{new Date(miembro.fechaIngreso).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Experiencia</p>
                        <p className="font-medium">{miembro.experiencia}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Especialidad & Progreso
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Especialidad Principal</p>
                        <p className="font-medium">{miembro.especialidad}</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progreso Academia</span>
                          <span className="font-medium">{miembro.progresoAcademia}%</span>
                        </div>
                        <Progress value={miembro.progresoAcademia} className="h-3" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Última Actividad</p>
                        <p className="font-medium">{new Date(miembro.ultimaActividad).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Certificaciones
                    </h4>
                    <div className="space-y-2">
                      {miembro.certificaciones.map((cert, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-secondary" />
                          <span className="text-sm font-medium">{cert}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3">
                      <Plus className="h-4 w-4 mr-1" />
                      Asignar Curso
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Perfil Completo
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Editar Información
                  </Button>
                  <Button size="sm" className="bg-gradient-primary hover:bg-primary/90">
                    <Coffee className="h-4 w-4 mr-1" />
                    Asignar Turno
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Solicitud de Alta */}
      <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center text-accent">
            <UserPlus className="h-5 w-5 mr-2" />
            ¿Necesitás incorporar personal?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Solicitá el alta de nuevos baristas para tu equipo. TUPÁ te ayudará con el proceso de selección y capacitación.
          </p>
          <Button 
            className="bg-gradient-primary hover:bg-primary/90"
            onClick={() => setShowAddBaristaModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Solicitar Nuevo Integrante
          </Button>
        </CardContent>
      </Card>
      
      <AddBaristaModal 
        open={showAddBaristaModal}
        onOpenChange={setShowAddBaristaModal}
        onSuccess={() => {
          // Aquí podrías refrescar la lista de miembros del equipo
          console.log('Barista agregado exitosamente');
        }}
      />
      </div>
    </ModuleAccessGuard>
  );
}