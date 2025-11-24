// ============================================
// UTILITY FUNCTIONS - Wspólne funkcje pomocnicze
// ============================================

// Escape HTML - zapobiega XSS
const escapeHtml = (str = '') => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Ulepszona funkcja oczekiwania na załadowanie obrazów z lepszą obsługą błędów
const waitForImages = (images, callback, timeout = 5000) => {
    if (!images || images.length === 0) {
        setTimeout(callback, 200);
        return;
    }

    let loadedCount = 0;
    let allLoaded = false;
    const totalImages = images.length;
    const failedImages = [];

    const checkAndInit = () => {
        if (!allLoaded && loadedCount === totalImages) {
            allLoaded = true;
            // Ukryj nieudane obrazy przed wywołaniem callback
            failedImages.forEach(img => {
                if (img.parentElement) {
                    img.parentElement.style.display = 'none';
                }
            });
            setTimeout(callback, 200);
        }
    };

    images.forEach((img) => {
        // Sprawdź czy obraz jest już załadowany
        if (img.complete && img.naturalWidth > 0) {
            loadedCount++;
            checkAndInit();
        } else if (img.complete && img.naturalWidth === 0) {
            // Obraz nie załadował się poprawnie
            failedImages.push(img);
            loadedCount++;
            checkAndInit();
        } else {
            // Oczekuj na załadowanie
            const loadHandler = () => {
                if (img.naturalWidth === 0) {
                    failedImages.push(img);
                }
                loadedCount++;
                checkAndInit();
                img.removeEventListener('load', loadHandler);
                img.removeEventListener('error', errorHandler);
            };

            const errorHandler = () => {
                failedImages.push(img);
                loadedCount++;
                checkAndInit();
                img.removeEventListener('load', loadHandler);
                img.removeEventListener('error', errorHandler);
            };

            img.addEventListener('load', loadHandler);
            img.addEventListener('error', errorHandler);
        }
    });

    // Fallback timeout - jeśli obrazy nie załadują się w określonym czasie
    setTimeout(() => {
        if (!allLoaded) {
            allLoaded = true;
            failedImages.forEach(img => {
                if (img.parentElement) {
                    img.parentElement.style.display = 'none';
                }
            });
            callback();
        }
    }, timeout);
};

// Pomocnicza funkcja do czyszczenia ScrollTrigger
const killScrollTriggers = (element) => {
    if (typeof ScrollTrigger === 'undefined' || !element) return;
    ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === element) {
            trigger.kill();
        }
    });
};

// Debounce dla zdarzeń resize
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Cache dla zoptymalizowanych obrazów - żeby nie przetwarzać ich wielokrotnie
const optimizedImageCache = new Map();

// Funkcja do kompresji i zmniejszania rozdzielczości zdjęć
// Kompresja obrazów - pliki źródłowe są już skompresowane do 70% jakości
// Dla dodatkowej optymalizacji w przeglądarce (jeśli potrzeba)
// Jakość: 0.80 = 80% (zgodne z plikami źródłowymi)
// Rozdzielczość: 1000px szerokości - wystarczające dla większości ekranów
function optimizeImage(imgSrc, maxWidth = 1000, maxHeight = 700, quality = 0.80) {
    // Sprawdź cache
    const cacheKey = `${imgSrc}_${maxWidth}_${maxHeight}_${quality}`;
    if (optimizedImageCache.has(cacheKey)) {
        return Promise.resolve(optimizedImageCache.get(cacheKey));
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        // Krótszy timeout - szybciej użyj oryginału jeśli kompresja trwa zbyt długo
        const timeout = setTimeout(() => {
            optimizedImageCache.set(cacheKey, imgSrc);
            resolve(imgSrc);
        }, 500); // Zmniejszone z 1000ms do 500ms dla szybszej reakcji

        img.onload = () => {
            clearTimeout(timeout);

            // Jeśli obraz jest już mniejszy niż maksymalne wymiary, zwróć oryginał
            if (img.width <= maxWidth && img.height <= maxHeight) {
                optimizedImageCache.set(cacheKey, imgSrc);
                resolve(imgSrc);
                return;
            }

            // Użyj requestIdleCallback jeśli dostępne, żeby nie blokować animacji
            const compress = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Oblicz nowe wymiary zachowując proporcje
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Użyj najszybszej jakości renderowania (low dla maksymalnej szybkości)
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'low'; // Zmienione z 'medium' na 'low' - najszybsze

                ctx.drawImage(img, 0, 0, width, height);

                // Konwertuj do blob URL z kompresją
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        optimizedImageCache.set(cacheKey, url);
                        resolve(url);
                    } else {
                        // Fallback do oryginału jeśli kompresja się nie powiodła
                        optimizedImageCache.set(cacheKey, imgSrc);
                        resolve(imgSrc);
                    }
                }, 'image/jpeg', quality);
            };

            // Użyj requestIdleCallback jeśli dostępne, w przeciwnym razie wykonaj od razu
            if (window.requestIdleCallback) {
                requestIdleCallback(compress, { timeout: 200 }); // Zmniejszone z 500ms dla szybszej kompresji
            } else {
                // Fallback - wykonaj w następnym ticku
                setTimeout(compress, 0);
            }
        };

        img.onerror = () => {
            clearTimeout(timeout);
            // Fallback do oryginału w przypadku błędu
            optimizedImageCache.set(cacheKey, imgSrc);
            resolve(imgSrc);
        };

        img.src = imgSrc;
    });
}

// ============================================
// MAIN DATA
// ============================================

// Main page photos - uses actual file names from "random photos" folder
const mainPhotos = [
    { id: 1, src: 'random photos/eurotrip84 2.jpg', alt: 'Photo 1' },
    { id: 2, src: 'random photos/eurotrip166 2.jpg', alt: 'Photo 2' },
    { id: 3, src: 'random photos/IMG_1131 2.jpg', alt: 'Photo 3' },
    { id: 4, src: 'random photos/IMG_1136 2.jpg', alt: 'Photo 4' },
    { id: 5, src: 'random photos/IMG_2316.jpg', alt: 'Photo 5' },
    { id: 6, src: 'random photos/IMG_2341.jpg', alt: 'Photo 6' },
    { id: 7, src: 'random photos/IMG_2344.jpg', alt: 'Photo 7' },
    { id: 8, src: 'random photos/IMG_2351 2.jpg', alt: 'Photo 8' },
    { id: 9, src: 'random photos/IMG_2355.jpg', alt: 'Photo 9' },
    { id: 10, src: 'random photos/IMG_2356.jpg', alt: 'Photo 10' },
    { id: 11, src: 'random photos/IMG_2368.jpg', alt: 'Photo 11' },
    { id: 12, src: 'random photos/IMG_2383.jpg', alt: 'Photo 12' },
    { id: 13, src: 'random photos/IMG_4827.jpg', alt: 'Photo 13' },
    { id: 14, src: 'random photos/IMG_4847.jpg', alt: 'Photo 14' },
    { id: 15, src: 'random photos/IMG_6315 2.jpg', alt: 'Photo 15' },
    { id: 16, src: 'random photos/IMG_6469 2.jpg', alt: 'Photo 16' },
    { id: 17, src: 'random photos/IMG_6472.jpg', alt: 'Photo 17' },
    { id: 18, src: 'random photos/IMG_6477.jpg', alt: 'Photo 18' },
    { id: 19, src: 'random photos/IMG_6488.jpg', alt: 'Photo 19' },
    { id: 20, src: 'random photos/IMG_6489 2.jpg', alt: 'Photo 20' },
    { id: 21, src: 'random photos/IMG_7749 2.jpg', alt: 'Photo 21' },
    { id: 22, src: 'random photos/IMG_7759.jpg', alt: 'Photo 22' },
    { id: 23, src: 'random photos/IMG_7765 2.jpg', alt: 'Photo 23' }
].slice(0, 18); // Use first 18 photos

// Helper function to get all photos from a folder using actual file names
function getPhotosFromFolder(folderName, fileNames) {
    if (!fileNames || !Array.isArray(fileNames)) {
        return [];
    }
    return fileNames.map((fileName, index) => ({
        id: index + 1,
        src: `${folderName}/${fileName}`,
        caption: `Photo ${index + 1}`
    }));
}

// Chapter data - mapped to your actual folder names with real file names
const chapters = {
    'people': {
        title: 'Paris',
        count: 6,
        date: '',
        description: '',
        folder: 'paris',
        photos: getPhotosFromFolder('paris', [
            'IMG_1097.jpg',
            'IMG_1101 2.jpg',
            'IMG_1107 2.jpg',
            'IMG_1108.jpg',
            'IMG_1128 2.jpg',
            'IMG_1129 2.jpg'
        ])
    },
    'europe': {
        title: 'Europe',
        count: 22,
        date: '',
        description: '',
        folder: 'europe',
        photos: getPhotosFromFolder('europe', [
            'IMG_3908.jpg',
            'IMG_3912 2.jpg',
            'IMG_3917.jpg',
            'IMG_3921.jpg',
            'IMG_3923.jpg',
            'IMG_3928 2.jpg',
            'IMG_3929.jpg',
            'IMG_3930.jpg',
            'IMG_3932.jpg',
            'IMG_3941.jpg',
            'IMG_3955 2.jpg',
            'IMG_3960.jpg',
            'IMG_3979.jpg',
            'IMG_3986 2.jpg',
            'IMG_3988 2.jpg',
            'IMG_4015 2.jpg',
            'IMG_4016 2.jpg',
            'IMG_4024.jpg',
            'IMG_4040 2.jpg',
            'IMG_4042.jpg',
            'IMG_4046.jpg'
        ])
    },
    'iceland': {
        title: 'Iceland',
        count: 37,
        date: '',
        description: '',
        folder: 'iceland',
        photos: getPhotosFromFolder('iceland', [
            'IMG_9551 2.jpg',
            'IMG_9554 2.jpg',
            'IMG_9556 2.jpg',
            'IMG_9559 2.jpg',
            'IMG_9560 2.jpg',
            'IMG_9561 2.jpg',
            'IMG_9564.jpg',
            'IMG_9566.jpg',
            'IMG_9567 2.jpg',
            'IMG_9568 2.jpg',
            'IMG_9570 2.jpg',
            'IMG_9573 2.jpg',
            'IMG_9575 2.jpg',
            'IMG_9576 2.jpg',
            'IMG_9578.jpg',
            'IMG_9579 2.jpg',
            'IMG_9580 2.jpg',
            'IMG_9581.jpg',
            'IMG_9582 2.jpg',
            'IMG_9583 2.jpg',
            'IMG_9584.jpg',
            'IMG_9588.jpg',
            'IMG_9589 2.jpg',
            'IMG_9591.jpg',
            'IMG_9592 2.jpg',
            'IMG_9593 2.jpg',
            'IMG_9598 2.jpg',
            'IMG_9600 2.jpg',
            'IMG_9605 2.jpg',
            'IMG_9606 2.jpg',
            'IMG_9608 2.jpg',
            'IMG_9609 2.jpg',
            'IMG_9611.jpg',
            'IMG_9612 2.jpg',
            'IMG_9614 2.jpg',
            'IMG_9617 2.jpg',
            'IMG_9621 2.jpg',
            'IMG_9623 2.jpg'
        ])
    },
    'lighthouse': {
        title: 'Chicago',
        count: 14,
        date: 'September 2017',
        description: `His name was João. We met at a gallery, started talking about photography, and suddenly I was sitting in a park with all of his friends, eating snacks and trying to follow their fast, joyful Portuguese. I didn't understand every word, but I understood the warmth. This is a visual diary of my time in Portugal, the first journey I took on my own.`,
        folder: 'chicago',
        photos: getPhotosFromFolder('chicago', [
            'IMG_7968 2.jpg',
            'IMG_7971 2.jpg',
            'IMG_7973 2.jpg',
            'IMG_7977 2.jpg',
            'IMG_7979 2.jpg',
            'IMG_7987.jpg',
            'IMG_7988.jpg',
            'IMG_7989 2.jpg',
            'IMG_7991 2.jpg',
            'IMG_7992 2.jpg',
            'IMG_7993 2.jpg',
            'IMG_7995.jpg',
            'IMG_8001.jpg',
            'IMG_8002 2.jpg'
        ])
    },
    'after-sun': {
        title: 'Asia',
        count: 16,
        date: 'June 2024',
        description: 'Later, when I looked at the photographs again, I realized it wasn\'t just the light or the sea behind you. It was the way your presence held the silence, how the air seemed to pause when you entered the frame.',
        folder: 'asia',
        photos: getPhotosFromFolder('asia', [
            'IMG_6317 2.jpg',
            'IMG_6320 2.jpg',
            'IMG_6346 2.jpg',
            'IMG_6349 2.jpg',
            'IMG_6352 2.jpg',
            'IMG_6354 2.jpg',
            'IMG_6355 3.jpg',
            'IMG_6360 2.jpg',
            'IMG_6371 2.jpg',
            'IMG_6378.jpg',
            'IMG_6380 2.jpg',
            'IMG_6382 2.jpg',
            'IMG_6386 2.jpg',
            'IMG_6390 2.jpg',
            'IMG_6394 2.jpg',
            'IMG_6398.jpg'
        ])
    },
    'hidden-tides': {
        title: 'Korea',
        count: 23,
        date: 'August 2018',
        description: 'Four years of studying design were finally coming to an end, David, Sasha, and I decided we needed a break...',
        folder: 'korea',
        photos: getPhotosFromFolder('korea', [
            '7a3cef52-45b1-404d-bb94-ef75b4867118 2.jpg',
            'ac7be8b6-81fd-4f99-9ccc-96a095b316f0 2.jpg',
            'IMG_2600.jpg',
            'IMG_3352 2.jpg',
            'IMG_3354 2.jpg',
            'IMG_3356.jpg',
            'IMG_3367.jpg',
            'IMG_3374.jpg',
            'IMG_3406 2.jpg',
            'IMG_3408 2.jpg',
            'IMG_3416.jpg',
            'IMG_3417 2.jpg',
            'IMG_3428 2.jpg',
            'IMG_3429 2.jpg',
            'IMG_3438 2.jpg',
            'IMG_3443.jpg',
            'IMG_3454.jpg',
            'IMG_3460 2.jpg',
            'IMG_3473 2.jpg',
            'IMG_3480 2.jpg',
            'IMG_3481.jpg',
            'IMG_3486.jpg'
        ])
    },
    'dead-sea': {
        title: 'Balkans',
        count: 27,
        date: 'August 2019',
        description: `There's something magical about introducing someone you love to a place that lives in your bones. The Dead Sea has always held a strange, quiet power over me, its stillness, its impossible salt, its shimmering light. One Summer, I took Michael there.`,
        folder: 'balkans',
        photos: getPhotosFromFolder('balkans', [
            'IMG_0579 3.jpg',
            'IMG_0583 2.jpg',
            'IMG_0584 3.jpg',
            'IMG_0588 3.jpg',
            'IMG_0589 4.jpg',
            'IMG_0590 3.jpg',
            'IMG_0591.jpg',
            'IMG_0593.jpg',
            'IMG_0594 2.jpg',
            'IMG_0596.jpg',
            'IMG_0598.jpg',
            'IMG_0602 2.jpg',
            'IMG_0603 3.jpg',
            'IMG_0604 4.jpg',
            'IMG_0609 4.jpg',
            'IMG_0614 3.jpg',
            'IMG_0618 3.jpg',
            'IMG_0621 2.jpg',
            'IMG_0622 3.jpg',
            'IMG_0627 2.jpg',
            'IMG_0631.jpg',
            'IMG_0637 4.jpg',
            'IMG_0640 3.jpg',
            'IMG_0643 2.jpg',
            'IMG_0644 3.jpg',
            'IMG_0647 2.jpg',
            'IMG_0648 3.jpg'
        ])
    },
    'closing': {
        title: 'Philippines',
        count: 15,
        date: '',
        description: 'I chose to live by the sea. The pull toward that endless horizon comes from a deep need to leave the city behind and look outward, toward something wider, quieter, unknown. The infinite space allows me to create. Out there, the connection between human and nature feels powerful, almost spiritual.',
        folder: 'philippines',
        photos: getPhotosFromFolder('philippines', [
            'IMG_3375 2.jpg',
            'IMG_3378 2.jpg',
            'IMG_3382 2.jpg',
            'IMG_3390.jpg',
            'IMG_3392 2.jpg',
            'IMG_3393.jpg',
            'IMG_3405 2.jpg',
            'IMG_4165 2.jpg',
            'IMG_4176 2.jpg',
            'IMG_4177 2.jpg',
            'IMG_4185 2.jpg',
            'IMG_4186 2.jpg',
            'IMG_4187 2.jpg',
            'IMG_4188 2.jpg',
            'IMG_4192.jpg'
        ])
    },
    'horizon': {
        title: 'Maroko',
        count: 22,
        date: '',
        description: '',
        folder: 'maroko',
        photos: getPhotosFromFolder('maroko', [
            'IMG_9021 2.jpg',
            'IMG_9030.jpg',
            'IMG_9033 2.jpg',
            'IMG_9035 2.jpg',
            'IMG_9050 2.jpg',
            'IMG_9053 2.jpg',
            'IMG_9055 2.jpg',
            'IMG_9057 2.jpg',
            'IMG_9060 2.jpg',
            'IMG_9062 2.jpg',
            'IMG_9063 2.jpg',
            'IMG_9064 2.jpg',
            'IMG_9066 2.jpg',
            'IMG_9068.jpg',
            'IMG_9071 2.jpg',
            'IMG_9078 2.jpg',
            'IMG_9079 2.jpg',
            'IMG_9081 2.jpg',
            'IMG_9082 2.jpg',
            'IMG_9084 2.jpg',
            'IMG_9086.jpg'
        ])
    }
};

