#!/usr/bin/env python3
"""
Skrypt do kompresji obrazów dla portfolio
Kompresuje wszystkie JPG w folderach albumów
"""

import os
from PIL import Image
import sys

# Ustawienia kompresji - różne dla różnych folderów
# Dla eager loading (Namibia, Balkans): wyższa rozdzielczość dla lepszej jakości
# Dla lazy loading: mniejsza rozdzielczość dla szybszego ładowania
DEFAULT_MAX_WIDTH = 1000
DEFAULT_MAX_HEIGHT = 700
DEFAULT_QUALITY = 80  # 80% jakość JPEG

# Specjalne ustawienia dla folderów z eager loading (jak Namibia)
EAGER_LOADING_FOLDERS = {
    'namibia': {'max_width': 1400, 'max_height': 1920, 'quality': 85},
    'balkans': {'max_width': 1400, 'max_height': 1920, 'quality': 85},
    'random photos': {'max_width': 1200, 'max_height': 1200, 'quality': 85}  # Główna strona
}

# Foldery do kompresji (bez random photos - użytkownik nie chce kompresować)
FOLDERS_TO_COMPRESS = [
    'paris',
    'europe',
    'iceland',
    'chicago',
    'asia',
    'korea',
    'namibia',
    'balkans',
    'philippines',
    'maroko'
]

def compress_image(input_path, output_path, max_width=None, max_height=None, quality=None):
    """Kompresuje pojedynczy obraz"""
    try:
        # Użyj domyślnych wartości jeśli nie podano
        max_width = max_width or DEFAULT_MAX_WIDTH
        max_height = max_height or DEFAULT_MAX_HEIGHT
        quality = quality or DEFAULT_QUALITY
        
        # Otwórz obraz
        img = Image.open(input_path)
        
        # Pobierz oryginalny rozmiar
        original_size = os.path.getsize(input_path)
        
        # Konwertuj do RGB jeśli potrzeba (dla JPEG)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Utwórz białe tło
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Oblicz nowe wymiary zachowując proporcje
        width, height = img.size
        if width > max_width or height > max_height:
            ratio = min(max_width / width, max_height / height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Zapisz z kompresją
        img.save(output_path, 'JPEG', quality=quality, optimize=True)
        
        # Pobierz nowy rozmiar
        new_size = os.path.getsize(output_path)
        reduction = ((original_size - new_size) / original_size * 100)
        
        return {
            'success': True,
            'original_size': original_size,
            'new_size': new_size,
            'reduction': reduction
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def process_folder(folder_path):
    """Przetwarza wszystkie obrazy w folderze"""
    folder_name = os.path.basename(folder_path)
    print(f'\n📁 Przetwarzanie folderu: {folder_name}')
    
    # Sprawdź czy folder ma specjalne ustawienia
    settings = EAGER_LOADING_FOLDERS.get(folder_name, {})
    max_width = settings.get('max_width', DEFAULT_MAX_WIDTH)
    max_height = settings.get('max_height', DEFAULT_MAX_HEIGHT)
    quality = settings.get('quality', DEFAULT_QUALITY)
    
    if folder_name in EAGER_LOADING_FOLDERS:
        print(f'   ⚙️  Ustawienia: {max_width}x{max_height}px, {quality}% jakość (eager loading)')
    else:
        print(f'   ⚙️  Ustawienia: {max_width}x{max_height}px, {quality}% jakość (lazy loading)')
    
    # Znajdź wszystkie pliki JPG
    jpg_files = [f for f in os.listdir(folder_path) 
                 if f.lower().endswith(('.jpg', '.jpeg'))]
    
    print(f'   Znaleziono {len(jpg_files)} plików JPG')
    
    total_original = 0
    total_new = 0
    success_count = 0
    fail_count = 0
    
    for file in jpg_files:
        input_path = os.path.join(folder_path, file)
        output_path = os.path.join(folder_path, f'temp_{file}')
        
        print(f'   Kompresowanie: {file}...', end=' ')
        
        result = compress_image(input_path, output_path, max_width, max_height, quality)
        
        if result['success']:
            # Zastąp oryginał zoptymalizowaną wersją
            os.replace(output_path, input_path)
            
            total_original += result['original_size']
            total_new += result['new_size']
            success_count += 1
            
            original_mb = result['original_size'] / 1024 / 1024
            new_mb = result['new_size'] / 1024 / 1024
            reduction = result['reduction']
            
            print(f'✓ {original_mb:.2f}MB → {new_mb:.2f}MB ({reduction:.1f}% mniejsze)')
        else:
            # Usuń tymczasowy plik jeśli był utworzony
            if os.path.exists(output_path):
                os.remove(output_path)
            fail_count += 1
            print(f'✗ Błąd: {result["error"]}')
    
    return {
        'folder': folder_name,
        'success_count': success_count,
        'fail_count': fail_count,
        'total_original': total_original,
        'total_new': total_new
    }

def main():
    print('🚀 Rozpoczynam kompresję obrazów...')
    print(f'📐 Domyślne ustawienia: {DEFAULT_MAX_WIDTH}x{DEFAULT_MAX_HEIGHT}px, {DEFAULT_QUALITY}% jakość')
    print(f'📐 Eager loading (Namibia, Balkans): 1400x1920px, 85% jakość')
    
    project_root = os.path.dirname(os.path.abspath(__file__))
    results = []
    
    for folder_name in FOLDERS_TO_COMPRESS:
        folder_path = os.path.join(project_root, folder_name)
        
        if not os.path.exists(folder_path):
            print(f'⚠️  Folder {folder_name} nie istnieje, pomijam...')
            continue
        
        result = process_folder(folder_path)
        results.append(result)
    
    # Podsumowanie
    print('\n' + '=' * 60)
    print('📊 PODSUMOWANIE KOMPRESJI')
    print('=' * 60)
    
    total_original = 0
    total_new = 0
    total_success = 0
    total_fail = 0
    
    for result in results:
        total_original += result['total_original']
        total_new += result['total_new']
        total_success += result['success_count']
        total_fail += result['fail_count']
        
        if result['total_original'] > 0:
            folder_reduction = ((result['total_original'] - result['total_new']) / 
                              result['total_original'] * 100)
            original_mb = result['total_original'] / 1024 / 1024
            new_mb = result['total_new'] / 1024 / 1024
            
            print(f'\n{result["folder"]}:')
            print(f'  ✓ Skompresowano: {result["success_count"]} plików')
            if result['fail_count'] > 0:
                print(f'  ✗ Błędy: {result["fail_count"]} plików')
            print(f'  📦 Rozmiar: {original_mb:.2f}MB → {new_mb:.2f}MB ({folder_reduction:.1f}% mniejsze)')
    
    if total_original > 0:
        overall_reduction = ((total_original - total_new) / total_original * 100)
        total_original_mb = total_original / 1024 / 1024
        total_new_mb = total_new / 1024 / 1024
        saved_mb = (total_original - total_new) / 1024 / 1024
        
        print('\n' + '=' * 60)
        print('🎯 WYNIKI OGÓLNE:')
        print(f'   ✓ Skompresowano: {total_success} plików')
        if total_fail > 0:
            print(f'   ✗ Błędy: {total_fail} plików')
        print(f'   📦 Całkowity rozmiar: {total_original_mb:.2f}MB → {total_new_mb:.2f}MB')
        print(f'   💾 Oszczędność: {saved_mb:.2f}MB ({overall_reduction:.1f}% mniejsze)')
        print('=' * 60)
    
    print('\n✅ Kompresja zakończona!')

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Przerwano przez użytkownika')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Błąd: {e}')
        sys.exit(1)

