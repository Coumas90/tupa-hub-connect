import { posRegistry } from './pos/pos.registry';
import { getClientConfig } from '../lib/integrations/config/client.config';
import { loadMockData } from '../lib/integrations/mock/mock.loader';
import { storeParsedSales } from '../lib/integrations/storage/sales.storage';
import { syncSalesToOdoo } from '../lib/integrations/odoo/odoo.sync';
import { enqueueSyncTask } from '../lib/integrations/queue/sync.queue';

export async function syncClientPOS(clientId: string) {
  const clientConfig = await getClientConfig(clientId);
  if (!clientConfig) throw new Error('Client config not found');
  
  const pos = posRegistry[clientConfig.pos_type as keyof typeof posRegistry]?.adapter;
  if (!pos) throw new Error('POS no disponible');

  if (clientConfig.simulation_mode) {
    const raw = await loadMockData(`${clientConfig.pos_type}.sample.json`);
    const sales = pos.mapToTupa(raw);
    await storeParsedSales(clientId, sales);
    await syncSalesToOdoo(clientId, sales);
  } else {
    await enqueueSyncTask(clientId, 'sales.sync');
  }
}