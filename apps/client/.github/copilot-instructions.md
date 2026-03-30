# Frontend OpenProof

Este proyecto es un frontend construido con Next.js 16, App Router, React 19 y TypeScript en modo estricto. La interfaz usa Tailwind CSS v4, shadcn/ui sobre Radix UI, iconos de lucide-react y theming con next-themes. Los textos de producto y la UX actual están planteados en español.

## Estructura del proyecto

- `app/`: rutas del App Router. Aquí viven las páginas y layouts del producto. `app/layout.tsx` centraliza `metadata`, `viewport`, fuentes Geist, `ThemeProvider` y `Analytics`. `app/globals.css` es la hoja global activa.
- `app/register`, `app/verify`, `app/dashboard`, `app/history`, `app/faq`, `app/about`, `app/api-docs`: vistas funcionales del producto.
- `app/documents/[id]` y `app/p/[txid]`: rutas dinámicas para detalle de documento y exploración por transacción.
- `components/layout/`: componentes de estructura compartida, como `Header`, `Footer` y `MobileNav`.
- `components/proof/`: componentes de dominio ligados al flujo de prueba de existencia, registro, verificación, hash, timestamp, estados de transacción y tarjetas de documento.
- `components/ui/`: primitives reutilizables de UI basados en shadcn/ui y Radix. Deben ser la primera opción antes de crear componentes base nuevos.
- `hooks/`: hooks reutilizables de cliente, por ejemplo para detectar móvil o manejar toasts.
- `lib/`: utilidades puras y acceso a datos. `lib/utils.ts` expone `cn(...)` para clases CSS y `lib/api.ts` concentra el cliente de datos actual, que hoy es mock.
- `types/`: tipos de dominio, contratos compartidos y respuestas API.
- `public/`: assets estáticos, iconos e imágenes.
- `styles/`: estilos auxiliares o heredados. Hoy el archivo global que realmente se carga desde el layout es `app/globals.css`, no `styles/globals.css`.

## Estándares y patrones del proyecto

- Usar Server Components por defecto. Solo añadir `'use client'` cuando el componente necesite hooks de React, eventos del navegador, `window`, `crypto`, `useTheme` o interacción directa en cliente.
- Mantener las páginas de `app/` como composición de secciones y flujos. Si la lógica o la UI crecen, extraer a `components/proof`, `components/layout`, `hooks` o `lib`.
- Usar imports absolutos con alias `@/` definidos en `tsconfig.json`.
- Centralizar tipos compartidos en `types/index.ts` y preferir `import type` cuando solo se importan tipos.
- Reutilizar componentes de `components/ui/` antes de crear wrappers ad hoc. El proyecto sigue el estilo shadcn/ui con configuración `new-york`, `neutral` y variables CSS.
- Construir estilos con clases utilitarias de Tailwind y tokens semánticos como `bg-background`, `text-foreground`, `border-border`, `bg-secondary` o `text-muted-foreground`.
- Evitar colores hardcodeados en componentes cuando ya exista un token en `app/globals.css`.
- Componer clases condicionales con `cn(...)` desde `@/lib/utils`.
- Mantener un enfoque mobile-first y responsive con utilidades Tailwind. El patrón dominante usa `container mx-auto px-4`, `max-w-*`, `grid`, `flex` y variantes `md:` o `lg:`.
- Usar `lucide-react` para iconografía y mantener coherencia visual con el resto del producto.
- Usar barrel exports cuando ya existan, como en `components/layout/index.ts` y `components/proof/index.ts`, para simplificar imports de dominio.
- Mantener estados explícitos de UI para flujos interactivos, como `idle`, `processing`, `success`, `error`, en lugar de lógica implícita difícil de seguir.
- El hashing del documento se realiza en cliente con Web Crypto API. En los flujos de prueba de existencia no se debe asumir subida del archivo al servidor salvo que el requisito cambie de forma explícita.
- La capa de datos actual es mock y vive en `lib/api.ts`. Si se conecta a backend real, conservar la responsabilidad en una capa de cliente centralizada y mantener contratos tipados con `ApiResponse<T>`.
- Mantener el copy del producto en español mientras no exista una estrategia formal de internacionalización.
- Preservar accesibilidad básica: uso de `sr-only`, etiquetas descriptivas, jerarquía de títulos, estados visibles y componentes semánticos para alerts, dialogs, forms y navegación.
- Preservar el sistema de tema claro/oscuro definido con `next-themes` y variables CSS en `app/globals.css`.

## Guía para cambios futuros

- Antes de crear un componente base nuevo, revisar si ya existe una primitive equivalente en `components/ui/`.
- Si una `page.tsx` empieza a mezclar demasiada UI, estado y efectos, mover piezas reutilizables a componentes de dominio.
- No dispersar llamadas a servicios directamente dentro de múltiples páginas. Encapsular acceso a datos en `lib/api.ts` o en clientes equivalentes.
- No mover tipos de dominio a componentes individuales salvo que sean estrictamente locales. Los contratos compartidos deben permanecer en `types/`.
- Para cambios visuales globales o tokens de diseño, trabajar sobre `app/globals.css`. No asumir que `styles/globals.css` está activo en la aplicación.
- Aunque `next.config.mjs` permita compilar ignorando errores de TypeScript, los cambios deben seguir siendo compatibles con `strict` y no depender de ese bypass.
