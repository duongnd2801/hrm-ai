import openpyxl
import psycopg2

try:
    # 1. Get more employees from DB
    conn = psycopg2.connect(
        dbname='hrm_db',
        user='postgres',
        password='1234$',
        host='localhost', port='5432'
    )
    conn.set_client_encoding('UTF8')
    cur = conn.cursor()
    # Get 10 employees
    cur.execute("SELECT CAST(id AS TEXT), full_name FROM hrm.employees LIMIT 30;")
    employees = cur.fetchall()
    cur.close()
    conn.close()

    if not employees:
        print("No employees found.")
        exit()

    # 2. Load Excel
    file_path = 'cham_cong_nhan_vien.xlsx'
    wb = openpyxl.load_workbook(file_path)
    ws = wb.active

    # Find the last row
    last_row = ws.max_row
    
    # 3. Add rows for April 13, 14, 15, 16, 17
    new_dates = ['04/05/2026', '05/05/2026','06/05/2026','07/05/2026']
    
    # Random-ish times
    import random
    
    current_row = last_row + 1
    for emp_id, full_name in employees:
        for date_str in new_dates:
            # Skip if date is weekend (Sat/Sun) - though 13-17 are all weekdays
            
            ws.cell(row=current_row, column=1).value = current_row - 5
            ws.cell(row=current_row, column=2).value = emp_id
            ws.cell(row=current_row, column=3).value = full_name
            ws.cell(row=current_row, column=4).value = "Phòng Kỹ Thuật"
            ws.cell(row=current_row, column=5).value = date_str
            
            # Simple check-in/out logic
            ci_hour = random.randint(8, 9)
            ci_min = random.randint(0, 59)
            co_hour = random.randint(17, 19)
            co_min = random.randint(0, 59)
            
            ws.cell(row=current_row, column=7).value = f"{ci_hour:02d}:{ci_min:02d}"
            ws.cell(row=current_row, column=8).value = f"{co_hour:02d}:{co_min:02d}"
            
            current_row += 1

    wb.save(file_path)
    print(f"Done! Added {len(employees) * len(new_dates)} records for 25 employees for May 04-07.")

except Exception as e:
    print(f"Error: {e}")
