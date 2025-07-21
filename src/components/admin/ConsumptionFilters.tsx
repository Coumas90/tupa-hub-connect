import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ConsumptionFiltersProps {
  onFiltersChange: (filters: {
    coffeeVariety: string;
    format: string;
    dateRange: { from: Date | null; to: Date | null };
  }) => void;
}

const coffeeVarieties = [
  'Todas las variedades',
  'Finca La Esperanza',
  'Montaña Azul',
  'Origen Nariño',
  'Valle del Cauca',
  'Huila Premium'
];

const coffeeFormats = [
  'Todos los formatos',
  'Espresso',
  'Filtrado',
  'Americano',
  'Cappuccino',
  'Latte',
  'Cold Brew'
];

export function ConsumptionFilters({ onFiltersChange }: ConsumptionFiltersProps) {
  const [coffeeVariety, setCoffeeVariety] = useState('Todas las variedades');
  const [format, setFormat] = useState('Todos los formatos');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleFilterChange = () => {
    onFiltersChange({
      coffeeVariety,
      format,
      dateRange
    });
  };

  const clearFilters = () => {
    setCoffeeVariety('Todas las variedades');
    setFormat('Todos los formatos');
    setDateRange({ from: null, to: null });
    onFiltersChange({
      coffeeVariety: 'Todas las variedades',
      format: 'Todos los formatos',
      dateRange: { from: null, to: null }
    });
  };

  const hasActiveFilters = 
    coffeeVariety !== 'Todas las variedades' || 
    format !== 'Todos los formatos' || 
    dateRange.from || 
    dateRange.to;

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Filter className="h-5 w-5 mr-2" />
            Filtros de Consumo
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Coffee Variety Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Variedad de Café</label>
            <Select value={coffeeVariety} onValueChange={(value) => {
              setCoffeeVariety(value);
              setTimeout(handleFilterChange, 0);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar variedad" />
              </SelectTrigger>
              <SelectContent>
                {coffeeVarieties.map((variety) => (
                  <SelectItem key={variety} value={variety}>
                    {variety}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Formato de Preparación</label>
            <Select value={format} onValueChange={(value) => {
              setFormat(value);
              setTimeout(handleFilterChange, 0);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar formato" />
              </SelectTrigger>
              <SelectContent>
                {coffeeFormats.map((formatOption) => (
                  <SelectItem key={formatOption} value={formatOption}>
                    {formatOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Rango de Fechas</label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {formatDate(dateRange.from, "dd MMM", { locale: es })} -{" "}
                        {formatDate(dateRange.to, "dd MMM yy", { locale: es })}
                      </>
                    ) : (
                      formatDate(dateRange.from, "dd MMM yyyy", { locale: es })
                    )
                  ) : (
                    <span>Seleccionar fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from || undefined}
                  selected={{ from: dateRange.from || undefined, to: dateRange.to || undefined }}
                  onSelect={(range) => {
                    setDateRange({
                      from: range?.from || null,
                      to: range?.to || null
                    });
                    if (range?.from && range?.to) {
                      setIsDatePickerOpen(false);
                      setTimeout(handleFilterChange, 0);
                    }
                  }}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-muted-foreground">Filtros activos:</span>
              {coffeeVariety !== 'Todas las variedades' && (
                <Badge variant="secondary" className="text-xs">
                  {coffeeVariety}
                </Badge>
              )}
              {format !== 'Todos los formatos' && (
                <Badge variant="secondary" className="text-xs">
                  {format}
                </Badge>
              )}
              {(dateRange.from || dateRange.to) && (
                <Badge variant="secondary" className="text-xs">
                  {dateRange.from && dateRange.to
                    ? `${formatDate(dateRange.from, "dd/MM", { locale: es })} - ${formatDate(dateRange.to, "dd/MM/yy", { locale: es })}`
                    : dateRange.from
                    ? `Desde ${formatDate(dateRange.from, "dd/MM/yy", { locale: es })}`
                    : `Hasta ${formatDate(dateRange.to!, "dd/MM/yy", { locale: es })}`
                  }
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}