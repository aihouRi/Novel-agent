ALTER TABLE user_ai_settings
    ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'openai' AFTER user_id,
    ADD COLUMN gemini_api_key_encrypted TEXT NOT NULL AFTER openai_model,
    ADD COLUMN gemini_base_url VARCHAR(255) NOT NULL AFTER gemini_api_key_encrypted,
    ADD COLUMN gemini_model VARCHAR(100) NOT NULL AFTER gemini_base_url;
