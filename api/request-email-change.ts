export const config = {
  runtime: 'edge',
};

import { createClient } from '@supabase/supabase-js';

// Simple function to generate a random token
function generateToken(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  return result;
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { newEmail } = await req.json();
    if (!newEmail || typeof newEmail !== 'string') {
      return new Response(JSON.stringify({ error: 'newEmail is required' }), { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const host = req.headers.get('host') || 'localhost:5173';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const vercelDomain = `${protocol}://${host}`;

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration missing service key' }), { status: 500 });
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user JWT
    const authToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(authToken);

    if (verifyError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }
    
    const currentEmail = user.email;
    if (!currentEmail) {
      return new Response(JSON.stringify({ error: 'No current email found' }), { status: 400 });
    }

    // 1. Generate token and save to database
    const token = generateToken(32);
    
    const { error: insertError } = await supabaseAdmin
      .from('email_change_requests')
      .insert({
        user_id: user.id,
        new_email: newEmail,
        token: token
      });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 400 });
    }

    // 2. Send email to CURRENT email address via MS Graph
    // First, get MS Graph token
    const tenantId = process.env.MS_TENANT_ID;
    const clientId = process.env.MS_CLIENT_ID;
    const clientSecret = process.env.MS_CLIENT_SECRET;
    const senderEmail = process.env.MS_SENDER_EMAIL;

    if (!tenantId || !clientId || !clientSecret || !senderEmail) {
      throw new Error("Missing Microsoft OAuth credentials in environment");
    }

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials"
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error("Failed to authenticate with Microsoft Graph");
    }
    
    const tokenData = await tokenResponse.json();
    
    // Construct magic link
    const confirmLink = `${vercelDomain}/api/confirm-email-change?token=${token}`;
    
    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h3 style="color: #333333; margin-top: 0;">Confirm Email Change</h3>
          <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
            We received a request to change your SSS account email address to <strong>${newEmail}</strong>.
            <br><br>
            For security reasons, please confirm this change by clicking the button below:
          </p>
          <div style="margin: 30px 0;">
            <a href="${confirmLink}" style="background-color: #0038A8; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 6px; display: inline-block;">Confirm Email Change</a>
          </div>
          <p style="color: #666666; font-size: 12px; line-height: 1.5; border-top: 1px solid #eaeaea; padding-top: 20px;">
            If the button above does not work, copy and paste the following secure verification URL into your browser:<br><br>
            <a href="${confirmLink}" style="color: #0038A8; word-break: break-all;">${confirmLink}</a>
            <br><br>
            If you did not request this change, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    const sendMailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: {
          subject: "Action Required: Confirm your email update",
          body: { contentType: "HTML", content: emailHtml },
          toRecipients: [{ emailAddress: { address: currentEmail } }]
        },
        saveToSentItems: false
      })
    });

    if (!sendMailResponse.ok) {
      throw new Error(`MS Graph API Error: ${sendMailResponse.status}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Confirmation sent to current email' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Request Email Change Error:", error.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
