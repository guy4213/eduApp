-- Modify lesson_reports table to support new architecture
-- This allows lesson reports to work with both old and new scheduling systems

-- Add course_instance_id field to lesson_reports table
ALTER TABLE public.lesson_reports 
ADD COLUMN IF NOT EXISTS course_instance_id UUID REFERENCES public.course_instances(id);

-- Make lesson_schedule_id nullable to support new architecture
ALTER TABLE public.lesson_reports 
ALTER COLUMN lesson_schedule_id DROP NOT NULL;

-- Add a check constraint to ensure at least one of lesson_schedule_id or course_instance_id is provided
ALTER TABLE public.lesson_reports 
ADD CONSTRAINT lesson_reports_schedule_check 
CHECK (lesson_schedule_id IS NOT NULL OR course_instance_id IS NOT NULL);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_reports_course_instance_id 
ON public.lesson_reports(course_instance_id);

-- Add index for combined queries
CREATE INDEX IF NOT EXISTS idx_lesson_reports_schedule_lookup 
ON public.lesson_reports(lesson_schedule_id, course_instance_id);