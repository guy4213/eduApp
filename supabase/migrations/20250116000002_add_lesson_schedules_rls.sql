-- Add RLS policies for lesson_schedules table
-- This allows instructors to create lesson_schedule records when needed for lesson reports

-- Enable RLS on lesson_schedules table if not already enabled
ALTER TABLE public.lesson_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Instructors can create lesson schedules for their courses" ON public.lesson_schedules;
DROP POLICY IF EXISTS "Admins can manage all lesson schedules" ON public.lesson_schedules;
DROP POLICY IF EXISTS "Anyone can view lesson schedules" ON public.lesson_schedules;

-- Create policy for admins and pedagogical managers (full access)
CREATE POLICY "Admins and pedagogical managers can manage all lesson schedules"
ON public.lesson_schedules
FOR ALL
TO authenticated
USING (
  public.get_current_user_role() IN ('admin', 'pedagogical_manager')
);

-- Create policy for instructors (can create lesson schedules for their assigned course instances)
CREATE POLICY "Instructors can create lesson schedules for their courses"
ON public.lesson_schedules
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() = 'instructor' AND
  course_instance_id IN (
    SELECT ci.id
    FROM public.course_instances ci
    WHERE ci.instructor_id = auth.uid()
  )
);

-- Create policy for instructors (can view lesson schedules for their assigned course instances)
CREATE POLICY "Instructors can view lesson schedules for their courses"
ON public.lesson_schedules
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() = 'instructor' AND
  course_instance_id IN (
    SELECT ci.id
    FROM public.course_instances ci
    WHERE ci.instructor_id = auth.uid()
  )
);

-- Create policy for anyone to view lesson schedules (for backward compatibility)
CREATE POLICY "Anyone can view lesson schedules"
ON public.lesson_schedules
FOR SELECT
TO authenticated
USING (true);