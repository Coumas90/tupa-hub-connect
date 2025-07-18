import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  HelpCircle, 
  Coffee, 
  Users, 
  ShoppingCart, 
  BookOpen,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  Star,
  Zap
} from 'lucide-react';
import { useState } from 'react';

const categorias = [
  { id: 'general', nombre: 'General', icono: HelpCircle, count: 8 },
  { id: 'recetas', nombre: 'Recetas & Preparación', icono: Coffee, count: 12 },
  { id: 'equipo', nombre: 'Mi Equipo', icono: Users, count: 6 },
  { id: 'reposicion', nombre: 'Reposición', icono: ShoppingCart, count: 9 },
  { id: 'academia', nombre: 'Academia', icono: BookOpen, count: 7 },
  { id: 'barista-pool', nombre: 'Barista Pool', icono: Users, count: 5 }
];

const faqData = [
  {
    id: 1,
    categoria: 'general',
    pregunta: '¿Qué es TUPÁ Hub?',
    respuesta: 'TUPÁ Hub es una plataforma integral que conecta al tostador con sus cafeterías clientes, ofreciendo acompañamiento técnico, educativo y logístico en todo el proceso de uso del café.',
    tags: ['plataforma', 'servicios', 'conexión'],
    popular: true
  },
  {
    id: 2,
    categoria: 'recetas',
    pregunta: '¿Cómo puedo crear mis propias recetas?',
    respuesta: 'Desde el módulo "Recetas", selecciona "Crear Nueva Receta". Completa todos los parámetros (ratio, tiempo, temperatura, etc.) y guarda. El encargado podrá activarla para todo el equipo.',
    tags: ['recetas', 'personalización', 'barista'],
    popular: true
  },
  {
    id: 3,
    categoria: 'reposicion',
    pregunta: '¿Cómo funciona la reposición automática?',
    respuesta: 'El sistema monitorea tu consumo histórico y envía recomendaciones automáticas. Puedes configurar alertas cuando el stock llegue a cierto nivel o programar pedidos recurrentes.',
    tags: ['automático', 'stock', 'pedidos'],
    popular: true
  },
  {
    id: 4,
    categoria: 'academia',
    pregunta: '¿Los certificados tienen validez oficial?',
    respuesta: 'Sí, todos nuestros certificados están avalados por la Specialty Coffee Association (SCA) y son reconocidos internacionalmente en la industria del café.',
    tags: ['certificados', 'validez', 'SCA'],
    popular: false
  },
  {
    id: 5,
    categoria: 'equipo',
    pregunta: '¿Cómo solicito el alta de un nuevo barista?',
    respuesta: 'Desde "Mi Equipo", usa el botón "Solicitar Alta". Completa la información del nuevo integrante y recibirás las credenciales por email en 24-48hs.',
    tags: ['alta', 'barista', 'equipo'],
    popular: false
  },
  {
    id: 6,
    categoria: 'barista-pool',
    pregunta: '¿Cuál es la tarifa de los baristas del pool?',
    respuesta: 'Las tarifas varían según experiencia y especialización, desde $3.000 hasta $4.500 por hora. Todos incluyen seguro de responsabilidad civil.',
    tags: ['tarifas', 'pool', 'seguro'],
    popular: false
  },
  {
    id: 7,
    categoria: 'general',
    pregunta: '¿Hay soporte técnico disponible?',
    respuesta: 'Sí, contamos con soporte técnico de lunes a viernes de 9:00 a 18:00hs. También tenemos chat en vivo y videollamadas programadas.',
    tags: ['soporte', 'horarios', 'contacto'],
    popular: true
  },
  {
    id: 8,
    categoria: 'recetas',
    pregunta: '¿Puedo modificar las recetas oficiales de TUPÁ?',
    respuesta: 'Las recetas oficiales no se pueden modificar, pero puedes crear variaciones personales basadas en ellas. Estas aparecerán como "Variación de [Receta Original]".',
    tags: ['modificación', 'oficiales', 'variaciones'],
    popular: false
  },
  {
    id: 9,
    categoria: 'reposicion',
    pregunta: '¿Cuál es el tiempo de entrega estándar?',
    respuesta: 'Entrega estándar: 3-5 días hábiles (gratuita). Express: 24-48hs (+$2.000). También disponible programación para fechas específicas.',
    tags: ['entrega', 'tiempos', 'express'],
    popular: true
  },
  {
    id: 10,
    categoria: 'academia',
    pregunta: '¿Puedo acceder a los cursos desde mi teléfono?',
    respuesta: 'Sí, TUPÁ Hub es completamente responsivo. Puedes acceder a todos los cursos, quizzes y certificados desde cualquier dispositivo.',
    tags: ['móvil', 'responsivo', 'acceso'],
    popular: false
  }
];

import ModuleAccessGuard from '@/components/ModuleAccessGuard';

