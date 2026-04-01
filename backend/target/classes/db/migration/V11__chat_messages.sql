CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  role role_type NOT NULL,
  content TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL DEFAULT TRUE,
  tool_name VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_user_created_at ON chat_messages(user_id, created_at);
