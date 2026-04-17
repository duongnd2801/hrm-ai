import requests
import time

def test_rate_limit():
    url = "http://localhost:8080/api/auth/login"
    payload = {
        "email": "admin@company.com",
        "password": "wrong-password"
    }
    
    print("--- Bắt đầu test Rate Limiting (Brute-force Login) ---")
    print("Giới hạn hiện tại: 10 lần sai trong 10 phút.")
    
    for i in range(1, 16):
        try:
            response = requests.post(url, json=payload)
            status = response.status_code
            
            if status == 429:
                print(f"Lượt {i}: HTTP {status} - [CHẶN THÀNH CÔNG] - {response.text}")
            elif status == 401:
                print(f"Lượt {i}: HTTP {status} - [CHO PHÉP] - Sai mật khẩu (chưa vượt ngưỡng)")
            else:
                print(f"Lượt {i}: HTTP {status} - {response.text}")
                
        except Exception as e:
            print(f"Lượt {i}: Lỗi kết nối: {e}")
            break
            
    print("--- Kết thúc test ---")

if __name__ == "__main__":
    # Đảm bảo bạn đã cài đặt thư viện 'requests' qua: pip install requests
    test_rate_limit()
