# Embebido de la Aplicación en Iframes

Este documento describe los casos de uso autorizados, riesgos y procedimientos de prueba para embebido de la aplicación dentro de iframes.

## Casos de Uso Permitidos
- Integración en el portal de socios `https://partner.example.com` para login centralizado.

## Riesgos de Seguridad
- **Clickjacking:** mitigado mediante `frame-ancestors` y validación de origen.
- **Exposición de sesión:** asegurarse de usar HTTPS y controles de origen en el host.

## Pruebas Manuales
1. Servir la aplicación en `http://localhost:8080`.
2. Crear una página contenedora en `https://partner.example.com` con un iframe que apunte a la aplicación.
3. Verificar que la página de login se renderice dentro del iframe y que el flujo de autenticación complete correctamente.
4. Repetir el proceso desde un dominio no autorizado y confirmar que el navegador bloquea la carga.

## Pruebas Automatizadas
Se añadió un test de Cypress que verifica que la página de login puede cargarse dentro de un iframe autorizado.

```bash
npx cypress run --spec cypress/e2e/iframe-login.cy.ts
```
