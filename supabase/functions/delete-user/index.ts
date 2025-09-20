
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// --- Hardcoded Keys ---
const SUPABASE_URL = "https://icwidsqbydgycuedhznc.supabase.co";
const BREVO_API_KEY = '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';

// ❗️❗️❗️ זה השינוי הקריטי. חובה להשתמש במפתח SERVICE_ROLE למחיקת משתמשים ❗️❗️❗️
// ❗️❗️❗️ העתק את המפתח המלא מ-Settings -> API -> Service Role Key ❗️❗️❗️
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2lkc3FieWRneWN1ZWRoem5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIzODgwOCwiZXhwIjoyMDY1ODE0ODA4fQ.9e51Ar_0zG9O6lN5_rJLnr7mpTgaqA78iGnh3bOhQ9s"

interface Assignment {
  course_name: string;
  institution_name: string;
}

interface DeletePayload {
  userId: string;
  instructorName: string;
  assignments: Assignment[];
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: DeletePayload = await req.json();
    if (!payload.userId || !payload.instructorName) {
        throw new Error("Missing userId or instructorName in payload.");
    }

    // ⭐⭐⭐ יוצרים לקוח עם הרשאות אדמין באמצעות מפתח ה-SERVICE_ROLE ⭐⭐⭐
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase ADMIN client created successfully.');

    // --- Part 1: Send Notification Email ---
     console.log('📞 Fetching admin emails from get_admin_emails()');
    const { data: adminEmailsData, error: adminError } = await supabaseAdmin
      .rpc('get_admin_emails');

    if (adminError) {
      console.error('❌ Failed to get admin emails:', adminError);
      return new Response(JSON.stringify({ error: 'Failed to fetch admin emails', details: adminError }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const adminEmails = adminEmailsData?.map((row: { email: string }) => row.email) || [];
  

      if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ message: 'No admin emails configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log(`📬 Admin emails found: ${adminEmails.length}`, adminEmails);
    if (adminEmails.length > 0) {
        const subject = `התראה: המדריך ${payload.instructorName} הוסר מהמערכת`;
        const assignmentsHtml = payload.assignments.length > 0
            ? `<ul>${payload.assignments.map(a => `<li><b>${a.course_name}</b> במוסד ${a.institution_name}</li>`).join('')}</ul>`
            : "<p>לא היו למדריך זה הקצאות פעילות.</p>";
        const htmlContent = `<div dir="rtl"><h2>התראה על הסרת מדריך</h2><p>המדריך <strong>${payload.instructorName}</strong> הוסר מהמערכת.</p><p>הקצאות משויכות:</p>${assignmentsHtml}</div>`;
        const emailPayload = {
            sender: { name: "Leaders Admin System", email: "fransesguy1@gmail.com" },
            to: [{ email: adminEmails[0], name: "Admin" }],
            subject: subject,
            htmlContent: htmlContent
        };
        
        await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'accept': 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json' },
            body: JSON.stringify(emailPayload)
        });
        console.log('✅ Notification email sent.');
    }

    // --- Part 2: Securely Delete the User ---
    console.log(`🔥 Deleting user with ID: ${payload.userId}`);
    
    // Step A: Delete from auth.users (requires SERVICE_ROLE_KEY)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(payload.userId);
    if (authError && authError.message !== 'User not found') {
        throw authError;
    }

    // Step B: Delete from public.profiles table
    const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', payload.userId);
    if (profileError) {
        throw profileError;
    }

    console.log('✅ User successfully deleted from auth and profiles.');

    return new Response(JSON.stringify({ message: "Process complete." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.log(`💥 CRITICAL ERROR: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});