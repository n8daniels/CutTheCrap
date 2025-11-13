-- CutTheCrap Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'verified_author', 'user')),
  party VARCHAR(50) CHECK (party IN ('democratic', 'republican', 'independent')),
  title VARCHAR(255),
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Bills
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number VARCHAR(50) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  sponsor VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  congress INTEGER NOT NULL,
  chamber VARCHAR(50) NOT NULL,
  introduced_date DATE,
  last_action_date DATE,
  summary TEXT,
  big_picture JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bills_number ON bills(number);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_congress ON bills(congress);

-- Bill Sections
CREATE TABLE bill_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  section_number VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  preview TEXT,
  simplified_summary TEXT NOT NULL,
  deep_dive JSONB,
  ideology_score INTEGER CHECK (ideology_score BETWEEN -5 AND 5),
  political_lean INTEGER CHECK (political_lean BETWEEN -5 AND 5),
  economic_tags TEXT[],
  risk_notes TEXT[],
  raw_text TEXT,
  content_hash VARCHAR(64) NOT NULL,
  section_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bill_id, section_number)
);

CREATE INDEX idx_bill_sections_bill_id ON bill_sections(bill_id);
CREATE INDEX idx_bill_sections_content_hash ON bill_sections(content_hash);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  chamber VARCHAR(50) NOT NULL,
  vote_date DATE NOT NULL,
  result VARCHAR(50) NOT NULL,
  yeas INTEGER NOT NULL,
  nays INTEGER NOT NULL,
  present INTEGER DEFAULT 0,
  not_voting INTEGER DEFAULT 0,
  breakdown JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_votes_bill_id ON votes(bill_id);

-- Partisan Perspectives
CREATE TABLE partisan_perspectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  party VARCHAR(50) NOT NULL,
  perspective TEXT NOT NULL,
  key_points TEXT[],
  concerns TEXT[],
  supports TEXT[],
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bill_id, party)
);

CREATE INDEX idx_partisan_perspectives_bill_id ON partisan_perspectives(bill_id);
CREATE INDEX idx_partisan_perspectives_author_id ON partisan_perspectives(author_id);

-- Content Cache
CREATE TABLE content_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_hash VARCHAR(64) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  analysis_type VARCHAR(50) NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_content_cache_hash ON content_cache(content_hash);
CREATE INDEX idx_content_cache_expires ON content_cache(expires_at);

-- Audit Log (for security)
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bill_sections_updated_at BEFORE UPDATE ON bill_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partisan_perspectives_updated_at BEFORE UPDATE ON partisan_perspectives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM content_cache WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
