import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarIcon, Search, Trophy, Download, Play, Users, Gift } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Winner {
  id: string;
  participant_id: string;
  cafe_id: string;
  region: string;
  prize_code: string;
  prize_description: string;
  week_of: string;
  selected_at: string;
  email_sent_at: string | null;
  email_status: string;
  giveaway_participants: {
    customer_name: string;
    customer_email: string;
  };
  cafes: {
    name: string;
    address: string;
  };
}

interface GiveawayStats {
  totalWinners: number;
  thisWeekWinners: number;
  emailsSent: number;
  uniqueRegions: number;
}

export const GiveawayAdminPanel: React.FC = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCafe, setSelectedCafe] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [stats, setStats] = useState<GiveawayStats>({
    totalWinners: 0,
    thisWeekWinners: 0,
    emailsSent: 0,
    uniqueRegions: 0
  });
  const [cafes, setCafes] = useState<Array<{ id: string; name: string }>>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [isRunningGiveaway, setIsRunningGiveaway] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWinners();
    fetchCafes();
  }, []);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      
      const { data: winnersData, error } = await supabase
        .from('giveaway_winners')
        .select(`
          *,
          giveaway_participants (
            customer_name,
            customer_email
          ),
          cafes (
            name,
            address
          )
        `)
        .order('selected_at', { ascending: false });

      if (error) throw error;

      setWinners(winnersData || []);
      
      // Calculate stats
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);

      const thisWeekWinners = winnersData?.filter(w => 
        new Date(w.selected_at) >= startOfWeek
      ).length || 0;

      const emailsSent = winnersData?.filter(w => w.email_status === 'sent').length || 0;
      const uniqueRegions = new Set(winnersData?.map(w => w.region)).size;

      setStats({
        totalWinners: winnersData?.length || 0,
        thisWeekWinners,
        emailsSent,
        uniqueRegions
      });

      // Extract unique regions
      const uniqueRegionsList = Array.from(new Set(winnersData?.map(w => w.region).filter(Boolean))) as string[];
      setRegions(uniqueRegionsList);

    } catch (error) {
      console.error('Error fetching winners:', error);
      toast({
        title: "Error",
        description: "Failed to load giveaway winners",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCafes = async () => {
    try {
      const { data, error } = await supabase
        .from('cafes')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCafes(data || []);
    } catch (error) {
      console.error('Error fetching cafes:', error);
    }
  };

  const runWeeklyGiveaway = async () => {
    try {
      setIsRunningGiveaway(true);
      
      const { data, error } = await supabase.functions.invoke('weekly-giveaway-selection');

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Giveaway Completed!",
          description: `Selected ${data.winners_count} winners across ${data.regions.length} regions`,
        });
        
        // Refresh winners list
        await fetchWinners();
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error running giveaway:', error);
      toast({
        title: "Giveaway Failed",
        description: error instanceof Error ? error.message : "Failed to run weekly giveaway",
        variant: "destructive"
      });
    } finally {
      setIsRunningGiveaway(false);
    }
  };

  const exportWinners = () => {
    const csvHeader = 'Date,Name,Email,Cafe,Region,Prize Code,Email Status\n';
    const csvRows = filteredWinners.map(winner => 
      `"${format(new Date(winner.selected_at), 'yyyy-MM-dd')}","${winner.giveaway_participants.customer_name}","${winner.giveaway_participants.customer_email}","${winner.cafes.name}","${winner.region}","${winner.prize_code}","${winner.email_status}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `giveaway-winners-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredWinners.length} winner records`,
    });
  };

  // Filter winners based on search criteria
  const filteredWinners = winners.filter(winner => {
    const matchesSearch = !searchTerm || 
      winner.giveaway_participants.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      winner.giveaway_participants.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      winner.cafes.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      winner.prize_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCafe = selectedCafe === 'all' || winner.cafe_id === selectedCafe;
    const matchesRegion = selectedRegion === 'all' || winner.region === selectedRegion;

    const winnerDate = new Date(winner.selected_at);
    const matchesDateFrom = !dateFrom || winnerDate >= dateFrom;
    const matchesDateTo = !dateTo || winnerDate <= dateTo;

    return matchesSearch && matchesCafe && matchesRegion && matchesDateFrom && matchesDateTo;
  });

  const getEmailStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Enviado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falló</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Sorteos Semanales</h1>
          <p className="text-muted-foreground">Gestión y histórico de ganadores</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runWeeklyGiveaway}
            disabled={isRunningGiveaway}
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunningGiveaway ? 'Ejecutando...' : 'Ejecutar Sorteo'}
          </Button>
          <Button onClick={exportWinners} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Ganadores</p>
                <p className="text-2xl font-bold">{stats.totalWinners}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Esta Semana</p>
                <p className="text-2xl font-bold">{stats.thisWeekWinners}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails Enviados</p>
                <p className="text-2xl font-bold">{stats.emailsSent}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regiones</p>
                <p className="text-2xl font-bold">{stats.uniqueRegions}</p>
              </div>
              <Gift className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra el histórico de ganadores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCafe} onValueChange={setSelectedCafe}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por café" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los cafés</SelectItem>
                {cafes.map(cafe => (
                  <SelectItem key={cafe.id} value={cafe.id}>{cafe.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las regiones</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Fecha desde'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'Fecha hasta'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Winners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ganadores ({filteredWinners.length})</CardTitle>
          <CardDescription>Lista completa de ganadores de sorteos semanales</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Ganador</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Café</TableHead>
                <TableHead>Región</TableHead>
                <TableHead>Código Premio</TableHead>
                <TableHead>Estado Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWinners.map((winner) => (
                <TableRow key={winner.id}>
                  <TableCell>
                    <div className="font-medium">
                      {format(new Date(winner.selected_at), 'dd/MM/yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Semana del {format(new Date(winner.week_of), 'dd/MM/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {winner.giveaway_participants.customer_name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {winner.giveaway_participants.customer_email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{winner.cafes.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {winner.cafes.address}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{winner.region}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {winner.prize_code}
                    </code>
                  </TableCell>
                  <TableCell>
                    {getEmailStatusBadge(winner.email_status)}
                    {winner.email_sent_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(winner.email_sent_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredWinners.length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron ganadores con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};