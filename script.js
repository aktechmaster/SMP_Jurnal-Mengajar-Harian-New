// --- MASUKKAN URL GOOGLE SCRIPT ANDA DI SINI ---
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzG4ZKJCOxEmjU12FaVpQ6szU9xvXJnAj4tNy4lpSlsq6FbMwo8doFme-UG-38V8x6D/exec"; 

// 1. Load Data Awal & Render Checkbox "Jam Ke"
window.onload = function() {
    // Generate Checkbox Jam Ke (Dipindahkan dari Inline HTML)
    const containerJamKe = document.getElementById('containerJamKe');
    if (containerJamKe) {
        let jamKeHTML = '';
        for(let i=1; i<=10; i++){
            jamKeHTML += `<div class="cb-item"><input type="checkbox" name="waktu" value="Jam ${i}" id="j${i}"><label for="j${i}">${i}</label></div>`;
        }
        containerJamKe.innerHTML = jamKeHTML;
    }

    // Fetch data Meta
    fetch(SCRIPT_URL + "?action=getMeta")
    .then(res => res.json())
    .then(data => {
        isiSelect('guru', data.gurus);
        isiSelect('mapel', data.mapels);
        isiSelect('kelas', data.kelas);
    })
    .catch(err => {
        console.log(err);
    });
};

function isiSelect(id, array) {
    let el = document.getElementById(id);
    el.innerHTML = `<option value="" disabled selected>-- Pilih --</option>`;
    array.forEach(item => {
        let opt = document.createElement('option');
        opt.value = item;
        opt.innerText = item;
        el.appendChild(opt);
    });
}

// --- EVENT LISTENER: CEK KUOTA ---
document.getElementById('guru').addEventListener('change', function() {
    var namaGuru = this.value;
    var btn = document.getElementById('btnKirim');
    
    if (!namaGuru) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="loader"></span> MEMERIKSA JATAH...';
    btn.style.background = "#64748b"; 

    fetch(SCRIPT_URL + "?action=cekKuota&nama=" + encodeURIComponent(namaGuru))
    .then(res => res.json())
    .then(hasil => {
        
        if (hasil.status === "SUKSES") {
            if (hasil.bolehInput) {
                btn.disabled = false;
                btn.innerHTML = `UPLOAD DATA (Sisa: ${hasil.sisa}) <i class="fa-solid fa-rocket"></i>`;
                btn.style.background = ""; 
                
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                Toast.fire({
                    icon: 'success',
                    title: `Halo ${namaGuru}, silakan input data.`
                });

            } else {
                btn.disabled = true;
                btn.innerHTML = '⛔ JATAH HARI INI HABIS';
                btn.style.background = "#ef4444"; 
                
                Swal.fire({
                    icon: 'error',
                    title: 'Jatah Habis!',
                    text: `Maaf ${namaGuru}, jatah input jurnal Anda hari ini sudah terpenuhi.`,
                    footer: 'Silakan hubungi admin jika ada kesalahan.',
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'Oke, Paham'
                });
            }

        } else {
            btn.disabled = true;
            btn.innerHTML = '⚠️ DATA TIDAK DITEMUKAN';
            Swal.fire({
                icon: 'warning',
                title: 'Data Tidak Ditemukan',
                text: hasil.pesan
            });
        }
    })
    .catch(error => {
        console.log(error);
        btn.disabled = false;
        btn.innerHTML = '⚠️ ERROR KONEKSI';
        Swal.fire({
            icon: 'error',
            title: 'Koneksi Bermasalah',
            text: 'Gagal menghubungi server database.'
        });
    });
});

// 2. Load Siswa
function loadSiswa() {
    let kls = document.getElementById('kelas').value;
    document.getElementById('loading-siswa').style.display = 'inline-block';
    document.getElementById('student-list').innerHTML = '';

    fetch(SCRIPT_URL + "?action=getSiswa&kelas=" + encodeURIComponent(kls))
    .then(res => res.json())
    .then(siswa => {
        document.getElementById('loading-siswa').style.display = 'none';
        let html = '';
        siswa.forEach(nama => {
            html += `
            <div class="student-card">
                <span style="font-weight:600; font-size:0.9rem; color:#334155;">${nama}</span>
                <select class="absen-select" data-nama="${nama}">
                    <option value="Hadir">✅ Hadir</option>
                    <option value="Sakit">🤒 Sakit</option>
                    <option value="Izin">📩 Izin</option>
                    <option value="Alpha">❌ Alpha</option>
                </select>
            </div>`;
        });
        document.getElementById('student-list').innerHTML = html;
    });
}