// Namibia photos - only existing JPG/jpg files from folder
const theCollectionsPhotos = getPhotosFromFolder('namibia', [
    'IMG_7777 2.jpg',
    'IMG_7786 2.jpg',
    'IMG_7790 2.jpg',
    'IMG_7793.jpg',
    'IMG_7815 2.jpg',
    'IMG_7819 2.jpg',
    'IMG_7820 2.jpg',
    'IMG_7821 2.jpg',
    'IMG_7824 2.jpg',
    'IMG_7825 2.jpg',
    'IMG_7826.jpg',
    'IMG_7831 2.jpg',
    'IMG_7832 2.jpg',
    'IMG_7836 2.jpg',
    'IMG_7837 2.jpg',
    'IMG_7839 2.jpg',
    'IMG_7843.jpg',
    'IMG_7844 2.jpg',
    'IMG_7846 3.jpg',
    'IMG_7858 2.jpg',
    'IMG_7862 2.jpg',
    'IMG_7864 2.jpg',
    'IMG_7865 2.jpg',
    'IMG_7866 2.jpg',
    'IMG_7867 2.jpg',
    'IMG_7868.jpg',
    'IMG_7871.jpg',
    'IMG_7872.jpg'
]);

// Lista albumów w kolejności (używana do preloadingu)
const albumOrder = [
    'people',      // Paris
    'europe',      // Europe
    'iceland',     // Iceland
    'lighthouse',  // Chicago
    'after-sun',   // Asia
    'hidden-tides', // Korea
    'collections', // Namibia (horizontal-gallery-section)
    'dead-sea',    // Balkans
    'closing',     // Philippines
    'horizon'      // Maroko
];

// Cache dla załadowanych obrazów (preloading)
const preloadedImages = new Set();

// Funkcja do preloadingu obrazów z albumu
function preloadAlbumImages(chapterId) {
    const chapter = chapters[chapterId];
    if (!chapter || !chapter.photos || chapter.photos.length === 0) return;

    // Załaduj obrazy z albumu (maksymalnie 10 na raz, żeby nie przeciążyć)
    const photosToPreload = chapter.photos.slice(0, 10);

    photosToPreload.forEach(photo => {
        if (preloadedImages.has(photo.src)) return; // Już załadowane

        // Utwórz niewidoczny obraz do preloadingu
        const img = new Image();
        img.onload = () => {
            preloadedImages.add(photo.src);
        };
        img.onerror = () => {
            // Ignoruj błędy, ale oznacz jako próbowane
            preloadedImages.add(photo.src);
        };
        img.src = photo.src;
    });
}

// Funkcja do wykrywania widocznego albumu i preloadingu następnych
function initAlbumPreloading() {
    const albumSections = albumOrder.map(id => {
        // Dla Namibia użyj horizontal-gallery-section zamiast collections
        if (id === 'collections') {
            return document.getElementById('horizontal-gallery-section');
        }
        return document.getElementById(id);
    }).filter(Boolean);

    if (albumSections.length === 0) return;

    // Intersection Observer do wykrywania widocznych albumów
    const albumObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = entry.target;
                const sectionId = section.id;

                // Znajdź indeks aktualnego albumu
                let currentIndex = -1;
                if (sectionId === 'horizontal-gallery-section') {
                    currentIndex = albumOrder.indexOf('collections');
                } else {
                    currentIndex = albumOrder.indexOf(sectionId);
                }

                if (currentIndex !== -1) {
                    // Załaduj obrazy z następnych 3 albumów (zamiast 2) dla lepszej płynności
                    for (let i = 1; i <= 3; i++) {
                        const nextIndex = currentIndex + i;
                        if (nextIndex < albumOrder.length) {
                            const nextAlbumId = albumOrder[nextIndex];
                            preloadAlbumImages(nextAlbumId);
                        }
                    }
                }
            }
        });
    }, {
        rootMargin: '500px' // Zwiększone z 200px - ładuj dużo wcześniej dla płynności
    });

    // Obserwuj wszystkie albumy
    albumSections.forEach(section => {
        albumObserver.observe(section);
    });

    // Załaduj od razu obrazy z pierwszych 2 albumów (Paris i Europe)
    // Te albumy używają eager loading, więc preloading nie jest potrzebny, ale zachowujemy dla innych
    preloadAlbumImages('people');
    preloadAlbumImages('europe');
}

// Funkcja do optymalizacji wszystkich obrazów z lazy loading
function optimizeAllLazyImages() {
    const lazyImages = document.querySelectorAll('img.lazy-optimized-image[data-src]');

    if (lazyImages.length === 0) return;

    // Intersection Observer dla lazy loading (bez animacji - obrazy od razu widoczne)
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const dataSrc = img.getAttribute('data-src');

                if (dataSrc) {
                    // Sprawdź czy obraz jest już w cache preloadingu
                    const isPreloaded = preloadedImages.has(dataSrc);

                    // Jeśli obraz jest już załadowany w preloadingu, użyj go od razu
                    if (isPreloaded) {
                        // Użyj oryginału jeśli jest w cache preloadingu (już załadowany)
                        img.src = dataSrc;
                        img.classList.add('loaded');
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    } else {
                        // Optymalizuj obraz - bez animacji, od razu ustaw src
                        // Użyj domyślnych ustawień kompresji (1600px, 70% jakość)
                        optimizeImage(dataSrc).then(optimizedSrc => {
                            img.src = optimizedSrc;
                            img.classList.add('loaded');
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        });
                    }
                }
            }
        });
    }, {
        rootMargin: '500px' // Zwiększone z 300px - ładuj dużo wcześniej dla maksymalnej płynności
    });

    lazyImages.forEach(img => {
        imageObserver.observe(img);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Navbar ukryty na początku - pojawi się po animacji zdjęć
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.classList.add('hidden');
    }

    loadMainPhotos();
    loadAllChapterPhotos();
    initMenuModal();
    initSmoothScroll();
    initAlbumsPreview();
    initScrollBasedAlbum();
    initEuropeScrollAlbum();
    initSwitchGallery();

    // Inicjalizuj preloading albumów (2 albumy do przodu)
    setTimeout(() => {
        initAlbumPreloading();
    }, 1000);

    // Optymalizuj obrazy po załadowaniu (z małym opóźnieniem, żeby DOM był gotowy)
    setTimeout(() => {
        optimizeAllLazyImages();
        // Wywołaj ponownie po załadowaniu wszystkich albumów
        setTimeout(() => {
            optimizeAllLazyImages();
        }, 2000);
    }, 500);

    // Opóźnij inicjalizację Namibii, aby Korea się najpierw ustabilizowała
    // initHiddenTidesSection() używa waitForImages() i ScrollTrigger.refresh(),
    // więc dajemy czas na pełne załadowanie i odświeżenie przed inicjalizacją Namibii
    setTimeout(() => {
        initHorizontalGallery(); // Inicjalizacja Namibii po ustabilizowaniu Korei
        // Optymalizuj obrazy Namibii po załadowaniu
        setTimeout(() => {
            optimizeAllLazyImages();
        }, 1000);
    }, 2000); // 2 sekundy powinny wystarczyć na wstawienie zdjęć i pierwsze odświeżenie ScrollTrigger
});

// Load main page photos with slideshow then grid animation
function loadMainPhotos() {
    const grid = document.getElementById('main-photos-grid');
    if (!grid) return;

    // Najpierw pokaż wszystkie zdjęcia w jednym miejscu (centrum ekranu)
    // Dla głównej strony używamy oryginalnych obrazów bez kompresji - szybsze ładowanie
    grid.innerHTML = mainPhotos.map((photo, index) => {
        return `
            <div class="photo-item" data-index="${index}">
                <img src="${photo.src}" 
                     alt="${photo.alt}" 
                     loading="eager">
            </div>
        `;
    }).join('');

    // Ustaw początkową pozycję wszystkich zdjęć w pierwszej kolumnie każdego rzędu
    const items = grid.querySelectorAll('.photo-item');
    // Automatycznie dostosuj do szerokości ekranu - użyj rzeczywistej szerokości kontenera
    // Kontener ma max-width w CSS (1400px na desktop, 1920px na 4K), więc automatycznie dostosowuje się do ekranu
    const container = grid.closest('.photos-grid-container');
    // container.offsetWidth automatycznie zwraca rzeczywistą szerokość z uwzględnieniem max-width z CSS
    const gridWidth = container ? container.offsetWidth : window.innerWidth;
    const computedStyle = getComputedStyle(grid);
    const rowGapPx = parseFloat(computedStyle.rowGap) || parseFloat(computedStyle.gap) || 1.6; // 0.1rem = ~1.6px (zmniejszone)
    const columnGapPx = parseFloat(computedStyle.columnGap) || parseFloat(computedStyle.gap) || 8; // 0.5rem = ~8px

    const numColumns = 12;
    const columnsPerPhoto = 2;
    const photosPerRow = 6; // 6 zdjęć na rząd

    const singleColumnWidth = (gridWidth - ((numColumns - 1) * columnGapPx)) / numColumns;
    const cellWidth = singleColumnWidth * columnsPerPhoto + columnGapPx;
    const cellHeight = cellWidth;

    // Rozmiar zdjęć - pomniejszony
    const photoSize = cellWidth * 0.6; // Zwiększone z 0.55 na 0.6

    // Oblicz pozycje startowe dla każdego rzędu - większe odstępy między nimi
    // Użyj szerokości kontenera dla symetrii na wszystkich ekranach
    const startPositions = [
        gridWidth * 0.1,  // Pierwszy rząd - lewa strona (zmienione z 0.15)
        gridWidth * 0.5,  // Drugi rząd - środek (zmienione z 0.45)
        gridWidth * 0.8   // Trzeci rząd - prawa strona (zmienione z 0.9, żeby nie dotykał krawędzi)
    ];

    items.forEach((item, index) => {
        const row = Math.floor(index / photosPerRow); // Który rząd (0, 1, 2)
        const colInRow = index % photosPerRow; // Pozycja w rzędzie (0-5)

        // Wszystkie zdjęcia w rzędzie zaczynają w tym samym miejscu (nakładają się)
        // Ale każde zdjęcie po pojawieniu się przesunie się lekko w prawo
        const baseLeftPos = startPositions[row];
        const offset = colInRow * 15; // Przesunięcie w prawo dla każdego zdjęcia (15px)
        const leftPos = baseLeftPos + offset;

        // Oblicz końcowy rozmiar zdjęć (taki sam jak będzie w animacji rozwijania)
        const finalPhotoSize = cellWidth * 0.6; // Zwiększone z 0.55 na 0.6
        const navbarHeight = 80; // Wysokość paska nawigacji w px
        const numRows = 3; // Liczba rzędów
        const rowSpacing = 35; // Zmniejszony odstęp pionowy między rzędami (px)
        const topMargin = -70; // Ujemny odstęp - zdjęcia jeszcze bliżej napisu

        // Oblicz pozycję top dla każdego rzędu - zdjęcia bliżej górnej granicy
        const topPos = navbarHeight + topMargin + row * (finalPhotoSize + rowSpacing);

        // Ustaw pozycję tekstu pod zdjęciami (po ostatnim rzędzie)
        if (index === items.length - 1) {
            const lastRowTop = navbarHeight + topMargin + (numRows - 1) * (finalPhotoSize + rowSpacing);
            const textTop = lastRowTop + finalPhotoSize + 35; // 35px odstęp pod ostatnim rzędem - trochę wyżej
            const introText = document.getElementById('intro-text-below-photos');
            if (introText) {
                introText.style.top = `${textTop}px`;
            }
        }

        item.style.width = `${photoSize}px`;
        item.style.height = `${photoSize}px`;
        item.style.left = `${leftPos}px`;
        item.style.top = `${topPos}px`;
        item.style.zIndex = 1000 + row + colInRow; // Wyższy z-index dla kolejnych zdjęć w rzędzie
        item.style.opacity = '0'; // Ustaw niewidoczne na początku
        item.style.position = 'absolute';
    });

    // Po załadowaniu wszystkich zdjęć, rozpocznij slideshow - użyj ulepszonej funkcji
    // Zmniejszony timeout - animacja zacznie się szybciej
    const images = grid.querySelectorAll('.photo-item img');
    waitForImages(images, startSlideshow, 2000); // Zmniejszone z 5000ms do 2000ms
}

