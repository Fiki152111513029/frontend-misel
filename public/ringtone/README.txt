Letakkan dua berkas suara ini di folder ini:

  amr.wav         - dibunyikan saat ada permintaan rak kosong yang belum siap
  amr-finish.wav  - dibunyikan saat rak finish good akan dikirim tapi
                    titik tujuannya masih terisi

Keduanya dipanggil dari halaman Checking Area sebagai /ringtone/amr.wav dan
/ringtone/amr-finish.wav. Tanpa berkasnya, notifikasi tetap muncul di layar
dan hanya suaranya yang tidak berbunyi.
