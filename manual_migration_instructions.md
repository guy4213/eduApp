# Manual Migration Instructions

The `schedule_adjustments` table is missing the required columns `lesson_number` and `new_scheduled_date`. 

## To fix this issue:

1. Go to the Supabase Dashboard: https://supabase.com/dashboard/project/icwidsqbydgycuedhznc/sql
2. Run the following SQL in the SQL Editor:

```sql
-- Add missing columns to schedule_adjustments table
ALTER TABLE public.schedule_adjustments 
ADD COLUMN IF NOT EXISTS lesson_number INTEGER,
ADD COLUMN IF NOT EXISTS new_scheduled_date DATE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_schedule_adjustments_lesson_number 
ON public.schedule_adjustments(lesson_number);

CREATE INDEX IF NOT EXISTS idx_schedule_adjustments_new_date 
ON public.schedule_adjustments(new_scheduled_date);

-- Add comments
COMMENT ON COLUMN public.schedule_adjustments.lesson_number IS 'The lesson number that was adjusted';
COMMENT ON COLUMN public.schedule_adjustments.new_scheduled_date IS 'The new scheduled date after adjustment';
```

3. After running the SQL, the LessonReport.tsx error should be resolved.

## What this fixes:

- The error "Could not find the 'lesson_number' column of 'schedule_adjustments' in the schema cache" will be resolved
- The schedule adjustment functionality in LessonReport.tsx will work correctly
- Future lessons can be properly postponed with lesson numbers and new dates tracked