// Slideshow - pokazuj zdjęcia jedno po drugim, bez animacji przesuwania
function startSlideshow() {
    const grid = document.getElementById('main-photos-grid');
    if (!grid) return;

    const items = Array.from(grid.querySelectorAll('.photo-item'));

    // Pokaż zdjęcia jedno po drugim - po prostu się pojawiają
    items.forEach((item, index) => {
        setTimeout(() => {
            // Pokaż zdjęcie - już ma przesunięcie w prawo z ustawień początkowych
            item.style.opacity = '1';
            item.classList.add('slideshow-active');
        }, index * 150); // Umiarkowana prędkość - 150ms między każdym zdjęciem
    });

    // Po pokazaniu wszystkich zdjęć, rozpocznij animację rozwijania
    // Czekamy aż wszystkie zdjęcia się pokażą (18 * 150ms = 2700ms) + krótka przerwa
    setTimeout(() => {
        animatePhotosToGrid();
    }, items.length * 150 + 100); // 2700ms + 100ms przerwy (krótsza przerwa)
}

function animatePhotosToGrid() {
    const grid = document.getElementById('main-photos-grid');
    if (!grid) return;

    const items = grid.querySelectorAll('.photo-item');
    const computedStyle = getComputedStyle(grid);
    const rowGapPx = parseFloat(computedStyle.rowGap) || parseFloat(computedStyle.gap) || 1.6; // 0.1rem = ~1.6px (zmniejszone)
    const columnGapPx = parseFloat(computedStyle.columnGap) || parseFloat(computedStyle.gap) || 8; // 0.5rem = ~8px
    
    // Automatycznie dostosuj do szerokości ekranu - użyj rzeczywistej szerokości kontenera
    // Kontener ma max-width w CSS, więc automatycznie dostosowuje się do ekranu
    const container = grid.closest('.photos-grid-container');
    // Użyj rzeczywistej szerokości kontenera (która automatycznie dostosowuje się do ekranu przez CSS max-width)
    const gridWidth = container ? container.offsetWidth : window.innerWidth;

    // 12 kolumn, ale każde zdjęcie zajmuje 2 kolumny = efekt 6 kolumn z mniejszymi zdjęciami
    let numColumns;
    if (window.innerWidth > 768) {
        numColumns = 12; // 12 kolumn, każde zdjęcie zajmuje 2 kolumny
    } else {
        numColumns = 6; // Na telefonach 6 kolumn, każde zdjęcie zajmuje 2 kolumny
    }
    const columnsPerPhoto = 2; // Każde zdjęcie zajmuje 2 kolumny
    const singleColumnWidth = (gridWidth - ((numColumns - 1) * columnGapPx)) / numColumns;
    const cellWidth = singleColumnWidth * columnsPerPhoto + columnGapPx; // Szerokość 2 kolumn + 1 gap
    const cellHeight = cellWidth;

    // Usuń wszystkie klasy slideshow
    items.forEach(item => {
        item.classList.remove('slideshow-active');
        item.classList.add('animating');
    });

    // Rozwijaj zdjęcia z 3 różnych miejsc na wszystkie 6 kolumn w każdym rzędzie
    const photosPerRow = 6; // 6 zdjęć na rząd

    // Kierunki rozwijania dla każdego rzędu
    const expandDirections = [
        1,  // Pierwszy rząd - rozwija się w prawo (od lewej)
        -1, // Drugi rząd - rozwija się w lewo (od środka)
        1   // Trzeci rząd - rozwija się w prawo (od prawej)
    ];

    // Pozycje startowe dla każdego rzędu - takie same jak w slideshow (większe odstępy)
    const startPositions = [
        gridWidth * 0.1,  // Pierwszy rząd - lewa strona
        gridWidth * 0.5,  // Drugi rząd - środek
        gridWidth * 0.8   // Trzeci rząd - prawa strona (zmienione z 0.9, żeby nie dotykał krawędzi)
    ];

    items.forEach((item, index) => {
        const row = Math.floor(index / photosPerRow);
        const colInRow = index % photosPerRow;

        // Rozmiar zdjęć - taki sam jak w slideshow (zmniejszony)
        const photoSize = cellWidth * 0.6; // Zwiększone z 0.55 na 0.6

        // Oblicz pozycję docelową - zdjęcia rozwijają się w różnych kierunkach
        const direction = expandDirections[row];

        // Oblicz docelową pozycję w zależności od kierunku
        // Większe odstępy między zdjęciami w poziomie
        const extraSpacing = 80; // Zwiększony odstęp między zdjęciami (px) - zwiększony z 40 na 80
        const sideMargin = 5; // Minimalny odstęp od krawędzi (px) - zmniejszony z 20 na 5

        // Oblicz całkowitą szerokość wszystkich zdjęć z odstępami
        const totalPhotosWidth = photosPerRow * photoSize + (photosPerRow - 1) * extraSpacing;

        // Wyśrodkuj zdjęcia z symetrycznymi marginesami po obu stronach
        // Użyj rzeczywistej szerokości kontenera dla wyśrodkowania (automatycznie dostosowuje się do ekranu)
        const actualContainerWidth = container ? container.offsetWidth : gridWidth;
        const horizontalOffset = (actualContainerWidth - totalPhotosWidth) / 2;
        // Użyj mniejszej wartości - zdjęcia bliżej krawędzi, ale zawsze wyśrodkowane
        const finalHorizontalOffset = Math.max(sideMargin, horizontalOffset);

        let leftPos;
        if (direction === 1) {
            // Rozwijanie w prawo - normalna kolejność kolumn
            // Pozycje są względem kontenera (position: relative), więc nie dodajemy offset
            leftPos = finalHorizontalOffset + colInRow * (photoSize + extraSpacing);
        } else {
            // Rozwijanie w lewo - odwrotna kolejność kolumn
            leftPos = finalHorizontalOffset + (photosPerRow - 1 - colInRow) * (photoSize + extraSpacing);
        }

        // Użyj dokładnie tej samej odległości między rzędami jak w slideshow
        // Oblicz równomierne odstępy od góry i dołu (wyśrodkowanie z minimalnym marginesem)
        const navbarHeight = 80;
        const numRows = 3; // Liczba rzędów
        const rowSpacing = 35; // Zmniejszony odstęp pionowy między rzędami (px)
        const topMargin = -70; // Ujemny odstęp - zdjęcia jeszcze bliżej napisu

        // Oblicz pozycję top dla każdego rzędu - zdjęcia bliżej górnej granicy
        const topPos = navbarHeight + topMargin + row * (photoSize + rowSpacing);

        // Ustaw pozycję tekstu pod zdjęciami (po ostatnim rzędzie) - upewnij się, że nie nachodzi na zdjęcia
        if (index === items.length - 1) {
            const lastRowTop = navbarHeight + topMargin + (numRows - 1) * (photoSize + rowSpacing);
            const textTop = lastRowTop + photoSize + 35; // 35px odstęp pod ostatnim rzędem - trochę wyżej
            const introText = document.getElementById('intro-text-below-photos');
            if (introText) {
                introText.style.top = `${textTop}px`;
            }
        }

        // Animuj tylko pozycję - rozmiar już jest końcowy
        setTimeout(() => {
            item.style.left = `${leftPos}px`;
            item.style.top = `${topPos}px`;
            // Rozmiar już jest końcowy - nie zmieniaj go (został ustawiony w slideshow)
            item.style.opacity = '1';
            item.style.transform = 'scale(1)'; // Bez zmiany skali

            // Po zakończeniu animacji - zostaw zdjęcia w tych pozycjach (bez przejścia do grid)
            setTimeout(() => {
                item.classList.remove('animating');

                // Pokaż navbar i tekst pod zdjęciami po zakończeniu animacji ostatniego zdjęcia
                if (index === items.length - 1) {
                    setTimeout(() => {
                        const navbar = document.querySelector('.navbar');
                        if (navbar) {
                            navbar.classList.remove('hidden');
                        }
                        const introText = document.getElementById('intro-text-below-photos');
                        if (introText) {
                            introText.classList.remove('hidden');
                        }
                    }, 500);
                }
            }, 2500); // Czas trwania animacji
        }, index * 30); // Staggered delay - 30ms między każdym zdjęciem (płynniejsza animacja)
    });
}

// Load photos into chapter sections
function loadAllChapterPhotos() {
    const buildGalleryMarkup = (chapterId, photos) => {
        if (!photos.length) return '';

        const createImageMarkup = (photo, index) => {
            const highResSrc = photo.src.replace('800/600', '1600/1100');
            const caption = escapeHtml(photo.caption || '');
            const number = String(index + 1).padStart(2, '0');

            // Dla Balkans (dead-sea) i Namibia - eager loading, dla innych - lazy loading
            const isEagerLoading = chapterId === 'dead-sea' || chapterId === 'collections';
            const loadingAttr = isEagerLoading ? 'eager' : 'lazy';

            if (isEagerLoading) {
                // Dla Balkans i Namibia - bezpośrednie src, eager loading
                return `
                <img src="${photo.src}" 
                     alt="${caption}" 
                         loading="${loadingAttr}"
                     data-caption="${caption}"
                     data-full="${highResSrc}"
                     data-chapter="${chapterId}"
                     data-index="${index}">
                <figcaption class="project-caption">
                    <span class="project-caption-number">${number}</span>
                    <span class="project-caption-text">${caption || `Photo ${index + 1}`}</span>
                </figcaption>
            `;
            } else {
                // Dla innych albumów - lazy loading z optymalizacją
                return `
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E" 
                         data-src="${photo.src}"
                         alt="${caption}" 
                         loading="${loadingAttr}"
                         data-caption="${caption}"
                         data-full="${highResSrc}"
                         data-chapter="${chapterId}"
                         data-index="${index}"
                         class="lazy-optimized-image">
                    <figcaption class="project-caption">
                        <span class="project-caption-number">${number}</span>
                        <span class="project-caption-text">${caption || `Photo ${index + 1}`}</span>
                    </figcaption>
                `;
            }
        };

        // Random grid layout with CSS Grid
        // Shuffle photos array for random order
        const shuffledPhotos = [...photos];
        for (let i = shuffledPhotos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledPhotos[i], shuffledPhotos[j]] = [shuffledPhotos[j], shuffledPhotos[i]];
        }

        // Generate random width and height classes for each photo
        const widthClasses = ['w-1', 'w-2', 'w-3'];
        const heightClasses = ['h-1', 'h-2'];

        let markup = '';
        shuffledPhotos.forEach((photo, index) => {
            // Random width and height
            const widthClass = widthClasses[Math.floor(Math.random() * widthClasses.length)];
            const heightClass = heightClasses[Math.floor(Math.random() * heightClasses.length)];

            markup += `
                <figure class="gallery-item ${widthClass} ${heightClass}">
                    ${createImageMarkup(photo, index)}
                </figure>
            `;
        });

        return markup;
    };

    Object.keys(chapters).forEach(chapterId => {
        const chapter = chapters[chapterId];
        const photosContainer = document.getElementById(`${chapterId}-gallery`);

        if (photosContainer) {
            // Special handling for "Horizon" - Exploding Grid
            if (chapterId === 'horizon') {
                initExplodingGrid(chapterId, chapter.photos);
            } else if (chapterId === 'after-sun') {
                // Special grid layout for After The Sun: 3 rows x 6 columns
                photosContainer.innerHTML = buildAfterSunGallery(chapter.photos);
                initAfterSunReveal();
            } else {
                photosContainer.innerHTML = buildGalleryMarkup(chapterId, chapter.photos);
            }
        }

        // Special handling for "Hidden Tides" - sticky split layout
        if (chapterId === 'hidden-tides') {
            initHiddenTidesSection(chapter);
        }
    });

    initLightbox();
}

