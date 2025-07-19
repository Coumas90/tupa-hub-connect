import { useState, useEffect } from 'react';
import { sanitizeInput } from '@/utils/FormUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import { apiClient } from '@/lib/api/axios.config';
import { 
  MapPin, 
  Thermometer, 
  Droplets, 
  Cloud, 
  Sun, 
  CloudRain,
  Settings
} from 'lucide-react';

interface WeatherData {
  location: {
    name: string;
    country: string;
  };
  current: {
    temp_c: number;
    humidity: number;
    condition: {
      text: string;
      icon: string;
    };
  };
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('weatherApiKey') || '');
  const [advice, setAdvice] = useState('');
  const toastNotifications = useToastNotifications();

  const getWeatherAdvice = (temp: number, humidity: number, location: string) => {
    if (humidity > 75) {
      if (temp > 25) {
        return "Con esta humedad alta y temperatura cálida, el café puede expandirse más de lo usual. Te sugerimos ajustar la molienda ligeramente más gruesa para evitar sobreextracción.";
      } else {
        return "La alta humedad puede hacer que el café absorba más agua del ambiente. Considerá una molienda un punto más gruesa y reducí el tiempo de extracción.";
      }
    } else if (humidity < 40) {
      if (temp > 25) {
        return "Con baja humedad y temperatura alta, el café pierde humedad rápidamente. Molienda un poco más fina y asegurate de mantener el café bien sellado.";
      } else {
        return "La baja humedad puede acelerar la pérdida de aromas. Mantené el café en recipientes herméticos y considerá una molienda ligeramente más fina.";
      }
    } else {
      return "Condiciones ideales para la extracción. Mantené tu calibración actual y monitoreá cualquier cambio en el sabor durante el día.";
    }
  };

  const getLocationAndWeather = async () => {
    if (!apiKey) {
      setShowApiInput(true);
      setLoading(false);
      return;
    }

    try {
      // Usar la instancia de Axios configurada con interceptors
      const response = await apiClient.get(
        `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=auto:ip`
      );

      const data: WeatherData = response.data;
      setWeather(data);
      
      const weatherAdvice = getWeatherAdvice(
        data.current.temp_c, 
        data.current.humidity, 
        data.location.name
      );
      setAdvice(weatherAdvice);
      toastNotifications.showSuccess("Datos del clima actualizados");
      
    } catch (error) {
      console.error('Error:', error);
      // El interceptor de Axios ya muestra el toast de error
      // Solo necesitamos manejar el estado local
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('weatherApiKey', apiKey);
      setShowApiInput(false);
      setLoading(true);
      getLocationAndWeather();
      toastNotifications.showSaveSuccess();
      toastNotifications.showInfo("Obteniendo información del clima...");
    }
  };

  useEffect(() => {
    getLocationAndWeather();
  }, []);

  if (showApiInput) {
    return (
      <Card className="shadow-soft border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="h-5 w-5 text-accent" />
            <span>Configurar Clima</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para obtener información del clima necesitas una API key gratuita de WeatherAPI.
          </p>
          <div className="flex space-x-2">
            <Input
              type="password"
              placeholder="Ingresá tu API key de WeatherAPI"
              value={apiKey}
              onChange={(e) => setApiKey(sanitizeInput(e.target.value))}
            />
            <Button onClick={saveApiKey} disabled={!apiKey.trim()}>
              Guardar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Obtené tu API key gratuita en{" "}
            <a 
              href="https://www.weatherapi.com/signup.aspx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              weatherapi.com
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="shadow-soft border-accent/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Cloud className="h-5 w-5 animate-pulse text-accent" />
            <span className="text-muted-foreground">Obteniendo clima...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card className="shadow-soft border-accent/20">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No se pudo obtener la información del clima.</p>
          <Button 
            variant="outline" 
            onClick={() => setShowApiInput(true)}
            className="mt-2"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar API
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (condition: string) => {
    if (condition.toLowerCase().includes('rain')) return <CloudRain className="h-6 w-6 text-accent" />;
    if (condition.toLowerCase().includes('cloud')) return <Cloud className="h-6 w-6 text-accent" />;
    return <Sun className="h-6 w-6 text-accent" />;
  };

  return (
    <Card className="shadow-warm border-accent/20">
      <CardHeader className="bg-gradient-light rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getWeatherIcon(weather.current.condition.text)}
            <div>
              <CardTitle className="text-lg">Clima Actual</CardTitle>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{weather.location.name}, {weather.location.country}</span>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowApiInput(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Thermometer className="h-4 w-4 text-destructive" />
            <span className="font-semibold">{weather.current.temp_c}°C</span>
          </div>
          <div className="flex items-center space-x-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="font-semibold">{weather.current.humidity}%</span>
          </div>
        </div>
        
        <div className="p-4 bg-secondary/10 rounded-lg">
          <div className="flex items-start space-x-2">
            <Badge className="bg-gradient-primary text-white text-xs">
              Tip Barista
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {advice}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}