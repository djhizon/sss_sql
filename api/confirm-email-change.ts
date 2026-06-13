export const config = {
  runtime: 'edge',
};

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    const host = req.headers.get('host') || 'localhost:5173';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const vercelDomain = `${protocol}://${host}`;

    if (!token) {
      return Response.redirect(`${vercelDomain}/settings?error=MissingToken`, 302);
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response("Server configuration missing service key", { status: 500 });
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Look up the token
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('email_change_requests')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchError || !request) {
      return Response.redirect(`${vercelDomain}/settings?error=InvalidToken`, 302);
    }

    // 2. Check if expired
    if (new Date(request.expires_at) < new Date()) {
      return Response.redirect(`${vercelDomain}/settings?error=ExpiredToken`, 302);
    }

    // 3. Update the user's email using Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(request.user_id, {
      email: request.new_email,
      email_confirm: true
    });

    if (updateError) {
      return Response.redirect(`${vercelDomain}/settings?error=UpdateFailed`, 302);
    }

    // 4. Send notification to the NEW email address via MS Graph
    try {
      const tokenResponse = await fetch("https://login.microsoftonline.com/978ed4e9-92b1-4cd4-88f5-93774cd20ab6/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MS_GRAPH_CLIENT_ID || "",
          client_secret: process.env.MS_GRAPH_CLIENT_SECRET || "",
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials"
        })
      });
      
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const senderEmail = process.env.MS_GRAPH_SENDER_EMAIL;
        
        const emailHtml = `
          <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px;">
              <h3 style="color: #333333; margin-top: 0;">Email Successfully Changed</h3>
              <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
                This email address is now associated with your SSS Member Services Portal account.
                <br><br>
                You can now log in using this email address.
              </p>
            </div>
          </div>
        `;

        await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${tokenData.access_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: {
              subject: "Notification: Your SSS email has been updated",
              body: { contentType: "HTML", content: emailHtml },
              toRecipients: [{ emailAddress: { address: request.new_email } }]
            },
            saveToSentItems: false
          })
        });
      }
    } catch (e) {
      console.error("Failed to send notification email", e);
      // We don't fail the request if just the notification fails
    }

    // 5. Delete the token
    await supabaseAdmin
      .from('email_change_requests')
      .delete()
      .eq('id', request.id);

    // 6. Redirect to settings page with success flag
    return Response.redirect(`${vercelDomain}/settings?email_changed=success`, 302);

  } catch (error: any) {
    console.error("Confirm Email Change Error:", error.message);
    return new Response("Internal Server Error", { status: 500 });
  }
}
