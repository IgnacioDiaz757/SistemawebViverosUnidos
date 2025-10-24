# 🚀 Guía Completa: Cómo Configurar Supabase

## 📋 Estado Actual
❌ **Supabase NO está configurado**  
✅ **El sistema funciona con usuarios hardcodeados**

## 🎯 Credenciales Actuales (Modo Desarrollo)
```
Email: admin@cooperativa.com
Password: 123456

Email: operador@cooperativa.com  
Password: 123456
```

## 🔧 Opción 1: Usar Sin Supabase (Recomendado para pruebas)
Si solo quieres probar el sistema, **no necesitas configurar nada más**:

1. Asegúrate de que el servidor esté corriendo:
   ```bash
   npm run dev
   ```

2. Ve a: http://localhost:3005/auth/login

3. Usa las credenciales de arriba

4. ¡Listo! El sistema funciona completamente con datos en localStorage

## 🗄️ Opción 2: Configurar Supabase (Para producción)

### Paso 1: Crear Proyecto en Supabase
1. Ve a https://supabase.com
2. Haz clic en "Start your project"
3. Crea una cuenta o inicia sesión
4. Haz clic en "New Project"
5. Elige una organización
6. Completa:
   - **Name**: `gestion-empleados` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (¡guárdala!)
   - **Region**: Elige la más cercana a ti
7. Haz clic en "Create new project"
8. **Espera 2-3 minutos** mientras se crea el proyecto

### Paso 2: Obtener Credenciales
1. Una vez creado el proyecto, ve a **Settings** (⚙️) en el menú lateral
2. Haz clic en **API**
3. Copia estos valores:
   - **URL**: Algo como `https://abcdefgh.supabase.co`
   - **anon public**: Una clave larga que empieza con `eyJ...`
   - **service_role**: Otra clave larga (¡MUY IMPORTANTE mantener secreta!)

### Paso 3: Configurar Variables de Entorno
1. En la raíz de tu proyecto, crea un archivo llamado `.env.local`
2. Agrega estas líneas (reemplaza con tus valores reales):

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima-muy-larga-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-clave-servicio-muy-larga-aqui
NEXTAUTH_SECRET=cooperativa-secret-key-development-2024-super-secure
NEXTAUTH_URL=http://localhost:3005
```

### Paso 4: Crear Tablas en Supabase
1. Ve a tu proyecto en Supabase
2. Haz clic en **SQL Editor** en el menú lateral
3. Copia todo el contenido del archivo `supabase-schema-safe.sql`
4. Pégalo en el editor SQL
5. Haz clic en **Run** (▶️)
6. Deberías ver un mensaje de éxito

### Paso 5: Verificar Configuración
1. Reinicia tu servidor:
   ```bash
   # Ctrl+C para parar
   npm run dev
   ```

2. Ejecuta la verificación:
   ```bash
   node test-supabase.js
   ```

3. Deberías ver ✅ confirmando que todo funciona

## ✅ Verificar que Funciona

### Opción A: Script de Verificación
```bash
node test-supabase.js
```

### Opción B: Verificación Manual
1. Ve a tu proyecto Supabase
2. Haz clic en **Table Editor**
3. Deberías ver las tablas: `usuarios`, `contratistas`, `asociados`, `historial_contratistas`
4. Haz clic en `usuarios` - deberías ver 2 usuarios (admin y operador)

### Opción C: Probar Login
1. Ve a http://localhost:3005/auth/login
2. Usa: admin@cooperativa.com / 123456
3. Si funciona, ¡Supabase está configurado correctamente!

## 🚨 Problemas Comunes

### "relation usuarios does not exist"
- **Solución**: No ejecutaste el script SQL
- **Acción**: Ve a SQL Editor y ejecuta `supabase-schema-safe.sql`

### "Invalid API key"
- **Solución**: Las claves en `.env.local` están mal
- **Acción**: Verifica que copiaste las claves correctas de Settings > API

### "CredentialsSignin"
- **Solución**: Problema con las contraseñas
- **Acción**: Ya está solucionado en la versión actual

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:

1. **Ejecuta**: `node check-env.js` para ver tu configuración actual
2. **Ejecuta**: `node test-supabase.js` para probar la conexión
3. **Verifica**: Que el archivo `.env.local` esté en la raíz del proyecto
4. **Reinicia**: El servidor después de cambiar `.env.local`

## 🎉 ¡Listo!

Una vez configurado, tendrás:
- ✅ Base de datos PostgreSQL en la nube
- ✅ Autenticación segura
- ✅ Datos persistentes
- ✅ API automática
- ✅ Panel de administración web
