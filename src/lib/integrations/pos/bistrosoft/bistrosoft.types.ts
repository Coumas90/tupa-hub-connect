export interface BistrosoftRawSale {
  venta_id: string;
  fecha_hora: string;
  total_venta: number;
  productos: BistrosoftRawProduct[];
  cliente?: BistrosoftRawCustomer;
  forma_pago: string;
  numero_ticket: string;
  mesa?: number;
  mozo?: string;
  descuentos?: number;
}

export interface BistrosoftRawProduct {
  codigo: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  categoria: string;
  observaciones?: string;
}

export interface BistrosoftRawCustomer {
  cliente_id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  documento?: string;
}

export interface BistrosoftApiResponse {
  success: boolean;
  data: {
    ventas: BistrosoftRawSale[];
    total_registros: number;
    pagina_actual: number;
  };
  mensaje?: string;
}

export interface BistrosoftConfig {
  baseUrl: string;
  usuario: string;
  password: string;
  empresaId: string;
  timeout: number;
}