export default function FAQ() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [mostrarSoloPopulares, setMostrarSoloPopulares] = useState(false);

  const faqFiltrado = faqData.filter(item => {
    const coincideBusqueda = item.pregunta.toLowerCase().includes(busqueda.toLowerCase()) ||
                            item.respuesta.toLowerCase().includes(busqueda.toLowerCase()) ||
                            item.tags.some(tag => tag.toLowerCase().includes(busqueda.toLowerCase()));
    
    const coincideCategoria = !categoriaSeleccionada || item.categoria === categoriaSeleccionada;
    const coincidePopular = !mostrarSoloPopulares || item.popular;
    
    return coincideBusqueda && coincideCategoria && coincidePopular;
  });

  const preguntasPopulares = faqData.filter(item => item.popular);

  return (
    <ModuleAccessGuard module="FAQ" requiredRole="usuario">
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Centro de Ayuda</h1>
          <p className="text-muted-foreground">Encuentra respuestas rápidas a tus preguntas más frecuentes</p>
        </div>
        
        {/* Búsqueda Principal */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar en preguntas frecuentes..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Acceso Rápido */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-primary/20 hover:shadow-warm transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-3">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Chat en Vivo</h3>
            <p className="text-sm text-muted-foreground mb-3">Soporte inmediato de 9:00 a 18:00hs</p>
            <Button size="sm" className="bg-gradient-primary hover:bg-primary/90">
              Iniciar Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="border-secondary/20 hover:shadow-warm transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-secondary/10 rounded-lg w-fit mx-auto mb-3">
              <Phone className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">Llamada Directa</h3>
            <p className="text-sm text-muted-foreground mb-3">+54 11 4000-TUPÁ (8872)</p>
            <Button size="sm" variant="outline">
              Llamar Ahora
            </Button>
          </CardContent>
        </Card>

        <Card className="border-accent/20 hover:shadow-warm transition-shadow cursor-pointer">
          <CardContent className="p-4 text-center">
            <div className="p-3 bg-accent/10 rounded-lg w-fit mx-auto mb-3">
              <Mail className="h-6 w-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Email Soporte</h3>
            <p className="text-sm text-muted-foreground mb-3">soporte@tupa.com.ar</p>
            <Button size="sm" variant="outline">
              Enviar Email
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Categorías */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-primary" />
            Explorar por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            <Button
              variant={categoriaSeleccionada === '' ? "default" : "outline"}
              onClick={() => setCategoriaSeleccionada('')}
              className={categoriaSeleccionada === '' ? "bg-gradient-primary" : ""}
            >
              Todas las Categorías
            </Button>
            {categorias.map((categoria) => {
              const Icono = categoria.icono;
              return (
                <Button
                  key={categoria.id}
                  variant={categoriaSeleccionada === categoria.id ? "default" : "outline"}
                  onClick={() => setCategoriaSeleccionada(categoria.id)}
                  className={`justify-start ${categoriaSeleccionada === categoria.id ? "bg-gradient-primary" : ""}`}
                >
                  <Icono className="h-4 w-4 mr-2" />
                  {categoria.nombre}
                  <Badge variant="secondary" className="ml-auto">
                    {categoria.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filtros Adicionales */}
      <div className="flex items-center space-x-4">
        <Button
          variant={mostrarSoloPopulares ? "default" : "outline"}
          size="sm"
          onClick={() => setMostrarSoloPopulares(!mostrarSoloPopulares)}
          className={mostrarSoloPopulares ? "bg-gradient-primary" : ""}
        >
          <Star className="h-4 w-4 mr-1" />
          Solo Populares
        </Button>
        <span className="text-sm text-muted-foreground">
          Mostrando {faqFiltrado.length} de {faqData.length} preguntas
        </span>
      </div>

      {/* Preguntas Populares (solo si no hay filtros) */}
      {busqueda === '' && categoriaSeleccionada === '' && !mostrarSoloPopulares && (
        <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center text-accent">
              <Star className="h-5 w-5 mr-2" />
              Preguntas Más Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {preguntasPopulares.slice(0, 4).map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setBusqueda(item.pregunta)}
                >
                  <div className="flex items-start space-x-3">
                    <Zap className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                    <span className="font-medium">{item.pregunta}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ Accordion */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>
            {categoriaSeleccionada ? 
              `${categorias.find(c => c.id === categoriaSeleccionada)?.nombre}` :
              'Todas las Preguntas Frecuentes'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          {faqFiltrado.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-2">
              {faqFiltrado.map((item) => (
                <AccordionItem key={item.id} value={item.id.toString()} className="border border-border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center space-x-3 text-left">
                      {item.popular && (
                        <Star className="h-4 w-4 text-accent fill-accent flex-shrink-0" />
                      )}
                      <span className="font-medium">{item.pregunta}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <div className="space-y-3">
                      <p className="text-muted-foreground leading-relaxed">{item.respuesta}</p>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button size="sm" variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          ¿Te ayudó?
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron preguntas</h3>
              <p className="text-muted-foreground mb-4">
                Intenta con otros términos de búsqueda o explora las categorías disponibles.
              </p>
              <Button variant="outline" onClick={() => {setBusqueda(''); setCategoriaSeleccionada(''); setMostrarSoloPopulares(false);}}>
                Ver Todas las Preguntas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IA Assistant */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <Zap className="h-5 w-5 mr-2" />
            Asistente IA de TUPÁ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            ¿No encontraste la respuesta que buscabas? Nuestro asistente de IA puede ayudarte con preguntas específicas sobre café, equipos y procesos.
          </p>
          <Button className="bg-gradient-primary hover:bg-primary/90">
            <MessageCircle className="h-4 w-4 mr-2" />
            Preguntar al Asistente IA
          </Button>
        </CardContent>
      </Card>
      </div>
    </ModuleAccessGuard>
  );
}