// Initialize "Hidden Tides" section with sticky split layout
function initHiddenTidesSection(chapter) {
    const contentGrid = document.getElementById('hidden-tides-content-grid');
    if (!contentGrid) return;

    // Descriptions for each photo - Korea album
    const descriptions = [
        "Seoul at night",
        "Doggy",
        "Graveyard",
        "Seoul at night v2",
        "Night club",
        "Mounteins",
        "Hive",
        "Shell",
        "Kim",
        "Last moment",
        "Jeju",
        "Jeju v2",
        "Pernikowa chałupa",
        "Life",
        "Busan",
        "Busan v2",
        "Busan v3",
        "Brush",
        "Emperor",
        "Emperor House",
        "Emperor v2",
        "Fashion",
        "Photo 23"
    ];

    // Photos that should NOT have hover effect (to prevent numbers from moving): 01, 06, 08, 11, 17, 21, 22
    const noHoverPhotos = [1, 6, 8, 11, 17, 21, 22];

    // Create pairs of white rectangular containers with images, numbers and descriptions
    let gridMarkup = '';
    for (let i = 0; i < chapter.photos.length; i += 2) {
        const photo1 = chapter.photos[i];
        const photo2 = chapter.photos[i + 1];

        const photoIndex1 = i + 1;
        const number1 = String(photoIndex1).padStart(2, '0');
        const description1 = descriptions[i] || photo1.caption || `Four years of studying design were finally coming to an end, David, Sasha, and I decided we needed a break...`;
        const fullImageUrl1 = photo1.src.replace('800/600', '1600/1100');
        const noHoverClass1 = noHoverPhotos.includes(photoIndex1) ? ' no-hover' : '';

        gridMarkup += `
            <div class="grid-item-pair">
                <div class="white-card${noHoverClass1}" data-full-image="${fullImageUrl1}" data-photo-index="${photoIndex1}">
                    <span class="item-number">${number1}</span>
                    <div class="item-image-container">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E" 
                             data-src="${photo1.src}" 
                             alt="${description1}" 
                             loading="lazy"
                             class="lazy-optimized-image">
                    </div>
                    <div class="white-card-content">
                        <div class="item-description">${escapeHtml(description1)}</div>
                    </div>
                </div>
        `;

        // Add second photo if exists
        if (photo2) {
            const photoIndex2 = i + 2;
            const number2 = String(photoIndex2).padStart(2, '0');
            const description2 = descriptions[i + 1] || photo2.caption || `Photo ${i + 2}`;
            const fullImageUrl2 = photo2.src.replace('800/600', '1600/1100');
            const noHoverClass2 = noHoverPhotos.includes(photoIndex2) ? ' no-hover' : '';

            gridMarkup += `
                <div class="white-card${noHoverClass2}" data-full-image="${fullImageUrl2}" data-photo-index="${photoIndex2}">
                    <span class="item-number">${number2}</span>
                    <div class="item-image-container">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E" 
                             data-src="${photo2.src}" 
                             alt="${description2}" 
                             loading="lazy"
                             class="lazy-optimized-image">
                    </div>
                    <div class="white-card-content">
                        <div class="item-description">${escapeHtml(description2)}</div>
                    </div>
                </div>
            `;
        }

        gridMarkup += `</div>`;
    }

    contentGrid.innerHTML = gridMarkup;

    // Add click handlers to all white-card elements to open lightbox
    const whiteCards = contentGrid.querySelectorAll('.white-card');
    whiteCards.forEach(card => {
        card.addEventListener('click', () => {
            const fullImageUrl = card.getAttribute('data-full-image');
            const photoIndex = parseInt(card.getAttribute('data-photo-index'), 10);
            const description = descriptions[photoIndex - 1] || '';
            const img = card.querySelector('img');
            const caption = description || (img ? img.alt : '');
            if (window.openLightbox && fullImageUrl) {
                window.openLightbox(fullImageUrl, caption);
            }
        });
    });

    // KLUCZOWE ODŚWIEŻENIE PO ZMIANIE DOM
    // Pierwsze odświeżenie - zaraz po wstawieniu HTML, aby ScrollTrigger przeliczył wysokość
    if (typeof ScrollTrigger !== 'undefined') {
        // Use requestAnimationFrame to ensure DOM is updated before refresh
        requestAnimationFrame(() => {
            ScrollTrigger.refresh();
        });

        // Drugie, opóźnione odświeżenie, aby dać czas przeglądarce na obliczenie wysokości
        // po załadowaniu niektórych elementów. Użycie setTimeout jest zalecane,
        // gdy treść dynamicznie zmienia wysokość.
        setTimeout(() => {
            ScrollTrigger.refresh();
        }, 500); // 500 ms (pół sekundy) to zazwyczaj wystarczająco dużo czasu
    }

    // Wait for images to load, then refresh ScrollTrigger again to recalculate positions
    // This ensures that ScrollTrigger for Namibia uses the correct height of Korea section
    // after all images are fully loaded and rendered
    const images = contentGrid.querySelectorAll('img');
    if (images.length > 0) {
        waitForImages(Array.from(images), () => {
            // After all images are loaded and rendered, refresh ScrollTrigger
            // This ensures the full height of Korea section is calculated correctly
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();
            }
        }, 5000);
    } else {
        // If no images, refresh immediately (shouldn't happen, but safety check)
        if (typeof ScrollTrigger !== 'undefined') {
            // Use setTimeout to allow browser to render the HTML first
            setTimeout(() => {
                ScrollTrigger.refresh();
            }, 100);
        }
    }
}

// Menu Modal
function initMenuModal() {
    const menuLink = document.querySelector('a[href="#menu"]');
    const modal = document.getElementById('menu-modal');
    const menuItems = modal.querySelectorAll('.menu-item');
    const albumsSection = document.getElementById('menu');

    if (menuLink) {
        menuLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Przewiń do sekcji z albumami
            if (albumsSection) {
                albumsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMenuModal();
        }
    });

    // Close modal on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeMenuModal();
        }
    });

    // Handle menu item clicks
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            closeMenuModal();
        });
    });
}

