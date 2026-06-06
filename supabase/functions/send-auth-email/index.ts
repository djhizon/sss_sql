import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { user, email_data } = payload;
    
    // Supabase Send Email Hook payload contains:
    // email_data.token, email_data.token_hash, email_data.redirect_to, email_data.site_url, email_data.email_action_type
    if (!user || !email_data || !user.email) {
      return new Response("Invalid payload", { status: 400, headers: corsHeaders });
    }

    const tenantId = Deno.env.get("MS_TENANT_ID");
    const clientId = Deno.env.get("MS_CLIENT_ID");
    const clientSecret = Deno.env.get("MS_CLIENT_SECRET");
    const senderEmail = Deno.env.get("MS_SENDER_EMAIL");

    if (!tenantId || !clientId || !clientSecret || !senderEmail) {
      console.error("Missing Microsoft OAuth credentials in Edge Function secrets");
      return new Response("Configuration Error", { status: 500, headers: corsHeaders });
    }

    console.log(`Sending ${email_data.email_action_type} email to ${user.email} via Microsoft Graph API...`);

    // 1. Get OAuth Token from Microsoft Entra ID
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        scope: "https://graph.microsoft.com/.default",
        client_secret: clientSecret,
        grant_type: "client_credentials"
      })
    });
    
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("Token Error:", tokenData);
      throw new Error("Failed to get MS access token");
    }

    // 2. Construct the magic link based on the action type
    let actionLabel = "Verify Email Address";
    let subject = "Action Required: Confirm your SSS Member Portal Registration";
    let messagePrefix = "Thank you for registering at the SSS Member Services Portal. To complete your registration and secure your account, please confirm your email address by clicking the button below.";
    
    const magicLink = `${email_data.site_url}/auth/v1/verify?token=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;

    if (email_data.email_action_type === 'recovery') {
      actionLabel = "Reset Password";
      subject = "Action Required: Reset your SSS Password";
      messagePrefix = "We received a request to reset your password for your SSS Member Services Portal account. Please click the button below to choose a new password.";
    }

    // 3. Construct Official SSS HTML Email Body
    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <div style="background-color: #0038A8; border-bottom: 4px solid #FFCC00; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">SOCIAL SECURITY SYSTEM</h2>
          <p style="color: #e0e0e0; margin: 5px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Republic of the Philippines</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h3 style="color: #333333; margin-top: 0;">${actionLabel}</h3>
          <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
            Dear Member,<br><br>
            ${messagePrefix}
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${magicLink}" style="background-color: #0038A8; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 4px; display: inline-block;">${actionLabel.toUpperCase()}</a>
          </div>
          
          <p style="color: #666666; font-size: 12px; line-height: 1.5; border-top: 1px solid #eeeeee; padding-top: 20px;">
            If the button above does not work, copy and paste the following URL into your browser:<br><br>
            <a href="${magicLink}" style="color: #0038A8; word-break: break-all;">${magicLink}</a>
          </p>
          
          <p style="color: #999999; font-size: 11px; margin-top: 30px; line-height: 1.4;">
            This is an automated message from the Social Security System. Please do not reply to this email. If you did not initiate this request, you can safely ignore this message.
          </p>
        </div>
      </div>
    `;

    // 4. Send Email via MS Graph
    const sendMailResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: {
          subject: subject,
          body: { contentType: "HTML", content: emailHtml },
          toRecipients: [{ emailAddress: { address: user.email } }]
        },
        saveToSentItems: "false"
      })
    });

    if (!sendMailResponse.ok) {
      const err = await sendMailResponse.json();
      console.error("Microsoft Graph Error:", err);
      throw new Error(`Graph API Error: ${JSON.stringify(err)}`);
    }

    console.log(`Successfully sent email to ${user.email} via Microsoft Graph API`);

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Edge Function Exception:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
