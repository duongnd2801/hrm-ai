import psycopg2

try:
    conn = psycopg2.connect(
        dbname='hrm_db',
        user='postgres',
        password='1234$',
        host='localhost',
        port='5432'
    )
    cur = conn.cursor()
    # Delete records with no punches on weekends (0=Sunday, 6=Saturday)
    sql = "DELETE FROM hrm.attendances WHERE check_in IS NULL AND check_out IS NULL AND (EXTRACT(DOW FROM date) = 0 OR EXTRACT(DOW FROM date) = 6)"
    cur.execute(sql)
    deleted_count = cur.rowcount
    
    # Also fix potential LATE/ABSENT logic for weekends in case they remain
    # (Though deleting them is better if they have no hours)
    
    conn.commit()
    print(f'Done! Deleted {deleted_count} incorrect weekend records.')
    cur.close()
    conn.close()
except Exception as e:
    print(f'Error: {e}')
