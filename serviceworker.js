const CACHE_NAME = 'ultimate-sky-diver-cache-v1';
const OFFLINE_URL = '/ultimate_sky_diver.html'; // Имя вашего основного файла игры
// Файл для кэширования: сам основной скрипт
const urlsToCache = [
  OFFLINE_URL
];

// Специальное сообщение об ошибке, которое вернет Service Worker,
// если файл не найден в кэше в режиме офлайн.
// Мы не можем вернуть JavaScript, но можем вернуть специальный ответ, который 
// будет иметь пустой или измененный заголовок, который вызовет ошибку в браузере.
const ERROR_RESPONSE_BODY = "error 134";


self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache, adding game file...');
        // Попытка кэширования основного скрипта
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
          // Если ошибка при первом кэшировании (нет интернета), это нормально.
          // Главное, чтобы Service Worker активировался.
          console.error("Critical resources failed to install. This is normal if offline.", error);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Функция 1: Офлайн основного скрипта (Cache-first)
        if (response) {
          return response; // Файл найден в кэше, возвращаем его
        }
        
        // Если запрос не найден в кэше, делаем сетевой запрос
        return fetch(event.request).catch(() => {
            // Функция 2: Обработка ошибки
            // Если мы офлайн И не смогли найти файл в кэше,
            // возвращаем специальный ответ для главной страницы.
            
            // Если запрос совпадает с URL вашей игры И мы сейчас офлайн,
            if (event.request.url.includes(OFFLINE_URL) && !navigator.onLine) {
                 // Вариант 1: Возвращаем HTML с сообщением об ошибке
                 return new Response(`
                     <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:black; color:white; display:flex; justify-content:center; align-items:center; font-family:sans-serif; text-align:center;">
                         <h1>ERROR 134</h1>
                         <p>Maybe your game was not cached. This means that you need to join the game first time with internet to load. Try again with internet.</p>
                     </div>
                 `, { headers: { 'Content-Type': 'text/html' } });
            }

            // Вариант 2: Если это не основной файл и мы офлайн, просто возвращаем пустой ответ
            return new Response(null, { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
