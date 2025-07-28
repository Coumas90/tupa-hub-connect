import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Users, TrendingUp, Shield, Zap, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Coffee,
      title: "Gestión Inteligente",
      description: "Optimiza tu inventario y procesos con IA avanzada"
    },
    {
      icon: Users,
      title: "Comunidad Conectada",
      description: "Red de tostadores y cafeterías colaborando juntos"
    },
    {
      icon: TrendingUp,
      title: "Analytics Avanzados",
      description: "Métricas detalladas para maximizar tu rendimiento"
    },
    {
      icon: Shield,
      title: "Seguridad Garantizada",
      description: "Protección de datos con estándares enterprise"
    },
    {
      icon: Zap,
      title: "Automatización",
      description: "Procesos automáticos que ahorran tiempo y dinero"
    },
    {
      icon: Globe,
      title: "Integración Total",
      description: "Conecta con sistemas POS, ERP y más"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Coffee className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">TUPÁ Hub</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Iniciar Sesión
            </Button>
            <Button onClick={() => navigate('/app')}>
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            Plataforma Líder en Gestión Cafetera
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            Conectamos el Mundo
            <br />del Café
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            La plataforma inteligente que revoluciona la conexión entre tostadores y cafeterías, 
            optimizando cada paso de la cadena de valor del café.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/app')} className="text-lg px-8 py-6">
              Comenzar Ahora
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">¿Por qué elegir TUPÁ Hub?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Herramientas profesionales diseñadas específicamente para la industria del café
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8 text-center">
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-lg text-muted-foreground">Cafeterías Conectadas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-lg text-muted-foreground">Satisfacción del Cliente</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2M+</div>
              <div className="text-lg text-muted-foreground">Transacciones Procesadas</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">¿Listo para transformar tu negocio?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Únete a cientos de empresas que ya confían en TUPÁ Hub para gestionar sus operaciones
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/app')}
          >
            Empezar Gratis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-background">
        <div className="container mx-auto text-center text-muted-foreground">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Coffee className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">TUPÁ Hub</span>
          </div>
          <p>&copy; 2024 TUPÁ Hub. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}