import axios from 'axios';
import { toast } from 'react-toastify';

// Crear instancia global de Axios
export const apiClient = axios.create({
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests - agregar headers automáticamente
apiClient.interceptors.request.use(
  (config) => {
    // Aquí se pueden agregar tokens, logs, etc.
    console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejo global de errores
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error);

    let errorMessage = 'Falló operación';
    
    if (error.response) {
      // Error del servidor (4xx, 5xx)
      const status = error.response.status;
      const data = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = data?.message || 'Solicitud incorrecta';
          break;
        case 401:
          errorMessage = 'No autorizado. Revisa tus credenciales';
          break;
        case 403:
          errorMessage = 'Acceso denegado';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 422:
          errorMessage = data?.message || 'Datos de entrada inválidos';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = data?.message || `Error del servidor (${status})`;
      }
    } else if (error.request) {
      // Error de red
      errorMessage = 'Error de conexión. Verifica tu internet';
    } else {
      // Error de configuración
      errorMessage = error.message || 'Error inesperado';
    }

    // Mostrar toast de error
    toast.error(`Error: ${errorMessage}`);
    
    return Promise.reject(error);
  }
);

export default apiClient;