-- Create tax_profiles table
CREATE TABLE IF NOT EXISTS tax_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    salary NUMERIC DEFAULT 0,
    other_income NUMERIC DEFAULT 0,
    tds NUMERIC DEFAULT 0,
    section_80c NUMERIC DEFAULT 0,
    section_80d_self NUMERIC DEFAULT 0,
    section_80d_parents NUMERIC DEFAULT 0,
    parents_senior BOOLEAN DEFAULT false,
    home_loan_interest NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tax_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own tax profiles" ON tax_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax profiles" ON tax_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax profiles" ON tax_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax profiles" ON tax_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function
CREATE TRIGGER update_tax_profiles_updated_at
    BEFORE UPDATE ON tax_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