function closeMenuModal() {
    const modal = document.getElementById('menu-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Smooth scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Don't prevent default for menu modal
            if (targetId === '#menu') return;

            // Handle About modal
            if (targetId === '#about') {
                e.preventDefault();
                openAboutModal();
                return;
            }

            // Handle closing About modal when clicking Back
            if (targetId === '#home') {
                const aboutModal = document.getElementById('about-modal');
                if (aboutModal && aboutModal.classList.contains('active')) {
                    e.preventDefault();
                    closeAboutModal();
                    return;
                }
            }

            e.preventDefault();
            const target = document.querySelector(targetId);

            if (target) {
                const offset = 80;
                const targetPosition = target.offsetTop - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// About Modal Functions
function openAboutModal() {
    const modal = document.getElementById('about-modal');
    if (modal) {
        modal.classList.add('active');
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
}

function closeAboutModal() {
    const modal = document.getElementById('about-modal');
    if (modal) {
        modal.classList.remove('active');
        // Restore body scroll
        document.body.style.overflow = '';
    }
}


// Albums Preview Section
function initAlbumsPreview() {
    const albumsList = document.getElementById('albums-list');
    const hoverImage = document.getElementById('album-hover-image');

    if (!albumsList || !hoverImage) return;

    // Ustal kolejność albumów w skrótach, zgodną z kolejnością sekcji w HTML
    const previewOrder = [
        'people',        // Paris
        'europe',        // Europe
        'iceland',       // Iceland
        'lighthouse',    // Chicago
        'after-sun',     // Asia
        'hidden-tides',  // Korea
        'dead-sea',      // Balkans
        'closing',       // Philippines
        'horizon'        // Maroko
    ];

    let albumsMarkup = '';
    let currentIndex = 0;

    previewOrder.forEach((key) => {
        const chapter = chapters[key];
        if (!chapter) return;

        albumsMarkup += `
            <a href="#${key}" class="album-item" 
               data-album="${key}" 
               data-index="${currentIndex}">
                ${chapter.title} <span class="album-count">(${String(chapter.count).padStart(2, '0')})</span>
            </a>
        `;
        currentIndex += 1;
    });

    // Namibia na końcu - zgodnie z kolejnością sekcji w HTML
    albumsMarkup += `
        <a href="#horizontal-gallery-section" class="album-item" data-album="collections" data-index="${currentIndex}">
            Namibia <span class="album-count">(33)</span>
        </a>
    `;

    albumsList.innerHTML = albumsMarkup;

    // Funkcja do wyświetlania zdjęcia z płynnym przejściem
    function showAlbumImage(albumKey, smooth = true) {
        let firstPhoto;
        let albumTitle;

        // Obsługa Namibia (horizontal-gallery-section)
        if (albumKey === 'collections' || albumKey === 'horizontal-gallery-section') {
            if (!theCollectionsPhotos || theCollectionsPhotos.length === 0) return;
            firstPhoto = theCollectionsPhotos[0];
            albumTitle = 'Namibia';
        } else {
            const chapter = chapters[albumKey];
            if (!chapter || !chapter.photos.length) return;
            firstPhoto = chapter.photos[0];
            albumTitle = chapter.title;
        }

        const highResSrc = firstPhoto.src.replace('800/600', '1200/800');

        // Jeśli smooth, najpierw zniknij, potem zmień i pokaż
        if (smooth && hoverImage.style.opacity === '1') {
            // Fade out
            hoverImage.style.opacity = '0';

            setTimeout(() => {
                // Zmień zdjęcie
                const img = hoverImage.querySelector('img');
                if (img) {
                    img.src = highResSrc;
                    img.alt = albumTitle;
                } else {
                    hoverImage.innerHTML = `<img src="${highResSrc}" alt="${albumTitle}">`;
                }

                // Fade in
                hoverImage.style.opacity = '1';
            }, 150); // Szybsza animacja - połowa czasu transition (0.3s / 2)
        } else {
            // Natychmiastowa zmiana (dla pierwszego wyświetlenia)
            hoverImage.innerHTML = `<img src="${highResSrc}" alt="${albumTitle}">`;
            hoverImage.style.top = '50%';
            hoverImage.style.right = '5%';
            hoverImage.style.left = 'auto';
            hoverImage.style.transform = 'translateY(-50%)';
            hoverImage.style.opacity = '1';
            hoverImage.style.visibility = 'visible';
        }
    }

    // Wyświetl domyślnie zdjęcie z "People I Met By The Sea"
    const defaultAlbumKey = 'people';
    showAlbumImage(defaultAlbumKey, false);

    // Oznacz domyślny album jako active
    const defaultAlbumItem = albumsList.querySelector(`[data-album="${defaultAlbumKey}"]`);
    if (defaultAlbumItem) {
        defaultAlbumItem.classList.add('active');
    }

    // Track current hovered album
    let currentHoveredAlbum = defaultAlbumKey;
    let hoverTimeout = null;

    // Obsługa hover - pokazywanie zdjęcia po prawej stronie z płynnym przejściem
    const albumItems = albumsList.querySelectorAll('.album-item');

    albumItems.forEach((item) => {
        const albumKey = item.getAttribute('data-album');
        const chapter = chapters[albumKey];
        const isNamibia = albumKey === 'collections' || albumKey === 'horizontal-gallery-section';
        const hasPhotos = isNamibia ? (theCollectionsPhotos && theCollectionsPhotos.length > 0) : (chapter && chapter.photos.length > 0);

        if (hasPhotos) {
            item.addEventListener('mouseenter', () => {
                // Anuluj poprzedni timeout jeśli istnieje
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }

                // Usuń active z wszystkich
                albumItems.forEach(i => i.classList.remove('active'));

                // Dodaj active do aktualnego
                item.classList.add('active');

                // Zmień zdjęcie tylko jeśli to inny album
                if (albumKey !== currentHoveredAlbum) {
                    currentHoveredAlbum = albumKey;
                    showAlbumImage(albumKey, true);
                }
            });

            item.addEventListener('mouseleave', () => {
                // Nie wracaj do domyślnego - zostaw aktualne zdjęcie
                // Tylko usuń active jeśli to nie domyślny album
                if (item.getAttribute('data-album') !== defaultAlbumKey) {
                    // Opóźnij usunięcie active, żeby nie było migotania
                    hoverTimeout = setTimeout(() => {
                        if (currentHoveredAlbum === albumKey) {
                            item.classList.remove('active');
                            // Wróć do domyślnego tylko jeśli nie ma innego hover
                            const hasOtherHover = Array.from(albumItems).some(i =>
                                i !== item && i.matches(':hover')
                            );
                            if (!hasOtherHover) {
                                currentHoveredAlbum = defaultAlbumKey;
                                showAlbumImage(defaultAlbumKey, true);
                                if (defaultAlbumItem) {
                                    defaultAlbumItem.classList.add('active');
                                }
                            }
                        }
                    }, 100);
                }
            });
        }
    });
}

// Scroll-based album section with GSAP ScrollTrigger
function initScrollBasedAlbum() {
    // Register ScrollTrigger plugin
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const scrollWrapper = document.getElementById('scroll-wrapper');
    const textContainer = document.getElementById('people-text');
    const horizontalGallery = document.getElementById('horizontal-gallery');
    const albumSection = document.querySelector('.scroll-based-album');

    if (!scrollWrapper || !textContainer || !horizontalGallery || !albumSection) {
        return;
    }

    // Load photos
    const chapter = chapters['people'];
    if (!chapter || !chapter.photos.length) {
        return;
    }

    // Create photo elements - limit to 8 photos
    // Dla Paris - załaduj wszystkie obrazy od razu (eager loading) żeby nie skakały
    const photosToShow = chapter.photos.slice(0, 8);
    horizontalGallery.innerHTML = photosToShow.map((photo, index) => {
        return `
            <div class="gallery-photo-item" data-index="${index}">
                <img src="${photo.src}" 
                     alt="${photo.caption}" 
                     loading="eager">
            </div>
        `;
    }).join('');

    const photoItems = horizontalGallery.querySelectorAll('.gallery-photo-item');
    if (photoItems.length === 0) {
        return;
    }

    // Initially, photos are off-screen right, text is centered and visible
    // Initial position will be set by GSAP after calculating gallery width
    textContainer.style.transform = 'translate(-50%, -50%)';
    textContainer.style.opacity = '1';
    textContainer.style.visibility = 'visible';

    // Wait for images to load to get actual widths
    const images = horizontalGallery.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;

    const scheduleReinit = debounce(() => {
        initScrollTrigger();
    }, 200);

    if (!horizontalGallery.dataset.reinitBound) {
        images.forEach((img) => {
            img.addEventListener('load', scheduleReinit);
            img.addEventListener('error', scheduleReinit);
        });
        horizontalGallery.dataset.reinitBound = 'true';
    }

    function initScrollTrigger() {
        // Kill any existing ScrollTrigger for this element
        killScrollTriggers(scrollWrapper);
        killScrollTriggers(albumSection);

        // Safari compatibility: Ensure elements are visible and have dimensions
        if (horizontalGallery.offsetWidth === 0 || horizontalGallery.offsetHeight === 0) {
            console.warn('Paris gallery has zero dimensions, retrying...');
            setTimeout(initScrollTrigger, 100);
            return;
        }

        // Force layout recalculation - Safari compatible
        void horizontalGallery.offsetHeight;

        // Calculate actual total width of gallery (no gaps - photos edge to edge)
        let totalGalleryWidth = 0;
        photoItems.forEach((item) => {
            const width = item.offsetWidth;
            if (width > 0) {
                totalGalleryWidth += width;
            } else {
                // Fallback: use image natural width or min-width
                const img = item.querySelector('img');
                if (img && img.complete && img.naturalWidth) {
                    const aspectRatio = img.naturalHeight / img.naturalWidth;
                    const itemHeight = window.innerHeight * 0.45; // 45vh
                    const itemWidth = itemHeight / aspectRatio;
                    totalGalleryWidth += itemWidth;
                } else {
                    totalGalleryWidth += 300; // min-width fallback
                }
            }
        });

        // Ensure gallery is wider than viewport
        const viewportWidth = window.innerWidth;
        const galleryWidth = Math.max(viewportWidth + 100, totalGalleryWidth);
        horizontalGallery.style.width = `${galleryWidth}px`;

        // Force another layout - Safari compatible
        void horizontalGallery.offsetHeight;

        // Recalculate after setting width
        totalGalleryWidth = 0;
        photoItems.forEach((item) => {
            totalGalleryWidth += item.offsetWidth || 300;
        });
        const finalGalleryWidth = Math.max(viewportWidth + 100, totalGalleryWidth);
        horizontalGallery.style.width = `${finalGalleryWidth}px`;

        // Calculate scroll distance needed to show all photos
        // Gallery must move from completely off-screen (right) to show last photo fully visible
        // Start position: gallery is completely off-screen to the right
        // End position: last photo is fully visible (gallery moved left by its full width minus viewport)
        const galleryOffset = finalGalleryWidth - viewportWidth; // How much gallery needs to move
        const extraDistance = viewportWidth * 0.8; // Add 80% of viewport width as buffer - more white space after album
        const startX = viewportWidth; // gallery starts fully off-screen to the right
        const finalXPosition = -(galleryOffset + extraDistance); // ensure last photo + buffer are visible
        const scrollDistance = Math.abs(finalXPosition - startX); // match actual travel distance

        gsap.set(horizontalGallery, { x: startX });

        // Create GSAP timeline for horizontal scroll with parallax effect
        // Safari compatibility: removed anticipatePin and invalidateOnRefresh
        const horizontalScroll = gsap.timeline({
            scrollTrigger: {
                trigger: scrollWrapper, // Pin this wrapper element
                start: 'top top', // START PIN: When top of wrapper reaches top of viewport
                end: () => `+=${scrollDistance}`, // END PIN: After scrolling through horizontal distance
                pin: scrollWrapper, // Pin the wrapper - stops vertical scroll temporarily
                scrub: 1, // Smooth scrubbing (1 second lag for smooth animation)
                markers: false
            }
        });

        // Animate horizontal gallery from completely off-screen (right) to show all photos
        // Start: x = viewportWidth (gallery completely off-screen to the right)
        // End: x = -(galleryOffset + extraDistance) (last photo fully visible with extra buffer)
        horizontalScroll.to(horizontalGallery, {
            x: finalXPosition, // Move from viewportWidth to finalXPosition (all photos visible, last one fully)
            ease: 'none' // Linear animation - directly tied to scroll position
        });

        // Parallax effect: Text moves slightly slower than gallery
        // Creates depth effect as photos slide over text
        horizontalScroll.to(textContainer, {
            x: '-10%', // Text moves slightly left as gallery slides in
            opacity: 0.7, // Text fades slightly as photos cover it
            ease: 'none'
        }, 0); // Start at same time as gallery animation

        // Refresh ScrollTrigger after setup
        ScrollTrigger.refresh();
    }

    // Użyj ulepszonej funkcji waitForImages z lepszą obsługą błędów
    waitForImages(images, initScrollTrigger, 3000);

    // Refresh ScrollTrigger on resize - użyj debounce
    window.addEventListener('resize', debounce(() => {
        ScrollTrigger.refresh();
    }, 250));
}

// Scroll-based album section for Europe - animation from left side (opposite of Paris)
function initEuropeScrollAlbum() {
    // Register ScrollTrigger plugin
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const scrollWrapper = document.getElementById('europe-scroll-wrapper');
    const textContainer = document.getElementById('europe-text');
    const horizontalGallery = document.getElementById('europe-horizontal-gallery');
    const albumSection = document.querySelector('#europe.scroll-based-album');

    if (!scrollWrapper || !textContainer || !horizontalGallery || !albumSection) {
        return;
    }

    // Load photos
    const chapter = chapters['europe'];
    if (!chapter || !chapter.photos.length) {
        return;
    }

    // Create photo elements - ALL photos from album (22 photos)
    // Dla Europe - załaduj wszystkie obrazy od razu (eager loading) żeby nie skakały
    horizontalGallery.innerHTML = chapter.photos.map((photo, index) => {
        return `
            <div class="gallery-photo-item" data-index="${index}">
                <img src="${photo.src}" 
                     alt="${photo.caption}" 
                     loading="eager">
            </div>
        `;
    }).join('');

    const photoItems = horizontalGallery.querySelectorAll('.gallery-photo-item');
    if (photoItems.length === 0) {
        return;
    }

    // Initially, photos are off-screen left, text is centered and visible
    textContainer.style.transform = 'translate(-50%, -50%)';
    textContainer.style.opacity = '1';
    textContainer.style.visibility = 'visible';

    // Wait for images to load to get actual widths
    const images = horizontalGallery.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;

    const scheduleReinit = debounce(() => {
        initScrollTrigger();
    }, 200);

    if (!horizontalGallery.dataset.reinitBound) {
        images.forEach((img) => {
            img.addEventListener('load', scheduleReinit);
            img.addEventListener('error', scheduleReinit);
        });
        horizontalGallery.dataset.reinitBound = 'true';
    }

    function initScrollTrigger() {
        // Kill any existing ScrollTrigger for this element
        killScrollTriggers(scrollWrapper);
        killScrollTriggers(albumSection);

        // Safari compatibility: Ensure elements are visible and have dimensions
        if (horizontalGallery.offsetWidth === 0 || horizontalGallery.offsetHeight === 0) {
            console.warn('Europe gallery has zero dimensions, retrying...');
            setTimeout(initScrollTrigger, 100);
            return;
        }

        // Force layout recalculation - Safari compatible
        void horizontalGallery.offsetHeight;

        // Calculate actual total width of gallery
        let totalGalleryWidth = 0;
        photoItems.forEach((item) => {
            const width = item.offsetWidth;
            if (width > 0) {
                totalGalleryWidth += width;
            } else {
                const img = item.querySelector('img');
                if (img && img.complete && img.naturalWidth) {
                    const aspectRatio = img.naturalHeight / img.naturalWidth;
                    const itemHeight = window.innerHeight * 0.45;
                    const itemWidth = itemHeight / aspectRatio;
                    totalGalleryWidth += itemWidth;
                } else {
                    totalGalleryWidth += 300;
                }
            }
        });

        const viewportWidth = window.innerWidth;
        const galleryWidth = Math.max(viewportWidth + 100, totalGalleryWidth);
        horizontalGallery.style.width = `${galleryWidth}px`;

        // Force layout - Safari compatible
        void horizontalGallery.offsetHeight;

        totalGalleryWidth = 0;
        photoItems.forEach((item) => {
            totalGalleryWidth += item.offsetWidth || 300;
        });
        const finalGalleryWidth = Math.max(viewportWidth + 100, totalGalleryWidth);
        horizontalGallery.style.width = `${finalGalleryWidth}px`;

        // Calculate scroll distance needed to show all 22 photos - EXACTLY SAME FORMULA AS PARIS
        // Gallery must move from completely off-screen (left) to show last photo fully visible
        // Start position: gallery is completely off-screen to the left (x = -finalGalleryWidth)
        // End position: last photo is fully visible (gallery moved right)
        const galleryOffset = finalGalleryWidth - viewportWidth; // How much gallery needs to move
        const extraDistance = viewportWidth * 0.8; // Add 80% of viewport width as buffer - SAME AS PARIS
        const startX = -finalGalleryWidth; // gallery starts fully off-screen to the left
        const finalXPosition = viewportWidth - extraDistance; // mirror Paris: stop once last photo + buffer are visible
        const scrollDistance = Math.abs(finalXPosition - startX); // match actual travel distance

        gsap.set(horizontalGallery, { x: startX });

        // Create GSAP timeline for horizontal scroll with parallax effect - EXACTLY SAME STRUCTURE AS PARIS
        // Safari compatibility: removed anticipatePin and invalidateOnRefresh
        const horizontalScroll = gsap.timeline({
            scrollTrigger: {
                trigger: scrollWrapper, // Pin this wrapper element
                start: 'top top', // START PIN: When top of wrapper reaches top of viewport
                end: () => `+=${scrollDistance}`, // END PIN: After scrolling through horizontal distance
                pin: scrollWrapper, // Pin the wrapper - stops vertical scroll temporarily
                scrub: 1, // Smooth scrubbing (1 second lag for smooth animation) - SAME AS PARIS
                markers: false
            }
        });

        horizontalScroll.to(horizontalGallery, {
            x: finalXPosition, // Move from -finalGalleryWidth to finalXPosition (all photos visible, last one fully with buffer)
            ease: 'none' // Linear animation - directly tied to scroll position
        });

        // Parallax effect: Text moves slightly (opposite direction of Paris)
        // Creates depth effect as photos slide over text
        horizontalScroll.to(textContainer, {
            x: '10%', // Text moves slightly right as gallery slides in (opposite of Paris which moves left)
            opacity: 0.7, // Text fades slightly as photos cover it
            ease: 'none'
        }, 0); // Start at same time as gallery animation

        ScrollTrigger.refresh();
    }

    // Użyj ulepszonej funkcji waitForImages z lepszą obsługą błędów - SAME AS PARIS
    waitForImages(images, initScrollTrigger, 3000);

    // Refresh ScrollTrigger on resize - użyj debounce - SAME AS PARIS
    window.addEventListener('resize', debounce(() => {
        ScrollTrigger.refresh();
    }, 250));
}

// Split gallery switcher
function initSwitchGallery() {
    // Special handling for Chicago gallery - generate all frames dynamically
    const chicagoLeft = document.getElementById('chicago-left');
    const chicagoRight = document.getElementById('chicago-right');

    if (chicagoLeft && chicagoRight) {
        const chicagoChapter = chapters['lighthouse'];
        if (chicagoChapter && chicagoChapter.photos.length > 0) {
            const photos = chicagoChapter.photos;
            const halfCount = Math.ceil(photos.length / 2);

            // Left half: first half of photos
            let leftMarkup = '';
            for (let i = 0; i < halfCount; i++) {
                const largePhoto = photos[i];
                const smallPhoto = photos[(i + 1) % photos.length]; // Next photo, wrap around
                leftMarkup += `
                    <div class="switch-frame ${i === 0 ? 'active' : ''}">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E" 
                             data-src="${largePhoto.src}" 
                             alt="Chicago ${i + 1}" 
                             class="switch-image-large lazy-optimized-image">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E" 
                             data-src="${smallPhoto.src}" 
                             alt="Chicago ${(i + 1) % photos.length + 1}" 
                             class="switch-image-small lazy-optimized-image">
                    </div>
                `;
            }
            chicagoLeft.innerHTML = leftMarkup;

            // Right half: second half of photos
            let rightMarkup = '';
            for (let i = halfCount; i < photos.length; i++) {
                const largePhoto = photos[i];
                const smallPhoto = photos[(i + 1) % photos.length]; // Next photo, wrap around
                rightMarkup += `
                    <div class="switch-frame ${i === halfCount ? 'active' : ''}">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E" 
                             data-src="${largePhoto.src}" 
                             alt="Chicago ${i + 1}" 
                             class="switch-image-large lazy-optimized-image">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E" 
                             data-src="${smallPhoto.src}" 
                             alt="Chicago ${(i + 1) % photos.length + 1}" 
                             class="switch-image-small lazy-optimized-image">
                    </div>
                `;
            }
            chicagoRight.innerHTML = rightMarkup;
        }
    }

    // Initialize switch gallery for all halves
    const halves = document.querySelectorAll('.switch-half');
    if (!halves.length) return;

    halves.forEach((half) => {
        const frames = Array.from(half.querySelectorAll('.switch-frame'));
        if (!frames.length) return;

        const showFrame = (index) => {
            frames.forEach((frame, i) => {
                if (i === index) {
                    frame.classList.add('active');
                } else {
                    frame.classList.remove('active');
                }
            });
            half.dataset.currentIndex = String(index);
        };

        // Ensure first frame visible
        showFrame(0);

        // Click handler
        half.addEventListener('click', () => {
            const currentIndex = parseInt(half.dataset.currentIndex || '0', 10);
            const nextIndex = (currentIndex + 1) % frames.length;
            showFrame(nextIndex);
        });

        // Auto-advance through all frames
        let autoAdvanceInterval = setInterval(() => {
            const currentIndex = parseInt(half.dataset.currentIndex || '0', 10);
            const nextIndex = (currentIndex + 1) % frames.length;
            showFrame(nextIndex);
        }, 3000); // Change every 3 seconds

        // Pause on hover
        half.addEventListener('mouseenter', () => {
            clearInterval(autoAdvanceInterval);
        });

        half.addEventListener('mouseleave', () => {
            autoAdvanceInterval = setInterval(() => {
                const currentIndex = parseInt(half.dataset.currentIndex || '0', 10);
                const nextIndex = (currentIndex + 1) % frames.length;
                showFrame(nextIndex);
            }, 3000);
        });
    });
}

// Lightbox for project gallery images
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const imageEl = lightbox.querySelector('img');
    const captionEl = lightbox.querySelector('.lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const backdrop = lightbox.querySelector('.lightbox-backdrop');

    let currentGallery = null;
    let currentIndex = 0;

    const openLightbox = (src, caption, gallery = null, index = 0) => {
        imageEl.src = src;
        imageEl.alt = caption;
        captionEl.textContent = caption;
        lightbox.classList.add('visible');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        lightbox.classList.remove('visible');
        imageEl.src = '';
        captionEl.textContent = '';
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    if (!lightbox.dataset.bound) {
        closeBtn.addEventListener('click', closeLightbox);
        backdrop.addEventListener('click', closeLightbox);

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && lightbox.classList.contains('visible')) {
                closeLightbox();
            }
        });
        lightbox.dataset.bound = 'true';
    }

    // Export openLightbox for use in other functions
    window.openLightbox = openLightbox;

    const galleryImages = document.querySelectorAll('.project-gallery img');
    galleryImages.forEach((img) => {
        // Skip After The Sun images - they have their own click handler
        if (img.closest('#after-sun-gallery')) {
            return;
        }

        if (img.dataset.lightboxBound === 'true') return;

        img.addEventListener('click', () => {
            const fullSrc = img.dataset.full || img.src;
            const caption = img.dataset.caption || img.alt || '';
            openLightbox(fullSrc, caption);
        });

        img.dataset.lightboxBound = 'true';
    });
}

// Horizontal Gallery - CONTROLLED ASYMMETRY LAYOUT
// Panel 0: solo img_7777 (dominant, centered)
// Other panels: exactly 3 photos, asymmetric, no overlap, no rotation
const numPanels = Math.ceil((theCollectionsPhotos.length - 1) / 3) + 1; // +1 for solo panel
const horizontalAlbums = [];

// Elegancka paleta kolorów luksusowego albumu fotograficznego dla Namibia
// Rotacja między: Czysta Biel, Kremowy Beż (Ecru), Jasna Szarość, Głęboka Czerń
const bgColors = [
    "bg-luxury-white",      // Czysta Biel
    "bg-luxury-ecru",       // Kremowy Beż (Ecru)
    "bg-luxury-light-gray", // Jasna Szarość
    "bg-luxury-white",      // Czysta Biel
    "bg-luxury-deep-black", // Głęboka Czerń - kontrast
    "bg-luxury-ecru",       // Kremowy Beż
    "bg-luxury-light-gray", // Jasna Szarość
    "bg-luxury-white",      // Czysta Biel
    "bg-luxury-ecru",       // Kremowy Beż
    "bg-luxury-light-gray"  // Jasna Szarość
];
const textColors = [
    "text-luxury-dark",     // Grafitowy/Czarny font
    "text-luxury-dark",
    "text-luxury-dark",
    "text-luxury-dark",
    "text-luxury-light",    // Jasny tekst na ciemnym tle
    "text-luxury-dark",
    "text-luxury-dark",
    "text-luxury-dark",
    "text-luxury-dark",
    "text-luxury-dark"
];

for (let i = 0; i < numPanels; i++) {
    horizontalAlbums.push({
        id: i + 1,
        title: `Namibia ${String(i + 1).padStart(2, '0')}`,
        bgColor: bgColors[i % bgColors.length],
        textColor: textColors[i % textColors.length],
        images: []
    });
}

// Fill images: Panel 0 = solo img_7777, rest = 3 photos per panel (controlled asymmetry)
horizontalAlbums.forEach((album, index) => {
    if (index === 0) {
        // First panel: solo img_7777
        album.images = [theCollectionsPhotos[0]?.src].filter(Boolean);
    } else {
        // Other panels: exactly 3 photos
        const startIndex = 1 + (index - 1) * 3;
        const endIndex = Math.min(startIndex + 3, theCollectionsPhotos.length);
        album.images = theCollectionsPhotos.slice(startIndex, endIndex).map(photo => photo.src);

        // If we don't have enough photos for the last panel, pad with existing ones
        if (album.images.length < 3 && theCollectionsPhotos.length > 0) {
            while (album.images.length < 3) {
                album.images.push(theCollectionsPhotos[album.images.length % theCollectionsPhotos.length].src);
            }
        }
    }
});

function initHorizontalGallery() {
    console.log('[Namibia] Starting initialization...');

    // Create debug info element for Safari - make it more visible
    const debugInfo = document.createElement('div');
    debugInfo.id = 'namibia-debug';
    debugInfo.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.9); color: #00ff00; padding: 15px; z-index: 99999; font-size: 14px; max-width: 400px; max-height: 500px; font-family: monospace; border: 2px solid #00ff00; overflow-y: auto; box-shadow: 0 0 20px rgba(0,255,0,0.5);';
    debugInfo.innerHTML = '<strong style="color: #00ff00; font-size: 16px;">🔍 NAMIBIA DEBUG</strong><br>Initializing...';
    document.body.appendChild(debugInfo);

    // Also log to console for easier access
    console.log('%c🔍 NAMIBIA DEBUG PANEL', 'color: #00ff00; font-size: 20px; font-weight: bold;');
    console.log('Look for the green debug panel in the top-right corner of the page');

    const updateDebug = (msg) => {
        if (debugInfo) {
            debugInfo.innerHTML += '<br>' + msg;
            debugInfo.scrollTop = debugInfo.scrollHeight;
        }
    };

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        // GSAP or ScrollTrigger not loaded
        const errorMsg = 'GSAP or ScrollTrigger not loaded';
        console.error('[Namibia] ' + errorMsg);
        updateDebug('<span style="color: red;">ERROR: ' + errorMsg + '</span>');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const wrapper = document.getElementById('horizontal-gallery-wrapper');
    const container = document.getElementById('horizontal-gallery-container');
    const section = document.getElementById('horizontal-gallery-section');

    const elementsFound = {
        wrapper: !!wrapper,
        container: !!container,
        section: !!section
    };
    console.log('[Namibia] Elements found:', elementsFound);
    updateDebug('Elements: W=' + (wrapper ? '✓' : '✗') + ' C=' + (container ? '✓' : '✗') + ' S=' + (section ? '✓' : '✗'));

    if (!wrapper || !container || !section) {
        // Horizontal gallery elements not found
        const errorMsg = 'Gallery elements not found';
        console.error('[Namibia] ' + errorMsg, elementsFound);
        updateDebug('<span style="color: red;">ERROR: ' + errorMsg + '</span>');
        return;
    }

    // Check if horizontalAlbums is populated
    const albumsCount = horizontalAlbums?.length || 0;
    console.log('[Namibia] horizontalAlbums:', albumsCount);
    updateDebug('Albums: ' + albumsCount);
    if (!horizontalAlbums || horizontalAlbums.length === 0) {
        const errorMsg = 'horizontalAlbums is empty';
        console.error('[Namibia] ' + errorMsg);
        updateDebug('<span style="color: red;">ERROR: ' + errorMsg + '</span>');
        return;
    }

    // Build HTML for albums - CONTROLLED ASYMMETRY LAYOUT
    // Panel 0: solo img_7777 (dominant, centered, large)
    // Other panels: 3 photos, asymmetric positioning, NO overlap, NO rotation
    const albumsHTML = horizontalAlbums.map((album, panelIndex) => {
        let photosHTML = '';

        if (panelIndex === 0) {
            // First panel: solo img_7777 - large, dominant, centered
            // Can fill most of screen with minimal margins or edge-to-edge
            photosHTML = `
                <div class="horizontal-album-image-item solo-image" style="
                    position: absolute;
                    left: 5%;
                    top: 5%;
                    width: 90%;
                    height: 90%;
                    z-index: 1;
                ">
                    <img src="${album.images[0]}" 
                         alt="img_7777" 
                         loading="eager" 
                         data-full="${album.images[0]}" 
                         data-caption="img_7777" 
                         style="object-fit: contain; width: 100%; height: 100%; object-position: center;">
                </div>
            `;
        } else if (album.images.length >= 3) {
            // Other panels: 3 photos with controlled asymmetry
            // One main (large, 60-70% width), two smaller, asymmetric placement, NO overlap

            // Asymmetric layout patterns - main photo + 2 smaller, no overlap
            // Increased sizes, especially for vertical photos
            const layoutPatterns = [
                // Pattern 1: Main center-wide, small left-bottom, medium right-top
                {
                    main: { left: '10%', top: '15%', width: '75%', height: '70%' },
                    small1: { left: '3%', top: '60%', width: '30%', height: '35%' },
                    small2: { left: '67%', top: '8%', width: '30%', height: '40%' }
                },
                // Pattern 2: Main left-wide, small right-top, medium right-bottom
                {
                    main: { left: '3%', top: '12%', width: '70%', height: '75%' },
                    small1: { left: '75%', top: '5%', width: '22%', height: '35%' },
                    small2: { left: '75%', top: '45%', width: '22%', height: '40%' }
                },
                // Pattern 3: Main right-wide, small left-top, medium left-bottom
                {
                    main: { left: '27%', top: '15%', width: '70%', height: '70%' },
                    small1: { left: '3%', top: '8%', width: '22%', height: '38%' },
                    small2: { left: '3%', top: '50%', width: '22%', height: '40%' }
                },
                // Pattern 4: Main center-top, small left-bottom, medium right-bottom
                {
                    main: { left: '15%', top: '8%', width: '70%', height: '65%' },
                    small1: { left: '5%', top: '65%', width: '35%', height: '30%' },
                    small2: { left: '60%', top: '65%', width: '35%', height: '30%' }
                },
                // Pattern 5: Main left-center, small right-top, medium right-center
                {
                    main: { left: '5%', top: '20%', width: '68%', height: '65%' },
                    small1: { left: '75%', top: '5%', width: '20%', height: '33%' },
                    small2: { left: '75%', top: '45%', width: '20%', height: '43%' }
                }
            ];

            // Check if this panel contains img_7868, img_7871, img_7872 - special layout
            const hasSpecialPhotos = album.images.some(img =>
                img.includes('img_7868') || img.includes('img_7871') || img.includes('img_7872')
            );

            // Check if this is the last panel - increase container sizes for better vertical photo display
            const isLastPanel = panelIndex === horizontalAlbums.length - 1;

            let layout;
            if (hasSpecialPhotos) {
                // Special layout for img_7868, img_7871, img_7872 - larger side photos:
                // Main photo centered-top (large, vertical), two larger photos bottom-left and bottom-right
                // Adjusted heights to accommodate vertical photos better
                layout = {
                    main: { left: '5%', top: '3%', width: '90%', height: '60%' },
                    small1: { left: '2%', top: '65%', width: '48%', height: '32%' },
                    small2: { left: '50%', top: '65%', width: '48%', height: '32%' }
                };
            } else {
                layout = layoutPatterns[(panelIndex - 1) % layoutPatterns.length];
            }

            // On last panel, increase container sizes so photos take up more space
            if (isLastPanel && !hasSpecialPhotos) {
                // Increase all sizes by ~30-40%
                layout = {
                    main: {
                        left: layout.main.left,
                        top: layout.main.top,
                        width: Math.min(parseFloat(layout.main.width) * 1.35, 95) + '%',
                        height: Math.min(parseFloat(layout.main.height) * 1.35, 85) + '%'
                    },
                    small1: {
                        left: layout.small1.left,
                        top: layout.small1.top,
                        width: Math.min(parseFloat(layout.small1.width) * 1.4, 50) + '%',
                        height: Math.min(parseFloat(layout.small1.height) * 1.4, 50) + '%'
                    },
                    small2: {
                        left: layout.small2.left,
                        top: layout.small2.top,
                        width: Math.min(parseFloat(layout.small2.width) * 1.4, 50) + '%',
                        height: Math.min(parseFloat(layout.small2.height) * 1.4, 50) + '%'
                    }
                };
            }

            // Always use contain to preserve aspect ratios (vertical photos stay vertical)
            const objectFit = 'contain';

            // Main photo (largest, 60-70% width)
            photosHTML += `
                <div class="horizontal-album-image-item asymmetric-main" style="
                    position: absolute;
                    left: ${layout.main.left};
                    top: ${layout.main.top};
                    width: ${layout.main.width};
                    height: ${layout.main.height};
                    z-index: 1;
                ">
                    <img src="${album.images[0]}" 
                         alt="${album.title} - Main" 
                         loading="eager" 
                         data-full="${album.images[0]}" 
                         data-caption="${album.title} - Main" 
                         style="object-fit: ${objectFit}; width: 100%; height: 100%; object-position: center;">
                </div>
            `;

            // Small photo 1
            photosHTML += `
                <div class="horizontal-album-image-item asymmetric-small" style="
                    position: absolute;
                    left: ${layout.small1.left};
                    top: ${layout.small1.top};
                    width: ${layout.small1.width};
                    height: ${layout.small1.height};
                    z-index: 1;
                ">
                    <img src="${album.images[1]}" 
                         alt="${album.title} - Image 2" 
                         loading="eager" 
                         data-full="${album.images[1]}" 
                         data-caption="${album.title} - Image 2" 
                         style="object-fit: ${objectFit}; width: 100%; height: 100%; object-position: center;">
                </div>
            `;

            // Small photo 2
            photosHTML += `
                <div class="horizontal-album-image-item asymmetric-small" style="
                    position: absolute;
                    left: ${layout.small2.left};
                    top: ${layout.small2.top};
                    width: ${layout.small2.width};
                    height: ${layout.small2.height};
                    z-index: 1;
                ">
                    <img src="${album.images[2]}" 
                         alt="${album.title} - Image 3" 
                         loading="eager" 
                         data-full="${album.images[2]}" 
                         data-caption="${album.title} - Image 3" 
                         style="object-fit: ${objectFit}; width: 100%; height: 100%; object-position: center;">
                </div>
            `;
        }

        return `
            <div class="horizontal-album-panel ${album.bgColor} ${album.textColor}" data-album-id="${album.id}">
                <div class="horizontal-album-images asymmetric-container">
                    ${photosHTML}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="horizontal-gallery-intro">
            <h1>Namibia</h1>
            <div class="namibia-stamp">
                <img src="poststamp/13-stamp-jetty-01-import-simmentaler-carola-kronsbein-goldbeck-1993-web-2.png" alt="Namibia stamp">
            </div>
        </div>
        ${albumsHTML}
    `;

    const htmlLength = container.innerHTML.length;
    console.log('[Namibia] HTML inserted, container.innerHTML length:', htmlLength);
    updateDebug('HTML inserted: ' + htmlLength + ' chars');

    // Remove any text elements from panels (no descriptions, no titles)
    const panels = container.querySelectorAll('.horizontal-album-panel');
    console.log('[Namibia] Panels found:', panels.length);
    updateDebug('Panels: ' + panels.length);
    panels.forEach(panel => {
        // Remove header if exists
        const header = panel.querySelector('.horizontal-album-header');
        if (header) header.remove();
        // Remove number if exists
        const number = panel.querySelector('.horizontal-album-number');
        if (number) number.remove();
    });

    // Wait for images to load
    const images = container.querySelectorAll('img');
    let loadedCount = 0;
    const totalImages = images.length;
    console.log('[Namibia] Total images to load:', totalImages);
    updateDebug('Images to load: ' + totalImages);

    function initScrollTrigger() {
        console.log('[Namibia] initScrollTrigger called');
        updateDebug('initScrollTrigger called');

        // Kill existing triggers
        ScrollTrigger.getAll().forEach(trigger => {
            if (trigger.trigger === wrapper || trigger.trigger === section) {
                trigger.kill();
            }
        });

        const albumPanels = container.querySelectorAll('.horizontal-album-panel');
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const dims = {
            albumPanels: albumPanels.length,
            viewportWidth,
            viewportHeight,
            containerWidth: container.offsetWidth,
            containerHeight: container.offsetHeight,
            wrapperWidth: wrapper.offsetWidth,
            wrapperHeight: wrapper.offsetHeight,
            sectionWidth: section.offsetWidth,
            sectionHeight: section.offsetHeight
        };
        console.log('[Namibia] Dimensions:', dims);
        updateDebug('Dims: CW=' + dims.containerWidth + ' CH=' + dims.containerHeight + ' SH=' + dims.sectionHeight);

        // Safari compatibility: Ensure panels are visible
        if (albumPanels.length === 0) {
            const errorMsg = 'No album panels found, retrying...';
            console.error('[Namibia] ' + errorMsg);
            updateDebug('<span style="color: orange;">WARNING: ' + errorMsg + '</span>');
            setTimeout(initScrollTrigger, 100);
            return;
        }

        // Each panel is 100vw, intro is also 100vw
        // Total: intro (100vw) + 5 albums (5 * 100vw) = 6 * 100vw
        const introWidth = viewportWidth;
        const albumWidth = viewportWidth;
        const totalWidth = introWidth + (albumPanels.length * albumWidth);

        // Safari compatibility: Force layout recalculation
        void container.offsetWidth;

        // Calculate how much to move
        // Start at 0 (intro visible), end at position where last card is fully visible
        // Moving container left (negative x) makes cards appear to move right
        // IMPORTANT: Last card should be fully visible at the end (same size as others - 100vw)
        // 
        // Last card starts at position: totalWidth - viewportWidth (left edge of last card in container)
        // To show last card fully: we need to move container so last card is fully visible
        // Last card width = viewportWidth (100vw, same as all other cards)
        // 
        // When container is at x: 0, intro is visible
        // When container is at x: -(totalWidth - viewportWidth), last card's left edge is at viewport left edge
        // But we want last card fully visible, so we move slightly less to show it with white space
        // 
        // To show last card fully with white space after:
        // Move container to: -(totalWidth - viewportWidth) + small buffer
        // Calculate moveDistance so last card is fully visible at the end
        // Last card starts at: totalWidth - viewportWidth (left edge position in container)
        // Last card width = viewportWidth (100vw, same as all other cards)
        // 
        // To show last card FULLY: move container so last card's left edge is at viewport left edge
        // This means: moveDistance = totalWidth - viewportWidth (last card 100% visible, no white space)
        // 
        // User wants last card to reach the end, so we use baseMoveDistance directly
        // This will show last card fully visible (100% of card visible)
        const moveDistance = totalWidth - viewportWidth; // Last card fully visible (100% visible, no white space)

        // Calculate scroll distance - EXACTLY SAME FORMULA AS PARIS AND EUROPE
        // Gallery must move from start to end position
        // Add extra distance to ensure last card is fully visible and show white space after
        const galleryOffset = moveDistance; // How much container needs to move (same as moveDistance)
        const extraDistance = viewportWidth * 0.8; // Add 80% of viewport width as buffer - SAME AS PARIS
        const scrollDistance = galleryOffset + extraDistance; // Same scroll speed as Paris

        // DO NOT set wrapper or section height manually - let ScrollTrigger manage it automatically
        // This is exactly how Paris and Europe work - ScrollTrigger handles height via pin-spacer

        // Safari compatibility: Ensure container has proper width
        container.style.width = `${totalWidth}px`;

        const widthInfo = {
            totalWidth,
            containerWidth: container.style.width,
            actualWidth: container.offsetWidth
        };
        console.log('[Namibia] Container width set:', widthInfo);
        updateDebug('Width: TW=' + totalWidth + ' AW=' + container.offsetWidth);

        // Safari compatibility: Force layout recalculation after setting width
        void container.offsetWidth;

        // Safari compatibility: Verify container has dimensions after setting width
        if (container.offsetWidth === 0) {
            const errorMsg = 'Container has zero width after setting';
            console.error('[Namibia] ' + errorMsg, widthInfo);
            updateDebug('<span style="color: red;">ERROR: ' + errorMsg + '</span>');
            setTimeout(initScrollTrigger, 200);
            return;
        }

        // Safari compatibility: Ensure container is visible and positioned correctly
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        container.style.left = '0';
        container.style.position = 'relative';

        // Set initial position - start with intro visible (x: 0)
        // SAME APPROACH AS PARIS AND EUROPE - simple initial position setting
        gsap.set(container, { x: 0 });

        // Create ScrollTrigger - EXACTLY SAME AS PARIS AND EUROPE
        // No callbacks, no special handling - just simple ScrollTrigger
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: wrapper, // Pin this wrapper element (SAME AS PARIS/EUROPE)
                start: 'top top', // START PIN: When top of wrapper reaches top of viewport
                end: () => `+=${scrollDistance}`, // END PIN: After scrolling through horizontal distance
                pin: wrapper, // Pin the wrapper - stops vertical scroll temporarily
                scrub: 1, // Smooth scrubbing (1 second lag for smooth animation)
                markers: false
            }
        });

        // Animate horizontal movement - container moves left, cards appear to move right
        // Start: x = 0 (intro visible), End: x = -moveDistance (last card fully visible)
        // extraDistance is only for scrollDistance (scroll length), not for final position
        timeline.to(container, {
            x: -moveDistance, // Move from 0 to -moveDistance (last card fully visible)
            ease: 'none' // Linear animation - directly tied to scroll position
        });

        // Refresh ScrollTrigger after setup
        ScrollTrigger.refresh();
    }

    if (totalImages === 0) {
        console.log('[Namibia] No images to load, initializing ScrollTrigger immediately');
        setTimeout(initScrollTrigger, 200);
    } else {
        let allLoaded = false;
        const checkAndInit = () => {
            if (!allLoaded && loadedCount === totalImages) {
                allLoaded = true;
                console.log('[Namibia] All images loaded, initializing ScrollTrigger');
                setTimeout(initScrollTrigger, 200);
            }
        };

        images.forEach((img, index) => {
            if (img.complete) {
                loadedCount++;
                if (index < 3) console.log(`[Namibia] Image ${index} already loaded:`, img.src);
                checkAndInit();
            } else {
                img.addEventListener('load', () => {
                    loadedCount++;
                    if (loadedCount <= 3) console.log(`[Namibia] Image loaded (${loadedCount}/${totalImages}):`, img.src);
                    checkAndInit();
                });
                img.addEventListener('error', () => {
                    loadedCount++;
                    console.error(`[Namibia] Image failed to load:`, img.src);
                    checkAndInit();
                });
            }
        });

        // Fallback timeout
        setTimeout(() => {
            if (!allLoaded) {
                console.warn('[Namibia] Timeout reached, initializing ScrollTrigger anyway. Loaded:', loadedCount, '/', totalImages);
                initScrollTrigger();
            }
        }, 3000);
    }

    // Add click handlers for image enlargement after images are loaded
    setTimeout(() => {
        const allImages = container.querySelectorAll('.horizontal-album-image-item img');
        allImages.forEach((img) => {
            img.style.cursor = 'pointer';
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                const fullSrc = img.getAttribute('data-full') || img.src;
                const caption = img.getAttribute('data-caption') || img.alt || '';

                // Open lightbox
                if (window.openLightbox) {
                    // Get all photos from current panel for navigation
                    const panel = img.closest('.horizontal-album-panel');
                    const panelImages = Array.from(panel.querySelectorAll('img')).map(i => ({
                        src: i.getAttribute('data-full') || i.src,
                        caption: i.getAttribute('data-caption') || i.alt || ''
                    }));
                    const currentIndex = Array.from(panel.querySelectorAll('img')).indexOf(img);
                    window.openLightbox(fullSrc, caption, panelImages, currentIndex);
                }
            });
        });
    }, 500);

    // Refresh on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            ScrollTrigger.refresh();
        }, 250);
    });
}

