// document.getElementById('startScan').addEventListener('click', function () {
//     // Kamerayı açma işlemi
//     document.getElementById('camera-container').style.display = 'block';

//     Quagga.init({
//         inputStream: {
//             name: "Live",
//             type: "LiveStream",
//             target: document.querySelector('#camera-container'),
//         },
//         decoder: {
//             readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader"] // Okuyucu türleri
//         }
//     }, function (err) {
//         if (err) {
//             console.log(err);
//             return;
//         }
//         console.log("Barkod Okuyucu Başlatıldı");
//         Quagga.start();
//     });

//     // Barkod tarandığında tetiklenecek olay
//     Quagga.onDetected(function (data) {
//         const code = data.codeResult.code; // Okunan barkod numarası
//         document.getElementById('barkod').value = code; // Barkod numarasını input'a yaz
//         console.log("Barkod Okundu: " + code);
//         Quagga.stop(); // Okuma tamamlandığında durdur
//         document.getElementById('camera-container').style.display = 'none'; // Kamerayı gizle
//     });
// });
