import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coffee, Star, CheckCircle, ArrowRight, MapPin, Users, Building, BarChart3, Zap, Leaf, Package, Award, Clock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CoffeeTastingModal from "@/components/CoffeeTastingModal";
import ContactFormModal from "@/components/modals/ContactFormModal";
import { useOptimizedAuth } from "@/contexts/OptimizedAuthProvider";
import { useSmartNavigation } from "@/utils/routing/redirects";
import React, { useState } from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const [selectedCoffee, setSelectedCoffee] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, userRole, isAdmin, loading } = useOptimizedAuth();
  const { navigateToRole, canNavigate } = useSmartNavigation();

  const handleCoffeeClick = (coffee: any) => {
    setSelectedCoffee(coffee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCoffee(null);
  };

  const coffeeOrigins = [
    { name: "Colombia Huila", profile: "Cítrico, Chocolate", altitude: "1,800m", character: "/lovable-uploads/d2a8bff4-70da-4e7e-962a-54fba4666246.png" },
    { name: "Guatemala Antigua", profile: "Frutal, Especiado", altitude: "1,500m", character: "/lovable-uploads/2f6be55c-88e0-470f-a601-a6c7abd242c9.png" },
    { name: "Brasil Cerrado", profile: "Nuez, Caramelo", altitude: "1,200m", character: "/lovable-uploads/52486591-df75-404d-a42d-f74a014f728f.png" },
    { name: "Perú Chanchamayo", profile: "Floral, Miel", altitude: "1,600m", character: "/lovable-uploads/2bd4b43d-9c7a-43d4-a590-70075b3156c2.png" },
    { name: "Costa Rica Tarrazú", profile: "Brillante, Cítrico", altitude: "1,900m", character: "/lovable-uploads/13251373-1da0-48e4-8def-f658813a9f8d.png" }
  ];

  const segments = [
    {
      icon: Coffee,
      title: "Cafeterías",
      subtitle: "Diferenciá tu propuesta",
      benefits: ["Mezclas exclusivas para tu marca", "Fichas técnicas para tu equipo", "Reposición automática", "Capacitación incluida"],
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Building,
      title: "Oficinas",
      subtitle: "Café premium que impulsa la productividad",
      benefits: [
        "Dashboard de consumo y métricas de equipo",
        "Variedad rotativa mensual con perfiles únicos",
        "Setup completo: máquinas + capacitación",
        "Reposición automática sin interrupciones",
        "Servicio técnico incluido 24/7",
        "Reportes de satisfacción y uso",
        "Blends energizantes para diferentes momentos",
        "Opciones descafeinadas y alternativas plant-based"
      ],
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: Users,
      title: "Restaurantes",
      subtitle: "Complementá tu carta",
      benefits: ["Blends diseñados para tu cocina", "Café de sobremesa excepcional", "Presentación premium", "Asesoría en maridajes"],
      color: "from-yellow-500 to-amber-600"
    }
  ];

  const testimonials = [
    { name: "María González", role: "Dueña de Café Central", text: "Nuestros clientes notan la diferencia. El café TUPÁ elevó completamente la experiencia en nuestro local." },
    { name: "Carlos Méndez", role: "Gerente de HR - Tech Corp", text: "El café TUPÁ transformó el ambiente de oficina. Los reportes de consumo nos ayudan a entender mejor las preferencias del equipo y la productividad aumentó notablemente." },
    { name: "Ana Herrera", role: "Chef Ejecutiva", text: "Los maridajes que nos sugirieron transformaron nuestro menú de postres. Café de autor, literal." }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/lovable-uploads/1746d614-050f-4d51-a841-a3f3367c7243.png" alt="TUPÁ Logo" className="h-12" />
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#que-es-tupa" className="text-muted-foreground hover:text-primary transition-colors">¿Qué es TUPÁ?</a>
            <a href="#origenes" className="text-muted-foreground hover:text-primary transition-colors">Orígenes</a>
            <a href="#segmentos" className="text-muted-foreground hover:text-primary transition-colors">Segmentos</a>
            <a href="#tecnologia" className="text-muted-foreground hover:text-primary transition-colors">Tecnología</a>
            <a href="#catalogo" className="text-muted-foreground hover:text-primary transition-colors">Catálogo</a>
          </nav>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                console.log('🔄 LandingPage: Dashboard button clicked', { user: !!user, canNavigate, loading });
                
                if (loading) {
                  console.log('⏳ LandingPage: Still loading, waiting...');
                  return;
                }
                
                if (user) {
                  // Intelligent navigation based on role and context
                  if (isAdmin) {
                    console.log('🔄 LandingPage: Admin user, going to admin dashboard');
                    navigate('/admin/dashboard');
                  } else if (canNavigate) {
                    console.log('🔄 LandingPage: User with location context, using smart navigation');
                    navigateToRole('overview');
                  } else {
                    // Fallback based on role
                    console.log('🔄 LandingPage: User without location context, using role fallback');
                    switch (userRole?.toLowerCase()) {
                      case 'barista':
                        navigate('/recipes');
                        break;
                      case 'client':
                      case 'manager':
                      case 'owner':
                      default:
                        navigate('/app');
                        break;
                    }
                  }
                } else {
                  console.log('🔄 LandingPage: No user, redirecting to auth');
                  navigate('/auth');
                }
              }}
            >
              {user ? 'Dashboard' : 'Iniciar Sesión'}
            </Button>
            <ContactFormModal>
              <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
                Probá TUPÁ Gratis
              </Button>
            </ContactFormModal>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50" />
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                <Leaf className="w-3 h-3 mr-1" />
                Café de Especialidad Trazable
              </Badge>
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
                    El café que transforma
                  </span>
                  <br />
                  <span className="text-foreground">tu negocio</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Proveemos café de especialidad en grano con tecnología integrada. 
                  Reposición automática, dashboard inteligente y asesoría personalizada.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <ContactFormModal>
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-lg px-8 py-6">
                    Probá TUPÁ Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </ContactFormModal>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-orange-200 hover:bg-orange-50">
                  Ver Catálogo
                </Button>
              </div>
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">+200 clientes satisfechos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Trazabilidad 100%</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl" />
              <img 
                src="/lovable-uploads/d2a8bff4-70da-4e7e-962a-54fba4666246.png" 
                alt="Maestro Cafetero TUPÁ" 
                className="relative z-10 w-full max-w-md mx-auto animate-pulse"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ¿Qué es TUPÁ? */}
      <section id="que-es-tupa" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              <Coffee className="w-3 h-3 mr-1" />
              Café de Autor
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              No vendemos café.
              <br />
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Creamos experiencias.
              </span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Somos el único tostador que combina café de especialidad trazable con tecnología inteligente. 
              Cada grano cuenta una historia, cada envío es perfecto, cada sorbo eleva tu marca.
            </p>
            <div className="grid md:grid-cols-3 gap-8 pt-12">
              <Card className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Origen Trazable</h3>
                  <p className="text-muted-foreground">Cada lote con coordenadas exactas, altitud y perfil de taza detallado.</p>
                </CardContent>
              </Card>
              <Card className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Tecnología Integrada</h3>
                  <p className="text-muted-foreground">Dashboard en tiempo real, reposición automática y asesoría personalizada.</p>
                </CardContent>
              </Card>
              <Card className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Recurrencia Inteligente</h3>
                  <p className="text-muted-foreground">Nunca más te quedés sin café. Algoritmo que aprende tu consumo.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Orígenes y Personajes */}
      <section id="origenes" className="py-24 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8 mb-16">
            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
              <MapPin className="w-3 h-3 mr-1" />
              Orígenes Directos
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Cada café tiene
              <br />
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                su propia historia
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Trabajamos directamente con productores. Sin intermediarios, sin misterios. 
              Cada personaje representa un origen, cada origen una tradición.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {coffeeOrigins.map((origin, index) => (
              <Card 
                key={index} 
                className="group hover:scale-105 transition-transform duration-300 border-orange-100 hover:shadow-xl cursor-pointer"
                onClick={() => handleCoffeeClick(origin)}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="relative">
                    <img 
                      src={origin.character} 
                      alt={`Maestro de ${origin.name}`}
                      className="w-24 h-24 mx-auto object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">{origin.name}</h3>
                    <p className="text-sm text-muted-foreground">{origin.profile}</p>
                    <Badge variant="outline" className="border-green-200 text-green-700">
                      {origin.altitude}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Segmentos */}
      <section id="segmentos" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8 mb-16">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Users className="w-3 h-3 mr-1" />
              Soluciones por Segmento
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Tu negocio es único.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Tu café también.
              </span>
            </h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {segments.map((segment, index) => (
              <Card key={index} className="group hover:scale-105 transition-all duration-300 border-0 shadow-lg hover:shadow-xl">
                <div className={`h-2 bg-gradient-to-r ${segment.color}`} />
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${segment.color} rounded-lg flex items-center justify-center`}>
                      <segment.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{segment.title}</h3>
                      <p className="text-muted-foreground">{segment.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {segment.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tecnología TUPÁ Hub */}
      <section id="tecnologia" className="py-24 bg-gradient-to-br from-slate-50 to-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                <BarChart3 className="w-3 h-3 mr-1" />
                TUPÁ Hub
              </Badge>
              <h2 className="text-4xl lg:text-5xl font-bold">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Tecnología que simplifica.
                </span>
                <br />
                Datos que potencian.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Nuestra plataforma integrada te da control total: monitoreo de consumo, 
                reposición automática, insights de rendimiento y asesoría en tiempo real.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Dashboard de consumo en tiempo real</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Predicción inteligente de reposición</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Asesoría personalizada por barista experto</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Reportes de calidad y satisfacción</span>
                </div>
              </div>
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Ver Demo de la Plataforma
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-2xl blur-3xl" />
              <Card className="relative z-10 border-0 shadow-2xl">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Consumo Semanal</h3>
                      <Badge className="bg-green-100 text-green-800">+12%</Badge>
                    </div>
                    <div className="h-32 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg flex items-end p-4">
                      <div className="flex space-x-2 items-end h-full w-full">
                        {[40, 65, 45, 80, 60, 75, 90].map((height, i) => (
                          <div 
                            key={i} 
                            className="bg-gradient-to-t from-purple-500 to-blue-500 rounded-sm flex-1"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Próxima entrega</p>
                        <p className="font-semibold">En 3 días</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Stock actual</p>
                        <p className="font-semibold">2.5 kg</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8 mb-16">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Star className="w-3 h-3 mr-1" />
              Testimonios Reales
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Nuestros clientes
              <br />
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                hablan por nosotros
              </span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="py-24 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8 mb-16">
            <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0">
              <Package className="w-3 h-3 mr-1" />
              Catálogo Premium
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold">
              Desde el grano
              <br />
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                hasta la taza perfecta
              </span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-orange-100 hover:scale-105 transition-transform">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Granos de Origen</h3>
                <p className="text-muted-foreground">Monoorígenes trazables de fincas seleccionadas. Fichas técnicas completas incluidas.</p>
                <ul className="space-y-2 text-sm">
                  <li>• Tostado a pedido</li>
                  <li>• Empaque con válvula desgasificante</li>
                  <li>• Coordenadas GPS de origen</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-orange-100 hover:scale-105 transition-transform">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Blends Exclusivos</h3>
                <p className="text-muted-foreground">Mezclas diseñadas para tu perfil de negocio. Fórmulas únicas que no encontrarás en otro lado.</p>
                <ul className="space-y-2 text-sm">
                  <li>• Desarrollados por Q-graders</li>
                  <li>• Consistencia garantizada</li>
                  <li>• Personalización de marca</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-orange-100 hover:scale-105 transition-transform">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Equipos y Accesorios</h3>
                <p className="text-muted-foreground">Todo lo que necesitás para extraer el máximo potencial del café. Setup completo incluido.</p>
                <ul className="space-y-2 text-sm">
                  <li>• Molinos calibrados</li>
                  <li>• Máquinas de espresso</li>
                  <li>• Capacitación técnica</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-gradient-to-br from-orange-600 via-red-600 to-amber-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-6xl font-bold">
              ¿Listo para transformar
              <br />
              tu experiencia de café?
            </h2>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Primer envío gratis. Sin compromisos. Sin letra chica. 
              Solo café extraordinario que eleva tu negocio.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ContactFormModal>
                <Button 
                  size="lg" 
                  className="bg-white text-orange-600 hover:bg-gray-100 text-lg px-12 py-6 font-semibold"
                >
                  Probá TUPÁ Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </ContactFormModal>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white/10 text-lg px-12 py-6"
              >
                Hablemos por WhatsApp
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-8 pt-8">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Primer envío gratis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Setup incluido</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>Sin permanencia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-background">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <img src="/lovable-uploads/1746d614-050f-4d51-a841-a3f3367c7243.png" alt="TUPÁ Logo" className="h-10" />
              <p className="text-sm text-muted-foreground">
                Café de especialidad con tecnología integrada. 
                Transformamos negocios, una taza a la vez.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Productos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Granos de Origen</li>
                <li>Blends Exclusivos</li>
                <li>Equipos Premium</li>
                <li>TUPÁ Hub</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Segmentos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Cafeterías</li>
                <li>Oficinas</li>
                <li>Restaurantes</li>
                <li>Hoteles</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Contacto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>+54 11 1234-5678</li>
                <li>hola@tupa.coffee</li>
                <li>Buenos Aires, Argentina</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 TUPÁ Coffee. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Coffee Tasting Modal */}
      <CoffeeTastingModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        coffee={selectedCoffee}
      />
    </div>
  );
}