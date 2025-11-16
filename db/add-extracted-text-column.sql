-- Migration to add extracted_text column to existing resumes table
-- Run this if you already have a resumes table and want to add the new column

ALTER TABLE resumes ADD COLUMN IF NOT EXISTS extracted_text TEXT;
