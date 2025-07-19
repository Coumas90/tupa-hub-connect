import { loadMockData } from '../../../../lib/integrations/mock/mock.loader';
import { mapToTupaBistrosoft } from './bistrosoft.mapper';

export async function fetchSalesBistrosoft(clientConfig: any) {
  if (clientConfig.simulation_mode) {
    // Use mock data in simulation mode
    return await loadMockData('bistrosoft.sample.json');
  }
  
  // Will be implemented later with actual Bistrosoft API calls
  throw new Error('Bistrosoft API integration not implemented yet');
}

export function mapToTupa(data: any) {
  return mapToTupaBistrosoft(data);
}