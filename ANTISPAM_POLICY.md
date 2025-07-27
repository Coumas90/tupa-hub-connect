# Política Anti-Spam

## Resumen Ejecutivo

Esta política establece las medidas de protección contra spam y abuso implementadas en la plataforma TupaHub, con el objetivo de mantener un ambiente seguro y funcional para todos los usuarios.

## 1. Límites de Envío

### 1.1 Límites por Hora
- **Máximo**: 5 envíos por hora por dirección IP
- **Ventana de tiempo**: 60 minutos deslizantes
- **Reinicio**: Automático después de 1 hora desde el primer envío

### 1.2 Escalación de Protecciones
1. **Intentos 1-2**: Envío normal permitido
2. **Intentos 3-5**: Se requiere completar CAPTCHA
3. **Más de 5 intentos**: Bloqueo temporal de IP por 1 hora

## 2. Criterios de Bloqueo

### 2.1 Bloqueo Automático
Se aplica bloqueo automático cuando se detecta:
- Más de 5 envíos por hora desde la misma IP
- Múltiples intentos fallidos de CAPTCHA (>10 en 5 minutos)
- Patrones de comportamiento automatizado

### 2.2 Bloqueo Manual
El equipo de moderación puede aplicar bloqueos por:
- Contenido spam repetitivo
- Intentos de evadir controles automáticos
- Uso de múltiples IPs coordinadas
- Contenido malicioso o abusivo

### 2.3 Duración de Bloqueos
- **Primer bloqueo**: 1 hora
- **Segundo bloqueo**: 24 horas
- **Tercer bloqueo**: 7 días
- **Bloqueos subsecuentes**: 30 días

## 3. Proceso de Apelación

### 3.1 Elegibilidad
Pueden apelar usuarios que:
- Consideran que el bloqueo fue aplicado erróneamente
- Han corregido el comportamiento que causó el bloqueo
- Experimentan problemas técnicos legítimos

### 3.2 Cómo Apelar
1. **Email**: Enviar solicitud a `appeals@tupahub.com`
2. **Información requerida**:
   - Dirección IP afectada
   - Timestamp del bloqueo
   - Descripción detallada del uso legítimo
   - Evidencia de corrección (si aplica)

### 3.3 Tiempo de Respuesta
- **Apelaciones automáticas**: 24-48 horas
- **Apelaciones manuales**: 3-5 días hábiles
- **Casos complejos**: Hasta 14 días

### 3.4 Criterios de Aprobación
Las apelaciones se aprueban cuando:
- Se demuestra uso legítimo documentado
- El patrón de comportamiento no representa riesgo
- Se implementan medidas preventivas adecuadas
- No hay historial de violaciones previas

## 4. Excepciones y Casos Especiales

### 4.1 Usuarios Verificados
- Límites aumentados: 20 envíos por hora
- CAPTCHA requerido después de 10 intentos
- Proceso de apelación expedito

### 4.2 APIs y Integraciones
- Límites configurables mediante autenticación
- Rate limiting basado en API keys
- Monitoreo especializado

### 4.3 Eventos de Alto Tráfico
Durante eventos especiales se pueden ajustar temporalmente:
- Límites de envío aumentados
- Umbrales de CAPTCHA modificados
- Procesos de apelación acelerados

## 5. Monitoreo y Métricas

### 5.1 Métricas Clave
- Tasa de falsos positivos: <2%
- Tiempo promedio de resolución: <48 horas
- Efectividad de bloqueo: >95%

### 5.2 Revisiones Periódicas
- **Mensual**: Análisis de patrones y ajustes
- **Trimestral**: Evaluación de política completa
- **Anual**: Revisión estratégica y actualizaciones

## 6. Transparencia y Comunicación

### 6.1 Notificaciones
Los usuarios reciben notificaciones cuando:
- Se activa protección CAPTCHA
- Se aplica un bloqueo temporal
- Se resuelve una apelación

### 6.2 Estado del Sistema
- Dashboard público de estadísticas generales
- Informes de transparencia trimestrales
- Comunicaciones proactivas sobre cambios

## 7. Contacto y Soporte

### 7.1 Canales de Contacto
- **Apelaciones**: appeals@tupahub.com
- **Soporte general**: support@tupahub.com
- **Emergencias**: emergency@tupahub.com

### 7.2 Horarios de Atención
- **Soporte automatizado**: 24/7
- **Revisión humana**: Lunes a Viernes, 9:00-18:00 (UTC-5)
- **Emergencias**: 24/7 con escalación automática

## 8. Cumplimiento y Legalidad

Esta política cumple con:
- Regulaciones de protección de datos aplicables
- Estándares de la industria para prevención de spam
- Principios de debido proceso y transparencia
- Mejores prácticas de ciberseguridad

---

**Última actualización**: 26 de Enero, 2025  
**Versión**: 1.0  
**Próxima revisión**: 26 de Abril, 2025