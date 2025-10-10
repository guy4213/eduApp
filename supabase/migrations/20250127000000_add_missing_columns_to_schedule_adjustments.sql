-- Add missing columns to schedule_adjustments table
-- This migration adds lesson_number and new_scheduled_date columns that are referenced in the code

-- First, create the table if it doesn't exist (it might not exist yet)
CREATE TABLE IF NOT EXISTS public.schedule_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_instance_id UUID NOT NULL REFERENCES public.course_instances(id) ON DELETE CASCADE,
    original_scheduled_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    adjustment_type TEXT NOT NULL DEFAULT 'POSTPONED'
);

-- Add the missing columns
ALTER TABLE public.schedule_adjustments 
ADD COLUMN IF NOT EXISTS lesson_number INTEGER,
ADD COLUMN IF NOT EXISTS new_scheduled_date DATE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_adjustments_course_instance_id 
ON public.schedule_adjustments(course_instance_id);

CREATE INDEX IF NOT EXISTS idx_schedule_adjustments_original_date 
ON public.schedule_adjustments(original_scheduled_date);

CREATE INDEX IF NOT EXISTS idx_schedule_adjustments_new_date 
ON public.schedule_adjustments(new_scheduled_date);

-- Enable RLS on the table
ALTER TABLE public.schedule_adjustments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for schedule_adjustments
CREATE POLICY "Users can view schedule_adjustments" ON public.schedule_adjustments
    FOR SELECT USING (true);

CREATE POLICY "Instructors can insert schedule_adjustments for their courses" ON public.schedule_adjustments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.course_instances ci
            JOIN public.course_instance_instructors cii ON ci.id = cii.course_instance_id
            WHERE ci.id = course_instance_id 
            AND cii.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can insert schedule_adjustments" ON public.schedule_adjustments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pedagogical_manager')
        )
    );

CREATE POLICY "Instructors can update schedule_adjustments for their courses" ON public.schedule_adjustments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.course_instances ci
            JOIN public.course_instance_instructors cii ON ci.id = cii.course_instance_id
            WHERE ci.id = course_instance_id 
            AND cii.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can update schedule_adjustments" ON public.schedule_adjustments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pedagogical_manager')
        )
    );

CREATE POLICY "Instructors can delete schedule_adjustments for their courses" ON public.schedule_adjustments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.course_instances ci
            JOIN public.course_instance_instructors cii ON ci.id = cii.course_instance_id
            WHERE ci.id = course_instance_id 
            AND cii.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can delete schedule_adjustments" ON public.schedule_adjustments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pedagogical_manager')
        )
    );

-- Add comments
COMMENT ON TABLE public.schedule_adjustments IS 'Stores schedule adjustments for course instances, such as postponed lessons';
COMMENT ON COLUMN public.schedule_adjustments.lesson_number IS 'The lesson number that was adjusted';
COMMENT ON COLUMN public.schedule_adjustments.original_scheduled_date IS 'The original scheduled date of the lesson';
COMMENT ON COLUMN public.schedule_adjustments.new_scheduled_date IS 'The new scheduled date after adjustment';
COMMENT ON COLUMN public.schedule_adjustments.adjustment_type IS 'Type of adjustment (POSTPONED, CANCELLED, etc.)';