import { useState } from 'react';
import { User, Mail, Shield, Calendar, MapPin } from 'lucide-react';
import { useOptimizedAuth } from '@/contexts/OptimizedAuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useLocationContext } from '@/contexts/LocationContext';

export function ProfilePage() {
  const { user, userRole, session } = useOptimizedAuth();
  const { activeLocation } = useLocationContext();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No hay usuario autenticado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userInitials = user.email?.slice(0, 2).toUpperCase() || 'U';
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
  const createdAt = new Date(user.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'client':
        return 'bg-primary text-primary-foreground';
      case 'barista':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mi Perfil</h1>
            <p className="text-muted-foreground">
              Gestiona tu información personal y configuración de cuenta
            </p>
          </div>
          <Button 
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancelar' : 'Editar Perfil'}
          </Button>
        </div>

        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{displayName}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(userRole)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {userRole?.toUpperCase() || 'USUARIO'}
                  </Badge>
                  {activeLocation && (
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      {activeLocation.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Tu información básica de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={displayName}
                  disabled={!isEditing}
                  placeholder="Tu nombre completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled={true}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El email no se puede modificar por seguridad
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Input
                  id="role"
                  value={userRole?.toUpperCase() || 'USUARIO'}
                  disabled={true}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Tu rol es asignado por los administradores
                </p>
              </div>

              {isEditing && (
                <div className="pt-4">
                  <Button className="w-full">
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Cuenta</CardTitle>
              <CardDescription>
                Detalles de tu cuenta y sesión actual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Cuenta creada</span>
                </div>
                <span className="text-sm font-medium">{createdAt}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">ID de Usuario</span>
                </div>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {user.id.substring(0, 8)}...
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Estado de verificación</span>
                <Badge variant={user.email_confirmed_at ? "default" : "destructive"}>
                  {user.email_confirmed_at ? 'Verificado' : 'Pendiente'}
                </Badge>
              </div>

              {activeLocation && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Ubicación actual</span>
                    </div>
                    <span className="text-sm font-medium">{activeLocation.name}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Information */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Sesión</CardTitle>
            <CardDescription>
              Detalles sobre tu sesión actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {session?.expires_at ? 
                    Math.floor((new Date(session.expires_at).getTime() - Date.now()) / (1000 * 60 * 60)) : 
                    '--'
                  }h
                </div>
                <div className="text-sm text-muted-foreground">Tiempo restante</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {session?.access_token ? 'Activa' : 'Inactiva'}
                </div>
                <div className="text-sm text-muted-foreground">Estado de sesión</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {userRole === 'admin' ? 'Admin' : 'Usuario'}
                </div>
                <div className="text-sm text-muted-foreground">Nivel de acceso</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}