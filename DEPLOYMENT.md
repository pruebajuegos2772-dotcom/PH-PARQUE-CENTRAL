# Publicar Nexo PH gratis con Vercel + Neon

Esta es la combinación recomendada para esta aplicación Next.js con PostgreSQL y Drizzle:

- **Vercel**: publica el frontend y las rutas API de Next.js.
- **Neon**: ofrece PostgreSQL administrado compatible con el `DATABASE_URL` de la app.
- **GitHub**: conserva el código y activa despliegues automáticos.

> No subas el archivo `.env` a GitHub ni envíes por mensaje tu cadena de conexión de Neon.

## 1. Crear la base de datos gratuita en Neon

1. Crea una cuenta en [neon.tech](https://neon.tech) e inicia un proyecto PostgreSQL en el plan gratuito.
2. En el panel del proyecto, abre **Connect** o **Connection Details**.
3. Copia la cadena de conexión **pooled** (pooler), que debe incluir `sslmode=require`. Tiene una forma similar a esta:

   ```text
   postgresql://USUARIO:CONTRASENA@ep-algo-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

4. En tu computadora, crea `.env` desde el ejemplo:

   ```bash
   cp .env.example .env
   ```

5. Reemplaza el valor de `DATABASE_URL` en `.env` con la cadena de Neon. Este archivo es privado y ya está ignorado por Git.

## 2. Crear las tablas de Nexo PH en Neon

Desde la carpeta del proyecto, con `DATABASE_URL` configurada en `.env`, ejecuta:

```bash
npx drizzle-kit push
```

El comando crea las tablas de propietarios, tareas, reportes, cuentas, gastos y fondo común en la base de datos de Neon. La primera vez que se abra el dashboard, la app también agregará los datos de demostración.

Para comprobar el proyecto antes de subirlo:

```bash
npm run build
```

## 3. Subir el código a GitHub

Crea un repositorio vacío en GitHub y, desde la carpeta del proyecto, ejecuta los siguientes comandos una sola vez:

```bash
git init
git add .
git commit -m "Publicar Nexo PH"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/nexo-ph.git
git push -u origin main
```

Verifica en GitHub que **no** aparezca el archivo `.env`. Solo debe verse `.env.example`.

## 4. Publicar en Vercel

1. Crea una cuenta gratuita en [vercel.com](https://vercel.com) usando tu cuenta de GitHub.
2. Selecciona **Add New → Project** e importa el repositorio `nexo-ph`.
3. Vercel detectará automáticamente **Next.js**. No necesitas crear `vercel.json` ni cambiar el comando de build.
4. Antes de pulsar **Deploy**, despliega la sección **Environment Variables** y crea estas dos variables:

   | Nombre | Valor | Entornos |
   | --- | --- | --- |
   | `DATABASE_URL` | La cadena pooled completa de Neon | Production (y Preview si deseas probar previews) |
   | `SESSION_SECRET` | Un texto aleatorio de al menos 16 caracteres (genera uno con `openssl rand -base64 32`) | Production (y Preview) |

   No uses el prefijo `NEXT_PUBLIC_`: la URL de base de datos y el secreto de sesión deben permanecer solo en el servidor.

5. Pulsa **Deploy**. Al terminar, Vercel mostrará una URL similar a:

   ```text
   https://nexo-ph-tuusuario.vercel.app
   ```

6. Abre esa URL y verifica el estado en:

   ```text
   https://TU-URL.vercel.app/api/health
   ```

   Debe responder con `{ "ok": true }`.

## 5. Publicar actualizaciones

A partir de ese momento, cada cambio enviado a la rama principal se publica automáticamente:

```bash
git add .
git commit -m "Describe tu cambio"
git push
```

Si cambias `src/db/schema.ts`, primero actualiza las tablas en Neon desde tu computador con la nueva `DATABASE_URL` y luego despliega el código:

```bash
npx drizzle-kit push
git add .
git commit -m "Actualizar esquema de datos"
git push
```

## Seguridad antes de usarlo con una comunidad real

La pantalla actual incluye un selector de vista para **Administrador** y **Propietario**, útil para demostración. No sustituye una autenticación real con contraseñas, recuperación de acceso y permisos validados en el servidor.

Puedes publicar el portal como demostración o piloto privado siguiendo esta guía. Antes de registrar información financiera real, datos personales o abrirlo al público, implementa autenticación real y restringe las rutas API por rol.

## Límites de los planes gratuitos

Vercel y Neon suelen ser suficientes para una demo, piloto o PH pequeño. Sus cuotas, política de uso y suspensión por inactividad pueden cambiar; revísalas en sus paneles antes de utilizar la app como sistema principal. Para un uso permanente con múltiples propietarios, planifica copias de seguridad y un plan de pago cuando crezca el uso.
