# 🎨 Instrucciones para Agregar el Logo

## 📁 **Ubicación del Logo**

Para que el logo aparezca correctamente, necesitas:

1. **Guardar la imagen** en: `public/images/logo-viveros.png`
2. **Formato recomendado**: PNG con fondo transparente
3. **Tamaño recomendado**: 256x256 píxeles o superior

## 🔄 **Pasos para Agregar el Logo**

### **Opción 1: Arrastra y Suelta**
1. Abre el explorador de archivos
2. Ve a la carpeta: `C:\Users\ignad\OneDrive\Escritorio\gestion-empleados\public\images\`
3. Arrastra tu imagen del logo a esta carpeta
4. Renómbrala a: `logo-viveros.png`

### **Opción 2: Copiar y Pegar**
1. Copia tu imagen del logo
2. Ve a la carpeta: `public/images/`
3. Pega la imagen
4. Renómbrala a: `logo-viveros.png`

## ✅ **¿Cómo Saber si Funciona?**

1. **Reinicia el servidor** (Ctrl+C, luego `npm run dev`)
2. **Ve a**: http://localhost:3005/auth/login
3. **Deberías ver**:
   - ✅ Tu logo en grande en la página de login
   - ✅ Tu logo pequeño en la barra de navegación
   - ✅ El texto "Viveros Unidos"

## 🔧 **Si No Aparece el Logo**

**No hay problema**, el sistema tiene un **fallback automático**:
- Si no encuentra `logo-viveros.png`
- Mostrará el emoji 🏢 como respaldo
- Todo seguirá funcionando normalmente

## 📝 **Formatos Soportados**

- ✅ **PNG** (recomendado - soporta transparencia)
- ✅ **JPG/JPEG** (funciona bien)
- ✅ **SVG** (escalable, ideal para logos)
- ✅ **WebP** (moderno y eficiente)

## 🎨 **Dónde Aparece el Logo**

El logo se muestra en:
- 🔐 **Página de login** (tamaño grande)
- 🧭 **Barra de navegación** (tamaño pequeño)
- 📱 **Versión móvil** (adaptativo)

## 🚀 **Personalización Adicional**

Si quieres cambiar más cosas, puedes editar:
- `src/components/LogoRiveras.tsx` - Componente del logo
- `src/app/auth/login/page.tsx` - Página de login
- `src/components/Navegacion.tsx` - Barra de navegación

## 📞 **¿Necesitas Ayuda?**

Si tienes problemas:
1. Verifica que el archivo se llame exactamente: `logo-viveros.png`
2. Verifica que esté en: `public/images/`
3. Reinicia el servidor
4. Revisa la consola del navegador (F12) por errores

