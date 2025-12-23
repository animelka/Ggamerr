const CACHE_NAME = 'ultimate-sky-diver-cache-v1';

// !!! ВАЖНО: Указываем точное имя вашего репозитория на GitHub Pages !!!
const REPO_NAME = 'Scamlinktester'; 

// Главный файл HTML, который должен загружаться при доступе к корню репозитория
const OFFLINE_URL_FILE = 'index.html'; 

// Файлы, которые мы гарантированно должны закэшировать
const urlsToCache = [
  // 1. Корень репозитория (когда пользователь заходит на https://animelka.github.io/Scamlinktester/)
  `/${REPO_NAME}/`, 
  // 2. Явный путь к главному HTML файлу (необходимо для кэширования его содержимого)
  `/${REPO_NAME}/${OFFLINE_URL_FILE}`
  // Если у вас есть другие критические ресурсы (изображения, шрифты), добавьте их сюда
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache, adding critical resources...');
        // Кэшируем файлы
        // Если хотя бы один файл не загрузится (нет интернета при установке), Service Worker не активируется
        return cache.addAll(urlsToCache); 
      })
      .catch(error => {
          // Выводим ошибку, но даем Service Worker'у завершить установку,
          // если он смог закэшировать хотя бы себя
          console.error("Failed to cache critical resources (URLs might be wrong or no network):", error);
      })
  );
});

self.addEventListener('fetch', event => {
  // Мы обрабатываем только GET-запросы
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Упрощенная логика: Cache-first, затем Network, с запасным вариантом для главной страницы
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 1. Если файл найден в кэше, возвращаем его сразу (Cache-first)
        if (response) {
          return response;
        }
        
        // 2. Если не найден в кэше, делаем сетевой запрос
        return fetch(event.request).catch(() => {
            // 3. Обработка ошибки (Network failed, то есть мы, вероятно, офлайн)

            // Проверяем, пытался ли браузер загрузить корень репозитория (`/Scamlinktester/`) 
            // или главный HTML-файл (`/Scamlinktester/index.html`)
            const isHtmlRequest = event.request.url.endsWith(`/${REPO_NAME}/`) || 
                                  event.request.url.endsWith(`/${REPO_NAME}/${OFFLINE_URL_FILE}`);

            if (isHtmlRequest) {
                // Если мы офлайн и не смогли найти главную страницу даже в кэше
                // (это значит, что кэширование при первом визите не сработало),
                // возвращаем специальное HTML-сообщение.
                 return new Response(`
                   <!DOCTYPE html>
                   <html lang="ru">
                   <body style="background:#333; color:white; font-family:sans-serif; text-align:center; padding-top: 50px;">
                       <h1>ОФФЛАЙН: КЭШ НЕ НАЙДЕН</h1>
                       <p>Для запуска игры в автономном режиме необходимо было посетить страницу хотя бы один раз, когда у вас было подключение к Интернету.</p>
                       <p>Пожалуйста, подключитесь к сети и перезагрузите страницу.</p>
                       <p>Код ошибки: 134</p>
                   </body>
                   </html>
                 `, { headers: { 'Content-Type': 'text/html' } });
            }
            
            // Если это какой-то другой ресурс (изображение, CSS, и т.д.), просто возвращаем 503
            return new Response(null, { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Активация: удаляем старые кэши
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Удаляем кэши, которые не соответствуют текущему CACHE_NAME
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