// Exploding Grid for Horizon album
function initExplodingGrid(chapterId, photos) {
    const grid = document.getElementById(`${chapterId}-gallery`);
    if (!grid || !photos.length) return;

    const container = grid.closest('.exploding-grid-container');
    if (!container) return;

    // Create thumbnail grid
    grid.innerHTML = photos.map((photo, index) => {
        const highResSrc = photo.src.replace('800/600', '1600/1100');
        return `
            <div class="exploding-thumbnail" data-index="${index}" data-src="${highResSrc}" data-caption="${photo.caption || `Photo ${index + 1}`}">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E" 
                     data-src="${photo.src}" 
                     alt="${photo.caption || `Photo ${index + 1}`}" 
                     loading="lazy"
                     class="lazy-optimized-image">
            </div>
        `;
    }).join('');

    const thumbnails = Array.from(grid.querySelectorAll('.exploding-thumbnail'));

    if (thumbnails.length === 0) return;

    // Set up collapsed state (stacked thumbnails)
    grid.classList.add('exploding-grid-collapsed');
    grid.style.position = 'relative';
    grid.style.width = '100%';
    grid.style.minHeight = '50vh';
    grid.style.display = 'flex';
    grid.style.alignItems = 'center';
    grid.style.justifyContent = 'center';
    grid.style.cursor = 'pointer';

    let isExpanded = false;

    // Wait for images to load, then position thumbnails
    const images = grid.querySelectorAll('img');
    let loadedCount = 0;

    const setupCollapsedState = () => {
        if (typeof gsap === 'undefined') {
            // Fallback without GSAP
            grid.classList.add('exploding-grid-expanded');
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const thumbWidth = 180; // Smaller thumbnails
        const thumbHeight = 135; // Maintain 4:3 aspect ratio
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height * 0.4; // Lower position (40% from top) to move photos down

        // Stack all thumbnails in center
        thumbnails.forEach((thumb, index) => {
            gsap.set(thumb, {
                position: 'absolute',
                left: centerX - thumbWidth / 2,
                top: centerY - thumbHeight / 2,
                width: thumbWidth,
                height: thumbHeight,
                opacity: 1,
                visibility: 'visible',
                zIndex: thumbnails.length - index,
                rotation: (index - thumbnails.length / 2) * 1.5,
                scale: 1 - (index * 0.015),
                x: 0, // Reset any transform
                y: 0  // Reset any transform
            });
        });

        // Add click handler to expand
        const expandHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (isExpanded) return;

            isExpanded = true;
            grid.removeEventListener('click', expandHandler);
            grid.style.cursor = 'default';

            // Switch to grid layout
            grid.classList.remove('exploding-grid-collapsed');
            grid.classList.add('exploding-grid-expanded');
            grid.style.display = 'grid';
            grid.style.position = 'relative';

            // Get container dimensions for random positioning - use full container area
            const containerRect = container.getBoundingClientRect();
            const gridRect = grid.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            // Smaller thumbnails in expanded state
            const newThumbWidth = 200;
            const newThumbHeight = 150;

            // Generate random positions for each thumbnail - spread across entire album area
            const usedPositions = [];
            const marginX = 30; // Small margin from edges
            const marginY = 30; // Small margin from edges
            const minSpacingX = 250; // Much larger spacing between thumbnails horizontally
            const minSpacingY = 180; // Much larger spacing between thumbnails vertically

            // Animate to random positions with dynamic animation
            thumbnails.forEach((thumb, index) => {
                // Get current position
                const currentRect = thumb.getBoundingClientRect();
                const currentX = currentRect.left - gridRect.left;
                const currentY = currentRect.top - gridRect.top;

                // Generate random position that doesn't overlap - spread across entire album area
                // Reserve space at top for title (about 150px to move photos down more)
                const titleSpace = 150;
                let randomX, randomY, attempts = 0;
                do {
                    // Use full container area for positioning, but avoid top area where title is
                    randomX = marginX + Math.random() * (containerWidth - newThumbWidth - marginX * 2);
                    randomY = marginY + titleSpace + Math.random() * (containerHeight - newThumbHeight - marginY * 2 - titleSpace);
                    attempts++;

                    // Check if position overlaps with existing ones
                    const overlaps = usedPositions.some(pos => {
                        const distanceX = Math.abs(randomX - pos.x);
                        const distanceY = Math.abs(randomY - pos.y);
                        return distanceX < newThumbWidth + minSpacingX &&
                            distanceY < newThumbHeight + minSpacingY;
                    });

                    if (!overlaps || attempts > 300) break;
                } while (attempts < 300);

                usedPositions.push({ x: randomX, y: randomY });

                // Calculate position relative to grid (not container)
                const gridLeft = gridRect.left - containerRect.left;
                const gridTop = gridRect.top - containerRect.top;
                const relativeX = randomX - gridLeft;
                const relativeY = randomY - gridTop;

                // Store original position relative to grid for hover effect
                thumb.dataset.originalX = relativeX.toString();
                thumb.dataset.originalY = relativeY.toString();

                // Set position relative to grid
                gsap.set(thumb, {
                    position: 'absolute',
                    left: relativeX,
                    top: relativeY,
                    x: 0, // Reset transform
                    y: 0  // Reset transform
                });

                // Calculate distance for dynamic animation
                const distance = Math.sqrt(
                    Math.pow(relativeX - currentX, 2) +
                    Math.pow(relativeY - currentY, 2)
                );

                // Animate from current position to random position
                gsap.fromTo(thumb, {
                    x: currentX - relativeX,
                    y: currentY - relativeY,
                    rotation: 0,
                    scale: 1,
                    width: thumbWidth,
                    height: thumbHeight
                }, {
                    x: 0, // Final position is at relativeX, relativeY (no transform offset)
                    y: 0,
                    rotation: (Math.random() - 0.5) * 20, // Random rotation
                    scale: 1,
                    width: newThumbWidth,
                    height: newThumbHeight,
                    duration: 1.4 + (distance / 600), // Longer, smoother duration based on distance
                    ease: 'power2.out', // Smoother easing without bounce
                    delay: index * 0.05, // Longer delay for more gradual animation
                    onComplete: () => {
                        // Final snap to position and ensure x/y are 0
                        gsap.to(thumb, {
                            rotation: 0,
                            x: 0,
                            y: 0,
                            duration: 0.3,
                            ease: 'power3.out' // Smoother final snap
                        });
                    }
                });
            });

            // After expansion, add click handlers and hover effects to individual thumbnails
            setTimeout(() => {
                thumbnails.forEach((thumb, index) => {
                    const rect = thumb.getBoundingClientRect();
                    const gridRect = grid.getBoundingClientRect();

                    // Store original position and size for explosion
                    thumb.dataset.originalWidth = rect.width.toString();
                    thumb.dataset.originalHeight = rect.height.toString();

                    thumb.style.cursor = 'pointer';

                    // Hover effect - enlarge in place (no movement to center)
                    thumb.addEventListener('mouseenter', () => {
                        // Smaller enlargement in place, don't move
                        gsap.to(thumb, {
                            scale: 1.3, // Smaller scale
                            zIndex: 1000,
                            duration: 0.6, // Longer, smoother hover animation
                            ease: 'power2.out'
                        });
                    });

                    thumb.addEventListener('mouseleave', () => {
                        // Return to original scale
                        gsap.to(thumb, {
                            scale: 1,
                            zIndex: 1,
                            duration: 0.6, // Longer, smoother hover animation
                            ease: 'power2.out'
                        });
                    });

                    thumb.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Use standard lightbox with gallery navigation instead of explode
                        const fullSrc = thumb.dataset.src || thumb.querySelector('img').src;
                        const caption = thumb.dataset.caption || thumb.querySelector('img').alt || '';
                        if (window.openLightbox) {
                            window.openLightbox(fullSrc, caption, photos, index);
                        }
                    });
                });
            }, 1200);
        };

        grid.addEventListener('click', expandHandler);
    };

    // Wait for images to load - użyj ulepszonej funkcji z lepszą obsługą błędów
    waitForImages(images, () => {
        setTimeout(setupCollapsedState, 100);
    }, 3000);
}

