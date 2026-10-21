/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

// ---- Web Push (Phase 2): payload JSON { title, body, taskId?, tag? } ----
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'DyNAMic', {
      body: data.body ?? '',
      icon: 'pwa-192-v3.png',
      badge: 'pwa-64-v3.png',
      tag: data.tag ?? data.taskId,
      data: { taskId: data.taskId },
    }),
  )
})

// Bấm vào thông báo → mở app tới đúng task
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const taskId = (event.notification.data as { taskId?: string } | undefined)?.taskId
  const url = new URL(self.registration.scope)
  url.hash = taskId ? `/today?task=${taskId}` : '/today'
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const win = windows[0]
      if (win) {
        await win.focus()
        return win.navigate(url.href)
      }
      return self.clients.openWindow(url.href)
    })(),
  )
})
