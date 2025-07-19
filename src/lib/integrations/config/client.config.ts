export interface ClientConfig {
  id: string;
  name: string;
  pos_type: 'fudo' | 'simphony' | 'aloha' | 'toast';
  simulation_mode: boolean;
  api_endpoint?: string;
  api_key?: string;
  sync_frequency: number; // minutes
  last_sync?: string;
  active: boolean;
}

// Mock data para desarrollo - en producción vendría de Supabase
const mockClients: Record<string, ClientConfig> = {
  'client_001': {
    id: 'client_001',
    name: 'Café Central',
    pos_type: 'fudo',
    simulation_mode: true,
    sync_frequency: 30,
    active: true
  },
  'client_002': {
    id: 'client_002',
    name: 'Bistro Norte',
    pos_type: 'simphony',
    simulation_mode: false,
    api_endpoint: 'https://api.simphony.example.com',
    api_key: 'sim_key_123',
    sync_frequency: 15,
    active: true
  }
};

export async function getClientConfig(clientId: string): Promise<ClientConfig | null> {
  // En producción, esto consultaría Supabase
  // Por ahora retorna mock data
  await new Promise(resolve => setTimeout(resolve, 100)); // Simular delay de red
  
  return mockClients[clientId] || null;
}

export async function updateClientConfig(clientId: string, updates: Partial<ClientConfig>): Promise<boolean> {
  // En producción, esto actualizaría Supabase
  if (mockClients[clientId]) {
    mockClients[clientId] = { ...mockClients[clientId], ...updates };
    return true;
  }
  return false;
}