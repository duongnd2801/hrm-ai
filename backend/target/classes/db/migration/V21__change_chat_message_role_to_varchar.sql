ALTER TABLE hrm.chat_messages
    ALTER COLUMN role TYPE VARCHAR(100)
    USING role::text;
