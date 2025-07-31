-- Create curriculum_lessons table for lesson templates
CREATE TABLE IF NOT EXISTS public.curriculum_lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create curriculum_tasks table for task templates
CREATE TABLE IF NOT EXISTS public.curriculum_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    curriculum_lesson_id UUID NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    estimated_duration INTEGER DEFAULT 30,
    is_mandatory BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_course_id ON public.curriculum_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_lessons_order_index ON public.curriculum_lessons(order_index);
CREATE INDEX IF NOT EXISTS idx_curriculum_tasks_lesson_id ON public.curriculum_tasks(curriculum_lesson_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_tasks_order_index ON public.curriculum_tasks(order_index);

-- Enable RLS
ALTER TABLE public.curriculum_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for curriculum_lessons
CREATE POLICY "Anyone can view curriculum lessons" 
ON public.curriculum_lessons 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Only admin and pedagogical_manager can create curriculum lessons" 
ON public.curriculum_lessons 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() IN ('admin', 'pedagogical_manager'));

CREATE POLICY "Only admin and pedagogical_manager can update curriculum lessons" 
ON public.curriculum_lessons 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'pedagogical_manager'));

CREATE POLICY "Only admin and pedagogical_manager can delete curriculum lessons" 
ON public.curriculum_lessons 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'pedagogical_manager'));

-- Create policies for curriculum_tasks
CREATE POLICY "Anyone can view curriculum tasks" 
ON public.curriculum_tasks 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Only admin and pedagogical_manager can create curriculum tasks" 
ON public.curriculum_tasks 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_current_user_role() IN ('admin', 'pedagogical_manager'));

CREATE POLICY "Only admin and pedagogical_manager can update curriculum tasks" 
ON public.curriculum_tasks 
FOR UPDATE 
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'pedagogical_manager'));

CREATE POLICY "Only admin and pedagogical_manager can delete curriculum tasks" 
ON public.curriculum_tasks 
FOR DELETE 
TO authenticated
USING (public.get_current_user_role() IN ('admin', 'pedagogical_manager'));