import { BistrosoftClient } from './bistrosoft.client';
import type { BistrosoftApiResponse, BistrosoftRawSale } from './bistrosoft.types';

export class BistrosoftService {
  private client: BistrosoftClient;

  constructor(client: BistrosoftClient) {
    this.client = client;
  }

  async fetchSales(fechaDesde: string, fechaHasta: string): Promise<BistrosoftRawSale[]> {
    try {
      const endpoint = `/ventas?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&empresa_id=${this.client.getEmpresaId()}`;
      const response: BistrosoftApiResponse = await this.client.request(endpoint);
      
      if (!response.success) {
        throw new Error(response.mensaje || 'Error fetching sales');
      }
      
      return response.data.ventas || [];
    } catch (error) {
      console.error('Error fetching Bistrosoft sales:', error);
      throw new Error(`Failed to fetch sales from Bistrosoft: ${error}`);
    }
  }

  async fetchSalesByTickets(tickets: string[]): Promise<BistrosoftRawSale[]> {
    try {
      const endpoint = `/ventas/por-tickets`;
      const response: BistrosoftApiResponse = await this.client.request(endpoint, {
        method: 'POST',
        body: JSON.stringify({ tickets: tickets }),
      });
      
      if (!response.success) {
        throw new Error(response.mensaje || 'Error fetching sales by tickets');
      }
      
      return response.data.ventas || [];
    } catch (error) {
      console.error('Error fetching Bistrosoft sales by tickets:', error);
      throw new Error(`Failed to fetch sales by tickets from Bistrosoft: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      return await this.client.authenticate();
    } catch (error) {
      console.error('Bistrosoft connection test failed:', error);
      return false;
    }
  }

  async getLastSyncTimestamp(): Promise<string | null> {
    try {
      const response = await this.client.request('/sync/ultima-sincronizacion');
      return response.data?.fecha_hora || null;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return null;
    }
  }
}