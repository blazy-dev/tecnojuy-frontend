// src/lib/unregister-sw.ts

/**
 * Busca y anula el registro de todos los Service Workers activos para el sitio.
 * Esto es una medida drástica para solucionar problemas de "Service Workers zombie"
 * que pueden estar sirviendo assets cacheados o interceptando peticiones de forma incorrecta.
 */
export function unregisterServiceWorkers() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      if (registrations.length === 0) {
        console.log('✅ No hay Service Workers registrados. No se necesita limpieza.');
        return;
      }
      
      console.log(`🧹 Encontrados ${registrations.length} Service Workers. Intentando anular registro...`);
      
      for (const registration of registrations) {
        registration.unregister().then((unregistered) => {
          if (unregistered) {
            console.log(`✅ Service Worker anulado con éxito para el scope: ${registration.scope}`);
            // Forzar recarga para asegurar que la página se sirve sin el SW
            window.location.reload();
          } else {
            console.error(`❌ Fallo al anular el registro del Service Worker para el scope: ${registration.scope}`);
          }
        }).catch((error) => {
          console.error(`❌ Error al anular el registro del Service Worker: ${error}`);
        });
      }
    }).catch((error) => {
      console.error(`❌ Error al obtener los registros de Service Worker: ${error}`);
    });
  } else {
    console.log('ℹ️ El navegador no soporta Service Workers.');
  }
}