// 3. Kirim Data
function kirimData() {
    const emailVal = document.getElementById('emailGuru').value;
    if(!emailVal) { alert("Harap isi Email untuk pengiriman bukti!"); return; }

    // --- MULAI: VALIDASI MINIMAL KARAKTER REFLEKSI ---
    const minChar = 30; // Ubah angka ini sesuai kebutuhan Anda
    const teksCatatan = document.getElementById('catatan').value.trim();
    const teksKeberhasilan = document.getElementById('keberhasilan').value.trim();
    const teksPerbaikan = document.getElementById('perbaikan').value.trim();
    const teksRtl = document.getElementById('rtl').value.trim();

    if (teksCatatan.length < minChar || teksKeberhasilan.length < minChar || 
        teksPerbaikan.length < minChar || teksRtl.length < minChar) {
        
        Swal.fire({
            icon: 'warning',
            title: 'Isian Terlalu Singkat',
            text: `Mohon isi bagian Catatan Pengamatan & Refleksi minimal ${minChar} karakter ya. Evaluasi yang detail sangat berarti untuk perbaikan mutu sekolah kita!`,
            confirmButtonColor: '#f59e0b',
            confirmButtonText: 'Baik, saya lengkapi'
        });
        return; // Hentikan proses pengiriman jika syarat tidak terpenuhi
    }
    // --- SELESAI: VALIDASI MINIMAL KARAKTER ---

    if(!confirm('Data sudah benar? Kirim sekarang?')) return;

    let btn = document.getElementById('btnKirim');
    btn.innerHTML = '<span class="loader"></span> SENDING...';
    btn.disabled = true;

    let data = {
        email: emailVal,
        guru: document.getElementById('guru').value,
        mapel: document.getElementById('mapel').value,
        kelas: document.getElementById('kelas').value,
        pertemuan: document.getElementById('pertemuan').value,
        media: Array.from(document.querySelectorAll('input[name="media_alat"]:checked'))
                .map(cb => cb.value).join(", ") || "-",
        materi: document.getElementById('materi').value,
        kegiatan: document.getElementById('kegiatan').value,
        keberhasilan: document.getElementById('keberhasilan').value,
        perbaikan: document.getElementById('perbaikan').value,
        rtl: document.getElementById('rtl').value,
        catatan: document.getElementById('catatan').value,
        waktu: [],
        absensiData: []
    };

    document.querySelectorAll('input[name="waktu"]:checked').forEach(cb => data.waktu.push(cb.value));
    document.querySelectorAll('.absen-select').forEach(sel => {
        data.absensiData.push({ nama: sel.getAttribute('data-nama'), status: sel.value });
    });

    let fileInput = document.getElementById('buktiKBM');
    if(fileInput.files.length > 0) {
        let reader = new FileReader();
        reader.readAsDataURL(fileInput.files[0]);
        reader.onload = function(e) {
            data.fileData = reader.result.split(',')[1];
            data.fileName = fileInput.files[0].name;
            data.mimeType = fileInput.files[0].type;
            kirimKeGoogle(data, btn);
        }
    } else {
        alert("Wajib upload Foto Bukti KBM!");
        btn.innerHTML = 'UPLOAD DATA <i class="fa-solid fa-rocket"></i>';
        btn.disabled = false;
    }
}

function kirimKeGoogle(payload, btn) {
    fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
    })
    .then(async res => {
        const rawText = await res.text();
        let response;
        try {
            response = JSON.parse(rawText);
        } catch (e) {
            // Jika respon bukan JSON, artinya GAS crash / error sistemik
            console.error("Raw response:", rawText);
            throw new Error("SERVER_ERROR_HTML");
        }
        return response;
    })
    .then(response => {
        if (response.status === 'success' || response.status === 'SUKSES') {
            Swal.fire({
                title: 'Berhasil!',
                text: response.message || 'Data jurnal Anda telah tersimpan dengan sukses.',
                icon: 'success',
                confirmButtonColor: '#0284c7',
                confirmButtonText: 'Mantap!'
            }).then(() => {
                location.reload();
            });
        } else {
            // Backend secara sadar menolak/gagal menyimpan data
            Swal.fire({
                icon: 'error',
                title: 'Gagal Disimpan!',
                text: response.message || 'Data tidak dapat disimpan oleh sistem.',
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'Periksa Kembali'
            });
            btn.innerHTML = 'UPLOAD DATA <i class="fa-solid fa-rocket"></i>';
            btn.disabled = false;
        }
    })
    .catch(err => {
        console.error("Error Detail:", err);
        
        let msg = 'Terjadi kesalahan jaringan atau waktu tunggu habis.';
        if (err.message === "SERVER_ERROR_HTML") {
            msg = 'Server mengalami kendala saat memproses gambar/email. Harap hubungi Admin untuk memastikan data masuk sebelum menginput ulang.';
        }

        Swal.fire({
            icon: 'error',
            title: 'Sistem Tidak Merespon',
            text: msg,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Tutup'
        });
        
        btn.innerHTML = 'UPLOAD DATA <i class="fa-solid fa-rocket"></i>';
        btn.disabled = false;
    });
}

// 4. OTOMATIS SIMPAN EMAIL DI STORAGE
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('emailGuru');
    if (emailInput) {
        const emailTersimpan = localStorage.getItem('emailGuruTersimpan');
        if (emailTersimpan) {
            emailInput.value = emailTersimpan;
        }
        emailInput.addEventListener('input', function() {
            localStorage.setItem('emailGuruTersimpan', this.value);
        });
    }
});

// 5. FITUR KAMERA & GALERI + AUTO KOMPRES FOTO
const inputKamera = document.getElementById('inputKamera');
const inputGaleri = document.getElementById('inputGaleri');
const buktiKBM = document.getElementById('buktiKBM');
const namaFilePilihan = document.getElementById('namaFilePilihan');

function prosesDanKompresFile(file) {
    if (!file) return;

    if(namaFilePilihan) {
        namaFilePilihan.innerText = "⏳ Sedang mengompres foto...";
        namaFilePilihan.style.color = "#0284c7";
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function() {
            const MAX_WIDTH = 1024;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(function(blob) {
                const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                });

                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(compressedFile);
                buktiKBM.files = dataTransfer.files;

                const ukuranKB = (blob.size / 1024).toFixed(1);
                if(namaFilePilihan) {
                    namaFilePilihan.innerText = `✔ Foto berhasil dipilih (${ukuranKB} KB)`;
                    namaFilePilihan.style.color = "#16a34a";
                }
            }, 'image/jpeg', 0.7);
        };
    };
}

if(inputKamera) {
    inputKamera.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            prosesDanKompresFile(e.target.files[0]);
        }
    });
}

if(inputGaleri) {
    inputGaleri.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            prosesDanKompresFile(e.target.files[0]);
        }
    });
}
