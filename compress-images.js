const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ustawienia kompresji - bardzo agresywne dla maksymalnej płynności
const MAX_WIDTH = 1000;
const MAX_HEIGHT = 700;
const QUALITY = 50; // 50% jakość JPEG
const FOLDERS_TO_COMPRESS = [
    'paris',
    'europe',
    'iceland',
    'chicago',
    'asia',
    'korea',
    'namibia',
    'balkans',
    'philippines',
    'maroko',
    'random photos'
];

// Funkcja do kompresji pojedynczego obrazu
async function compressImage(inputPath, outputPath) {
    try {
        const stats = fs.statSync(inputPath);
        const originalSize = stats.size;
        
        await sharp(inputPath)
            .resize(MAX_WIDTH, MAX_HEIGHT, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({
                quality: QUALITY,
                mozjpeg: true // Lepsza kompresja
            })
            .toFile(outputPath);
        
        const newStats = fs.statSync(outputPath);
        const newSize = newStats.size;
        const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);
        
        return {
            success: true,
            originalSize,
            newSize,
            reduction: `${reduction}%`
        };
    } catch (error) {
        console.error(`Błąd przy kompresji ${inputPath}:`, error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Funkcja do przetwarzania folderu
async function processFolder(folderPath) {
    const files = fs.readdirSync(folderPath);
    const jpgFiles = files.filter(file => 
        file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
    );
    
    console.log(`\n📁 Przetwarzanie folderu: ${path.basename(folderPath)}`);
    console.log(`   Znaleziono ${jpgFiles.length} plików JPG`);
    
    let totalOriginalSize = 0;
    let totalNewSize = 0;
    let successCount = 0;
    let failCount = 0;
    
    for (const file of jpgFiles) {
        const inputPath = path.join(folderPath, file);
        const outputPath = path.join(folderPath, `temp_${file}`);
        
        console.log(`   Kompresowanie: ${file}...`);
        
        const result = await compressImage(inputPath, outputPath);
        
        if (result.success) {
            // Zastąp oryginał zoptymalizowaną wersją
            fs.unlinkSync(inputPath);
            fs.renameSync(outputPath, inputPath);
            
            totalOriginalSize += result.originalSize;
            totalNewSize += result.newSize;
            successCount++;
            
            const originalMB = (result.originalSize / 1024 / 1024).toFixed(2);
            const newMB = (result.newSize / 1024 / 1024).toFixed(2);
            console.log(`   ✓ ${file}: ${originalMB}MB → ${newMB}MB (${result.reduction} mniejsze)`);
        } else {
            // Usuń tymczasowy plik jeśli był utworzony
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
            failCount++;
            console.log(`   ✗ Błąd: ${file}`);
        }
    }
    
    return {
        folder: path.basename(folderPath),
        successCount,
        failCount,
        totalOriginalSize,
        totalNewSize
    };
}

// Główna funkcja
async function main() {
    console.log('🚀 Rozpoczynam kompresję obrazów...');
    console.log(`📐 Ustawienia: ${MAX_WIDTH}x${MAX_HEIGHT}px, ${QUALITY}% jakość\n`);
    
    const projectRoot = __dirname;
    const results = [];
    
    for (const folderName of FOLDERS_TO_COMPRESS) {
        const folderPath = path.join(projectRoot, folderName);
        
        if (!fs.existsSync(folderPath)) {
            console.log(`⚠️  Folder ${folderName} nie istnieje, pomijam...`);
            continue;
        }
        
        const result = await processFolder(folderPath);
        results.push(result);
    }
    
    // Podsumowanie
    console.log('\n' + '='.repeat(60));
    console.log('📊 PODSUMOWANIE KOMPRESJI');
    console.log('='.repeat(60));
    
    let totalOriginal = 0;
    let totalNew = 0;
    let totalSuccess = 0;
    let totalFail = 0;
    
    results.forEach(result => {
        totalOriginal += result.totalOriginalSize;
        totalNew += result.totalNewSize;
        totalSuccess += result.successCount;
        totalFail += result.failCount;
        
        const folderReduction = ((result.totalOriginalSize - result.totalNewSize) / result.totalOriginalSize * 100).toFixed(1);
        const originalMB = (result.totalOriginalSize / 1024 / 1024).toFixed(2);
        const newMB = (result.totalNewSize / 1024 / 1024).toFixed(2);
        
        console.log(`\n${result.folder}:`);
        console.log(`  ✓ Skompresowano: ${result.successCount} plików`);
        if (result.failCount > 0) {
            console.log(`  ✗ Błędy: ${result.failCount} plików`);
        }
        console.log(`  📦 Rozmiar: ${originalMB}MB → ${newMB}MB (${folderReduction}% mniejsze)`);
    });
    
    const overallReduction = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1);
    const totalOriginalMB = (totalOriginal / 1024 / 1024).toFixed(2);
    const totalNewMB = (totalNew / 1024 / 1024).toFixed(2);
    const savedMB = ((totalOriginal - totalNew) / 1024 / 1024).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 WYNIKI OGÓLNE:');
    console.log(`   ✓ Skompresowano: ${totalSuccess} plików`);
    if (totalFail > 0) {
        console.log(`   ✗ Błędy: ${totalFail} plików`);
    }
    console.log(`   📦 Całkowity rozmiar: ${totalOriginalMB}MB → ${totalNewMB}MB`);
    console.log(`   💾 Oszczędność: ${savedMB}MB (${overallReduction}% mniejsze)`);
    console.log('='.repeat(60));
    console.log('\n✅ Kompresja zakończona!');
}

// Uruchom
main().catch(error => {
    console.error('❌ Błąd:', error);
    process.exit(1);
});

