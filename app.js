const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3003;



// JSON verileri için dosya yolları
const catalogPath = './data/catalog.json';
const stockPath = './data/stock.json';
const cashPath = './data/cash.json';

// Middleware
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Verileri oku
const readData = (path) => {
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path);
        return JSON.parse(data);
    }
    return [];
};

// Verileri kaydet
const writeData = (path, data) => {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
};



// Ürün kataloğu


// Anasayfa
// Kök URL'yi /index rotasına yönlendirme
app.get('/', (req, res) => {
    res.redirect('/index');
});

// /index rotasında ana sayfa görünümünü render etme
app.get('/index', (req, res) => {
    res.render('index'); // index.ejs dosyasını render eder
});

// Ürün Kataloğu
app.get('/catalog', (req, res) => {
    const catalogData = readData(catalogPath);
    res.render('catalog', { catalog: catalogData }); // Katalog verisini EJS ile render et
});

// Ürün Ekle
app.post('/catalog', (req, res) => {
    // Gelen verileri console'a yazdırarak kontrol et
    console.log('Gelen Veriler:', req.body);

    const { barkod, aciklama } = req.body;

    if (!barkod || !aciklama) {
        return res.status(400).send('Barkod ve açıklama gereklidir.');
    }

    const catalogData = readData(catalogPath);
    const exist = catalogData.find(item => item.barkod === barkod);

    if (exist) {
        return res.status(400).send('Bu barkodlu ürün zaten kayıtlı.');
    } else {
        catalogData.push({ barkod, aciklama });
        writeData(catalogPath, catalogData);
        return res.redirect('/catalog');
    }
});


    



// Alım Sayfası
app.get('/purchase', (req, res) => {
    
    res.render('purchase');
});

// Alım İşlemi OLDU
app.post('/purchase', (req, res) => {
    const { tarih, barkod, adet,fiyat } = req.body;
    const stockData = readData(stockPath); // Stok verilerini oku
    const catalogData = readData(catalogPath); // Katalog verilerini oku (barkod ve isim bilgisi için)
    


    // Katalogda ürünü bul
    const existingProductInCatalog = catalogData.find(item => item.barkod === barkod);

    // Eğer katalogda ürün mevcutsa
    if (existingProductInCatalog) {
        // Stokta ürünü bul
        const existingProductInStock = stockData.find(item => item.barkod === barkod);
        
        // Eğer stokta mevcutsa, adetini güncelle
        if (existingProductInStock) {
            existingProductInStock.adet += parseInt(adet);
        } else {
            // Stokta yoksa, yeni bir ürün ekle
            stockData.push({
                barkod: existingProductInCatalog.barkod,
                isim: existingProductInCatalog.isim,
                adet: parseInt(adet)
            });
        }

        writeData(stockPath, stockData); // Güncellenmiş stok verilerini yaz

        const islem ='alım'

        const catalogProduct = catalogData.find(item => item.barkod === barkod);
        const aciklama = catalogProduct ? catalogProduct.aciklama : 'Hangi Ürün bilinmiyor';

        // Cash kaydetme
        const cashData = readData(cashPath);
        const afiyat = (-1)*fiyat; // Fiyatı daha sonra ekleyebilirsiniz
        cashData.push({ tarih, barkod, isim: existingProductInCatalog.isim, adet, afiyat, islem, aciklama});
        writeData(cashPath, cashData);

        res.redirect('/purchase'); // İşlem başarılıysa yönlendir
    } else {
        // Katalogda ürün bulunmadıysa
        res.send('Alım yaparken böyle bir ürün bulunmadı. Lütfen ürünü kataloğa ekleyin.');
    }
});


// Satış Sayfası
app.get('/sale', (req, res) => {
    res.render('sale');
});

// Satış İşlemi
app.post('/sale', (req, res) => {
    const { barkod, fiyat } = req.body;
    const stockData = readData(stockPath);
    const cashData = readData(cashPath);
    const catalogData = readData(catalogPath); // Catalog verisini oku
    const product = stockData.find(item => item.barkod === barkod);
    const islem = 'satım';
    const sfiyat = parseFloat(fiyat); // Fiyatı sayıya çevir
    const tarih = formatDate(new Date()); // Formatlı tarih

    if (product && product.adet > 0) {
        product.adet -= 1; // Stok miktarını bir azalt

        // Catalog'dan ürün açıklamasını bul
        const catalogProduct = catalogData.find(item => item.barkod === barkod);
        const aciklama = catalogProduct ? catalogProduct.aciklama : 'Açıklama bulunamadı'; // Açıklamayı al

        // Satış verisini cashData dizisine ekle
        cashData.push({
            barkod,
            sfiyat,
            islem,
            tarih, // Formatlı tarihi ekle
            aciklama // Açıklamayı ekle
        });

        // Güncellenmiş veriyi cash.json'a yaz
        writeData(cashPath, cashData); // Sadece cashData'yı kaydet

        // Stok verisini de güncelleyip yazmak için çağır
        writeData(stockPath, stockData);

        res.redirect('/sale'); // Satış işlemi tamamlandığında yönlendirme
    } else {
        res.send("Böyle bir ürün yok ya da stok bitmiş.");
    }
});




app.get('/stock', (req, res) => { //stok liste sayafası
    const stockData = readData(stockPath); // Stok verisini oku
    const catalogData = readData(catalogPath); // Katalog verisini oku

    // Stok verilerini katalog verileriyle eşleştirerek açıklama ekle
    const enrichedStockData = stockData.map(stockItem => {
        const catalogItem = catalogData.find(item => item.barkod === stockItem.barkod);
        return {    
            ...stockItem,
            aciklama: catalogItem ? catalogItem.aciklama : "Açıklama bulunamadı"
        };
    });

    res.render('stock', { stock: enrichedStockData }); // stock.ejs dosyasına veriyi gönder
});



app.get('/transactions', (req, res) => {
    const cashData = readData(cashPath);
    
    // Toplam kasa hesaplama
    const totalCash = cashData.reduce((total, transaction) => {
        const price1= Number(transaction.sfiyat);
        const price2 = Number(transaction.afiyat) // 'sfiyat' değerini sayıya çevir
        return total + (isNaN(price1) ? 0 : price1) + (isNaN(price2) ? 0 : price2); // Eğer geçerli değilse 0 ekle
    }, 0);
    
    res.render('transactions', { transactions: cashData, totalCash });
});

app.post('/money', (req, res) => {

    const cashData = readData(cashPath);
    const islemTipi = req.body.islemTipi;
    const aciklama = req.body.aciklama;
    const tarih = formatDate(new Date());
    // Miktar ve açıklamayı işleyebilirsin

    if(islemTipi === 'yatir'){
        const sfiyat = req.body.miktar;
        const islem = 'satım';

        cashData.push({
            sfiyat,
            islem,
            aciklama,
            tarih
        });
        writeData(cashPath, cashData);
    }

    if(islemTipi === 'cek'){
        const sfiyat = req.body.miktar;
        const islem = 'alım';

        cashData.push({
            sfiyat,
            islem,
            aciklama,
            tarih
        });
        writeData(cashPath, cashData);
    }
    // İsteğe göre yanıt ver
    res.redirect('/transactions');
});




function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Ayı 2 haneli hale getir
    const day = String(date.getDate()).padStart(2, '0'); // Günü 2 haneli hale getir
    return `${year}-${month}-${day}`; // Formatı birleştir
}


// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
