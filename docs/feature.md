saya mempunyai front-end untuk mainline 
di Line Areas sesuaikan dengan milik user yang ada Production Line Areas dan lihat di Production line untuk milik user yang mana yang diambil name untuk ditampilkan diline areas tampilan operator 
Begitupun di quarantines 
sesuai dengan quarantine user contohnya quarantine utara 1 ngambil dari table line areas mengambil Quarantine Line 

untuk 

Ambil FG = liftshelf122  
"taskOrderDetail": [
				{   
					"taskPath":"L3CPA,FGA,EPA,L3CPA"		 
				}
			]
         
         untuk data yang diambil sesuai data Production Line Areas nama dan atribut yang sesuai dari nama Production Line Areas
         taskPath: iRayple Location Code, EXIM Location,	Empty Pallet Locationi,Rayple Location Code



Not Standard = liftshelf122
"taskOrderDetail": [
				{   
					"taskPath":"L3CPA,QU1,EPA,L3CPA"		 
				}
			]
         
         untuk data yang diambil sesuai data Production Line Areas nama dan atribut yang sesuai dari nama Production Line Areas
         taskPath: iRayple Location Code, iRayple Location Code
(dari table Quarantine Areas),	Empty Pallet Locationi,Rayple Location Code

saya ingin nantinya ketika release task nantinya akan generate taskId = order_id dari timestamp
Task ID	Task Action	Robot	Operator	Status	Created At


Konfigurasikan dengan backend 

import requests
import time
from datetime import datetime

# URL endpoint
url = "http://172.18.101.10:7000/ics/taskOrder/addTask"  # Ganti IP dengan alamat server yang sesuai
order_id = datetime.now().strftime("%Y%m%d%H%M%S")  # Order ID dari timestamp

# Data payload
payload = {
			"modelProcessCode": "liftshelf122",
			"priority": 6,
			"fromSystem":"MES",
			"orderId": order_id,
			"taskOrderDetail": [
				{   
					"taskPath":"L3CPA,FGA,EPA,L3CPA"		 
				}
			]
		}

# Header permintaan
headers = {
    "Content-Type": "application/json"
}

# Kirim permintaan POST
response = requests.post(url, headers=headers, json=payload)

# Periksa hasil respons
if response.status_code == 200:
    print("Task berhasil dikirim!")
    print("Respons:", response.json())
else:
    print(f"Error: {response.status_code}")
    print("Detail:", response.text)


berikan solusi terbaiknya gimana 