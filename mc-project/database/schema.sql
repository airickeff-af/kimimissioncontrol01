-- MC Project Database Schema
-- PostgreSQL

-- Health tracking table
CREATE TABLE health_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'exercise', 'sleep', 'nutrition'
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wealth tracking table
CREATE TABLE wealth_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'savings', 'investment', 'gig'
    amount DECIMAL(10, 2) NOT NULL,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Character stats mapping
CREATE TABLE character_stats (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    health_score INTEGER DEFAULT 50,
    wealth_score INTEGER DEFAULT 50,
    energy_score INTEGER DEFAULT 50,
    mood_score INTEGER DEFAULT 50,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GLB model metadata
CREATE TABLE character_models (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    version VARCHAR(50) DEFAULT '1.0.0',
    rig_data JSONB,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_health_logs_user ON health_logs(user_id);
CREATE INDEX idx_health_logs_type ON health_logs(type);
CREATE INDEX idx_wealth_logs_user ON wealth_logs(user_id);
CREATE INDEX idx_wealth_logs_type ON wealth_logs(type);

-- Initial data
INSERT INTO character_stats (user_id, health_score, wealth_score, energy_score, mood_score)
VALUES ('default', 50, 50, 50, 50);
