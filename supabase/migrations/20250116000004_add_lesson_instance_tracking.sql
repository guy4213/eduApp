-- Add lesson instance tracking for reporting status
-- This allows us to track which specific lesson instances have been reported
-- Works with both old (lesson_schedules) and new (course_instance_schedules) architectures

-- Create a table to track reported lesson instances
CREATE TABLE IF NOT EXISTS public.reported_lesson_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_report_id UUID REFERENCES public.lesson_reports(id) ON DELETE CASCADE,
    course_instance_id UUID REFERENCES public.course_instances(id),
    lesson_id UUID REFERENCES public.lessons(id),
    lesson_schedule_id UUID REFERENCES public.lesson_schedules(id),
    lesson_number INTEGER, -- For new architecture: which lesson number in the sequence
    scheduled_date DATE, -- The actual date when the lesson was scheduled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reported_lesson_instances_course_instance 
ON public.reported_lesson_instances(course_instance_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_reported_lesson_instances_lesson_schedule 
ON public.reported_lesson_instances(lesson_schedule_id);

CREATE INDEX IF NOT EXISTS idx_reported_lesson_instances_date 
ON public.reported_lesson_instances(scheduled_date);

-- Enable RLS
ALTER TABLE public.reported_lesson_instances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view reported lesson instances" ON public.reported_lesson_instances
    FOR SELECT USING (true);

CREATE POLICY "Instructors can create reported lesson instances for their courses" ON public.reported_lesson_instances
    FOR INSERT WITH CHECK (
        public.get_current_user_role() = 'instructor' AND
        course_instance_id IN (
            SELECT ci.id FROM public.course_instances ci 
            WHERE ci.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all reported lesson instances" ON public.reported_lesson_instances
    FOR ALL USING (
        public.get_current_user_role() IN ('admin', 'pedagogical_manager')
    );