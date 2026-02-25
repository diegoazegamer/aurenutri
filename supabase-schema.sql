-- Supabase Database Schema

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    whatsapp TEXT,
    birth_date TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    uf TEXT,
    gender TEXT,
    height NUMERIC,
    weight NUMERIC,
    objective TEXT,
    activity_level TEXT,
    dietary_restrictions JSONB,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Consultations Table
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    notes TEXT,
    planner BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Medical Requests Table
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'Pendente',
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Doctors can manage their own patients" ON public.patients
    FOR ALL
    USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can manage their patients consultations" ON public.consultations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = consultations.patient_id
            AND patients.doctor_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can manage their patients requests" ON public.requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.patients
            WHERE patients.id = requests.patient_id
            AND patients.doctor_id = auth.uid()
        )
    );
