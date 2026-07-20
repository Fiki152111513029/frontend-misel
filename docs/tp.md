saya mempunyai front-end untuk warehouse-control 
di bagian Warehouse Line Locations diambil dari Line Locations atribut name tampilkan sesuaikan dengan data yang ada diline locations

liftshelf122  
"taskOrderDetail": [
				{   
					"taskPath":"WHA,L5BPA,L5BPB,WHA"		 
				}
			]
         
         untuk data yang diambil dari atribut table Operator Locations dan Line Locations
         taskPath: location code( Operator Locations ), Dropping Location Code(Line Locations), Picking Location Code (Dropping Location Code),location code( Operator Locations )

saya ingin nantinya ketika release task nantinya akan generate taskId = order_id dari WHT-timestamp
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


kenapa ketika saya release cart kok tidak bisa coba tampilkan responsenya saya mengirim nya benar apa tidak ke endpointnya dan hasil dari release cart ada apa saja yang masuk