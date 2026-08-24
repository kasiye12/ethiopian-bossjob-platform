-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- Create enum types
CREATE TYPE user_role AS ENUM ('candidate', 'boss', 'admin', 'super_admin');
CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed', 'archived');
CREATE TYPE thread_status AS ENUM ('open', 'screening', 'interview_scheduled', 'offer_extended', 'accepted', 'rejected', 'expired');
CREATE TYPE message_type AS ENUM ('text', 'voice', 'image', 'file', 'offer_card', 'interview_invite', 'system');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
CREATE TYPE verification_status AS ENUM ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected');