function buildAfterSunGallery(photos) {
    if (!photos.length) return '';

    let markup = '';
    photos.forEach((photo, index) => {
        const highResSrc = photo.src.replace('800/600', '1600/1100');
        const caption = escapeHtml(photo.caption || '');

        markup += `
            <figure class="gallery-item after-sun-item">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f0f0' width='400' height='300'/%3E%3C/svg%3E" 
                     data-src="${photo.src}" 
                     alt="${caption}" 
                     loading="lazy"
                     data-caption="${caption}"
                     data-full="${highResSrc}"
                     data-chapter="after-sun"
                     data-index="${index}"
                     class="lazy-optimized-image">
            </figure>
        `;
    });

    return markup;
}

// Initialize "After The Sun" reveal effect
function initAfterSunReveal() {
    const galleryWrapper = document.getElementById('after-sun-gallery-wrapper');
    const overlay = document.getElementById('after-sun-overlay');
    const gallery = document.getElementById('after-sun-gallery');

    if (!galleryWrapper || !overlay || !gallery) {
        return;
    }

    // Radius of the reveal circle (aureola)
    const revealRadius = 200;

    // Track if all photos are revealed
    let allPhotosRevealed = false;

    // Store current mouse position
    let currentMouseX = null;
    let currentMouseY = null;

    // Function to build mask with mouse position (aureola around cursor)
    const buildMask = () => {
        // If all photos are revealed, hide overlay completely
        if (allPhotosRevealed) {
            overlay.style.display = 'none';
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            overlay.style.pointerEvents = 'none';
            return;
        }

        // Show overlay with mouse circle (aureola)
        overlay.style.display = 'block';
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';

        if (currentMouseX !== null && currentMouseY !== null) {
            // Create radial gradient for mouse circle (aureola)
            // In mask-image: transparent = visible content (reveals photos), black = hidden overlay (covers photos)
            // Larger transparent area for better reveal effect
            const maskValue = `radial-gradient(circle ${revealRadius}px at ${currentMouseX}px ${currentMouseY}px, transparent 0%, transparent 40%, black 50%)`;
            overlay.style.maskImage = maskValue;
            overlay.style.webkitMaskImage = maskValue;
            overlay.style.maskSize = '100% 100%';
            overlay.style.webkitMaskSize = '100% 100%';
            overlay.style.maskRepeat = 'no-repeat';
            overlay.style.webkitMaskRepeat = 'no-repeat';

            // Also reveal photos that are within the aureola radius
            const allPhotoItems = gallery.querySelectorAll('.after-sun-item');
            allPhotoItems.forEach(photoItem => {
                if (allPhotosRevealed) return;

                const rect = photoItem.getBoundingClientRect();
                const wrapperRect = galleryWrapper.getBoundingClientRect();
                const photoCenterX = rect.left + rect.width / 2 - wrapperRect.left;
                const photoCenterY = rect.top + rect.height / 2 - wrapperRect.top;

                // Calculate distance from mouse to photo center
                const distance = Math.sqrt(
                    Math.pow(photoCenterX - currentMouseX, 2) +
                    Math.pow(photoCenterY - currentMouseY, 2)
                );

                // If photo is within reveal radius, make it visible
                if (distance < revealRadius) {
                    photoItem.style.opacity = '1';
                    photoItem.style.transform = 'scale(1)';
                } else {
                    // Keep it hidden if outside radius
                    if (!photoItem.classList.contains('revealed')) {
                        photoItem.style.opacity = '0';
                        photoItem.style.transform = 'scale(0.8)';
                    }
                }
            });
        } else {
            // No mouse - fully opaque (hide everything)
            overlay.style.maskImage = 'none';
            overlay.style.webkitMaskImage = 'none';

            // Hide all photos that aren't fully revealed
            if (!allPhotosRevealed) {
                const allPhotoItems = gallery.querySelectorAll('.after-sun-item');
                allPhotoItems.forEach(photoItem => {
                    if (!photoItem.classList.contains('revealed')) {
                        photoItem.style.opacity = '0';
                        photoItem.style.transform = 'scale(0.8)';
                    }
                });
            }
        }
    };

    // Update mask position based on mouse position
    const updateReveal = (e) => {
        if (allPhotosRevealed) return;

        const rect = galleryWrapper.getBoundingClientRect();
        currentMouseX = e.clientX - rect.left;
        currentMouseY = e.clientY - rect.top;

        // Ensure coordinates are within bounds
        currentMouseX = Math.max(0, Math.min(currentMouseX, rect.width));
        currentMouseY = Math.max(0, Math.min(currentMouseY, rect.height));

        buildMask();
    };

    // Handle mouse leave - hide circle
    const handleMouseLeave = () => {
        if (allPhotosRevealed) return;

        currentMouseX = null;
        currentMouseY = null;
        buildMask();
    };

    // Function to reveal all photos - bez animacji, od razu widoczne
    const revealAllPhotos = () => {
        if (allPhotosRevealed) {
            return;
        }

        allPhotosRevealed = true;
        const allPhotoItems = gallery.querySelectorAll('.after-sun-item');

        if (allPhotoItems.length === 0) {
            return;
        }

        // Hide overlay immediately
        overlay.style.display = 'none';
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '-1';

        // Pokaż wszystkie zdjęcia od razu - bez animacji
        allPhotoItems.forEach((photoItem) => {
            photoItem.classList.add('revealed');
            photoItem.style.opacity = '1';
            photoItem.style.transform = 'scale(1)';
            photoItem.style.visibility = 'visible';
            photoItem.style.display = 'block';
        });
    };

    // Function to open lightbox with clicked photo (centered and enlarged)
    const openPhotoLightbox = (photoItem) => {
        const img = photoItem.querySelector('img');
        if (!img) return;

        const fullSrc = img.dataset.full || img.src;
        const caption = img.dataset.caption || img.alt || '';
        const lightbox = document.getElementById('lightbox');

        if (!lightbox) return;

        const imageEl = lightbox.querySelector('img');
        const captionEl = lightbox.querySelector('.lightbox-caption');

        if (!imageEl) return;

        // Set image source and caption
        imageEl.src = fullSrc;
        imageEl.alt = caption;
        if (captionEl) {
            captionEl.textContent = caption;
        }

        // Show lightbox (centered by CSS)
        lightbox.classList.add('visible');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    // Handle click - simplified: first click reveals all, second click opens lightbox
    galleryWrapper.addEventListener('click', (e) => {
        // Check if clicking on a photo item
        const photoItem = e.target.closest('.after-sun-item');

        if (!allPhotosRevealed) {
            // First click anywhere - reveal all photos
            e.stopPropagation();
            e.preventDefault();
            revealAllPhotos();
        } else {
            // Second click - open lightbox if clicking on a photo
            if (photoItem) {
                e.stopPropagation();
                e.preventDefault();
                openPhotoLightbox(photoItem);
            }
        }
    });

    // Add click handler to title - reveal all photos
    const titleElement = document.querySelector('#after-sun .project-title');
    if (titleElement) {
        titleElement.style.cursor = 'pointer';
        titleElement.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!allPhotosRevealed) {
                revealAllPhotos();
            }
        });
    }

    // Add mouse move listener - overlay has pointer-events: none, so listen on wrapper
    galleryWrapper.addEventListener('mousemove', updateReveal);
    galleryWrapper.addEventListener('mouseenter', (e) => {
        // Initialize mouse position when entering
        if (!allPhotosRevealed) {
            const rect = galleryWrapper.getBoundingClientRect();
            currentMouseX = e.clientX - rect.left;
            currentMouseY = e.clientY - rect.top;
            buildMask();
        }
    });
    galleryWrapper.addEventListener('mouseleave', handleMouseLeave);

    // Also handle touch events for mobile
    galleryWrapper.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0 && !allPhotosRevealed) {
            const touch = e.touches[0];
            const rect = galleryWrapper.getBoundingClientRect();
            currentMouseX = touch.clientX - rect.left;
            currentMouseY = touch.clientY - rect.top;
            buildMask();
        }
    });

    // Initial state - ensure overlay is visible and covering photos
    overlay.style.display = 'block';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    overlay.style.zIndex = '100';
    overlay.style.backgroundColor = '#F5F5DC'; // Kremowy Beż (Ecru) - eleganckie tło odkrywanego obrazu
    overlay.style.maskImage = 'none';
    overlay.style.webkitMaskImage = 'none';
    overlay.style.pointerEvents = 'none'; // Allow clicks to pass through

    // Initial state - hide all photos until revealed
    const allPhotoItems = gallery.querySelectorAll('.after-sun-item');
    allPhotoItems.forEach((item) => {
        // Photos start hidden - will be revealed by mouse movement or click
        item.style.opacity = '0';
        item.style.transform = 'scale(0.8)';
        item.style.visibility = 'visible';
        item.style.display = 'block';
        item.classList.remove('revealed');
    });

    // Reset reveal state - photos need to be discovered
    allPhotosRevealed = false;
}
