// supabase/functions/notify-admins-on-feedback/index.ts
// EmailJS version - NO RESTRICTIONS, sends to ANY email!

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const SUPABASE_URL = "https://icwidsqbydgycuedhznc.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2lkc3FieWRneWN1ZWRoem5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyMzg4MDgsImV4cCI6MjA2NTgxNDgwOH0.kRaeJco9gDVBzWzeU9fOHjkXz4O0hmsie2b_Zu7U6Is";

interface FeedbackPayload {
  courseName: string;
  lessonTitle: string;
  lessonNumber: number;
  participantsCount: number;
  notes: string;
  feedback: string;
  marketingConsent: boolean;
  instructorName: string;
}

Deno.serve(async (req) => {
  console.log(`=== ULTRA DEBUG START ===`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Request method: ${req.method}`);
  
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    });
  }

  try {
    // Parse request body
    const payload: FeedbackPayload = await req.json();
    console.log('✅ Request payload parsed successfully');
    console.log(`Course: ${payload.courseName}`);
    console.log(`Lesson: ${payload.lessonTitle}`);
    console.log(`Instructor: ${payload.instructorName}`);
    console.log(`Feedback: ${payload.feedback}`);

    // Create Supabase client
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
    console.log('✅ Supabase client created');

    // Call the database function to get admin emails
    console.log('👥 Calling get_admin_emails() database function...');
    const { data: adminEmailsData, error: adminError } = await supabaseAdmin
      .rpc('get_admin_emails');

    if (adminError) {
      console.log(`❌ Error calling get_admin_emails function: ${adminError.message}`);
      console.log(`Admin error details:`, adminError);
      return new Response(JSON.stringify({ error: 'Admin email function failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`📧 Admin emails function result:`);
    console.log(`- Raw data from function:`, adminEmailsData);

    // Extract emails from the function result
    const adminEmails = adminEmailsData?.map((row: { email: string }) => row.email) || [];
    
    console.log(`📬 Admin emails found: ${adminEmails.length}`);
    console.log(`Admin email addresses:`, adminEmails);

    if (adminEmails.length === 0) {
      console.log("⚠️ NO ADMIN EMAILS FOUND!");
      return new Response(JSON.stringify({ 
        message: "No admin emails found",
        adminEmailsData: adminEmailsData
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Prepare email content
    const subject = `משוב שלילי על שיעור: ${payload.lessonTitle} - ${payload.courseName}`;
    const textContent = `
משוב שלילי התקבל על שיעור

המדריך ${payload.instructorName} דיווח שהשיעור הבא לא התנהל כשורה.

פרטי הדיווח:
- קורס: ${payload.courseName}
- כותרת שיעור: ${payload.lessonTitle}  
- מספר שיעור: ${payload.lessonNumber}
- מספר משתתפים: ${payload.participantsCount}
- הערות כלליות: ${payload.notes || 'אין'}
- משוב (סיבת הבעיה): ${payload.feedback}
- הסכמה לשיווק: ${payload.marketingConsent ? 'כן' : 'לא'}

תאריך הדיווח: ${new Date().toLocaleString('he-IL')}
    `;

    console.log('📨 Email content prepared');
    console.log(`Subject: ${subject}`);
    console.log(`Recipients: ${adminEmails.join(', ')}`);
    
    // SEND TO ALL ADMIN EMAILS USING BREVO (formerly Sendinblue) - NO RESTRICTIONS!
    console.log('📤 SENDING EMAILS TO ALL ADMINS - NO DOMAIN REQUIRED!');
    
    const emailResults: any = [];
    
    // Brevo API key - you'll need to get this from brevo.com (free account)
    const BREVO_API_KEY = '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';
    
    for (const email of adminEmails) {
      try {
        console.log(`📧 Sending email to: ${email}`);
        
        const emailPayload = {
          sender: {
            name: "Course Admin System",
            email: "fransesguy1@gmail.com"  // Your email as sender
          },
          to: [
            {
              email: email,
              name: "Admin"
            }
          ],
          subject: subject,
          textContent: textContent
        };
        
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Email sent successfully to ${email}. ID: ${result.messageId}`);
          emailResults.push({
            email,
            status: 'sent',
            messageId: result.messageId,
            message: 'Email sent successfully'
          });
        } else {
          const error = await response.json();
          console.log(`❌ Failed to send email to ${email}:`, error);
          emailResults.push({
            email,
            status: 'failed',
            error: error.message || 'Unknown error',
            message: `Failed to send: ${error.message || 'Unknown error'}`
          });
        }
      } catch (emailError) {
        console.log(`💥 Error sending email to ${email}:`, emailError);
        emailResults.push({
          email,
          status: 'failed',
          error: emailError.message,
          message: `Exception: ${emailError.message}`
        });
      }
    }

    console.log('✅ Email sending completed');
    console.log(`Email results:`, emailResults);
    console.log(`=== ULTRA DEBUG END ===`);
    
    const successCount = emailResults.filter(r => r.status === 'sent').length;
    const failureCount = emailResults.filter(r => r.status === 'failed').length;
    
    return new Response(JSON.stringify({ 
      message: `🚀 Email sending completed. ${successCount} sent, ${failureCount} failed.`,
      adminEmailsFound: adminEmails.length,
      emailResults: emailResults,
      summary: {
        total: adminEmails.length,
        sent: successCount,
        failed: failureCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.log(`💥 CRITICAL ERROR: ${error.message}`);
    console.log(`Error details:`, error);
    console.log(`Error stack:`, error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});