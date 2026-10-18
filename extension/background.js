// Service worker — sin lógica activa en Fase 1.
// En Fase 2 manejará el token de auth y la comunicación con content scripts.
chrome.runtime.onInstalled.addListener(() => {
  console.log('[moonsto] Extension instalada — modo captura activo')
})
