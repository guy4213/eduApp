-- Add lesson cancellation and rescheduling system
-- This migration adds support for cancelling lessons and automatically rescheduling subsequent lessons

-- Create lesson_cancellations table to track cancelled lessons
CREATE TABLE IF NOT EXISTS public.lesson_cancellations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_instance_id UUID NOT NULL REFERENCES public.course_instances(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    original_scheduled_date DATE NOT NULL,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES public.profiles(id),
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_rescheduled BOOLEAN DEFAULT FALSE,
    rescheduled_to_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lesson_cancellations_course_instance_id 
ON public.lesson_cancellations(course_instance_id);

CREATE INDEX IF NOT EXISTS idx_lesson_cancellations_lesson_id 
ON public.lesson_cancellations(lesson_id);

CREATE INDEX IF NOT EXISTS idx_lesson_cancellations_original_date 
ON public.lesson_cancellations(original_scheduled_date);

CREATE INDEX IF NOT EXISTS idx_lesson_cancellations_cancelled_at 
ON public.lesson_cancellations(cancelled_at);

-- Enable RLS on the new table
ALTER TABLE public.lesson_cancellations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lesson_cancellations
CREATE POLICY "Users can view lesson_cancellations" ON public.lesson_cancellations
    FOR SELECT USING (true);

CREATE POLICY "Instructors and admins can insert lesson_cancellations" ON public.lesson_cancellations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pedagogical_manager', 'instructor')
        )
    );

CREATE POLICY "Instructors and admins can update lesson_cancellations" ON public.lesson_cancellations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pedagogical_manager', 'instructor')
        )
    );

CREATE POLICY "Admins can delete lesson_cancellations" ON public.lesson_cancellations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'pedagogical_manager')
        )
    );

-- Add updated_at trigger
CREATE TRIGGER update_lesson_cancellations_updated_at 
    BEFORE UPDATE ON public.lesson_cancellations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add cancellation_reason column to lesson_reports for backward compatibility
ALTER TABLE public.lesson_reports 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add is_cancelled column to lesson_reports for quick status check
ALTER TABLE public.lesson_reports 
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- Create function to cancel a lesson and reschedule subsequent lessons
CREATE OR REPLACE FUNCTION cancel_lesson_and_reschedule(
    p_course_instance_id UUID,
    p_lesson_id UUID,
    p_original_date DATE,
    p_cancellation_reason TEXT DEFAULT NULL,
    p_cancelled_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_cancellation_id UUID;
    v_affected_lessons INTEGER := 0;
BEGIN
    -- Insert cancellation record
    INSERT INTO public.lesson_cancellations (
        course_instance_id,
        lesson_id,
        original_scheduled_date,
        cancellation_reason,
        cancelled_by
    ) VALUES (
        p_course_instance_id,
        p_lesson_id,
        p_original_date,
        p_cancellation_reason,
        COALESCE(p_cancelled_by, auth.uid())
    ) RETURNING id INTO v_cancellation_id;

    -- Mark any existing lesson report as cancelled
    UPDATE public.lesson_reports 
    SET 
        is_completed = FALSE,
        is_cancelled = TRUE,
        cancellation_reason = p_cancellation_reason,
        updated_at = NOW()
    WHERE course_instance_id = p_course_instance_id
    AND EXISTS (
        SELECT 1 FROM public.reported_lesson_instances rli
        WHERE rli.lesson_report_id = lesson_reports.id
        AND rli.lesson_id = p_lesson_id
        AND rli.scheduled_date = p_original_date
    );

    -- Count affected lessons (this is informational)
    -- The actual rescheduling will be handled by the frontend logic
    -- since it needs to regenerate the schedule pattern
    
    SELECT json_build_object(
        'success', true,
        'cancellation_id', v_cancellation_id,
        'message', 'Lesson cancelled successfully. Subsequent lessons will be rescheduled automatically.',
        'affected_lessons', v_affected_lessons
    ) INTO v_result;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        SELECT json_build_object(
            'success', false,
            'error', SQLERRM,
            'message', 'Failed to cancel lesson'
        ) INTO v_result;
        
        RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get cancellation history for a course instance
CREATE OR REPLACE FUNCTION get_cancellation_history(
    p_course_instance_id UUID
) RETURNS TABLE (
    cancellation_id UUID,
    lesson_title TEXT,
    original_date DATE,
    cancellation_reason TEXT,
    cancelled_by_name TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    is_rescheduled BOOLEAN,
    rescheduled_to_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lc.id,
        l.title,
        lc.original_scheduled_date,
        lc.cancellation_reason,
        p.full_name,
        lc.cancelled_at,
        lc.is_rescheduled,
        lc.rescheduled_to_date
    FROM public.lesson_cancellations lc
    JOIN public.lessons l ON lc.lesson_id = l.id
    LEFT JOIN public.profiles p ON lc.cancelled_by = p.id
    WHERE lc.course_instance_id = p_course_instance_id
    ORDER BY lc.cancelled_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to explain the new system
COMMENT ON TABLE public.lesson_cancellations IS 'Tracks cancelled lessons and their rescheduling status. Works with the course_instance_schedules pattern system.';
COMMENT ON COLUMN public.lesson_cancellations.original_scheduled_date IS 'The original date when the lesson was supposed to occur';
COMMENT ON COLUMN public.lesson_cancellations.is_rescheduled IS 'Whether this cancellation resulted in rescheduling subsequent lessons';
COMMENT ON COLUMN public.lesson_cancellations.rescheduled_to_date IS 'If rescheduled, the new date for this specific lesson';

COMMENT ON FUNCTION cancel_lesson_and_reschedule IS 'Cancels a lesson and marks it for rescheduling. Returns success/error status.';
COMMENT ON FUNCTION get_cancellation_history IS 'Returns the cancellation history for a course instance with lesson and user details.';