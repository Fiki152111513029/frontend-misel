saya mempunyai quarantine tasks saya ingin menghapus icon detail (mata) dan jika statusnya completed saya ingin menampilkan button release kalau belum completed kosongkan saja, dan harusnya dimainline tepatnya dibagian 
Quarantine

Quarantine Selatan 1

0 = (quarantine areas yang namenya sudah terisi ditable ada di task )/3 = (total quarantine areas yang ada yang dimiliki quarantine selatan )


View Details

dan button release akan menjalankan add task ini 

"taskOrderDetail": [
				{   
					"taskPath":"QS1A,FGA"		 
				}
			]
         
         untuk data yang diambil sesuai data yang ada di halaman quarantine task didalam table tasks
         taskPath: " iRayple Location Code(dari table Quarantine Areas),	 iRayple Location Code(dari table EXIM Location)" 

saya ingin nantinya ketika release nantinya 

menjalankan seperti addtask biasanya kecuali ada beberapa perbedaan 
dari "modelProcessCode": "liftshelf122 (didapatkan dari quarantine lines)",
untuk yang lainnya samakan dengan controllernya add task yang ada ambil not standard seperti itu 