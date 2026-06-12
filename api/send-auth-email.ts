export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  try {
    const payload = await req.json();
    const { user, email_data } = payload;
    
    if (!user || !email_data || !user.email) {
      return new Response("Invalid payload", { status: 400 });
    }

    const tenantId = process.env.MS_TENANT_ID;
    const clientId = process.env.MS_CLIENT_ID;
    const clientSecret = process.env.MS_CLIENT_SECRET;
    const senderEmail = process.env.MS_SENDER_EMAIL;

    if (!tenantId || !clientId || !clientSecret || !senderEmail) {
      console.error("Missing Microsoft OAuth credentials in Vercel environment variables");
      return new Response("Configuration Error", { status: 500 });
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
    
    const vercelDomain = "https://sss-sql.vercel.app";
    let targetRedirect = email_data.redirect_to;
    if (!targetRedirect || targetRedirect.includes("api.supabase.com") || targetRedirect.includes("localhost:8000")) {
      targetRedirect = `${vercelDomain}/settings`;
    }
    
    if (email_data.email_action_type === 'recovery') {
      targetRedirect = `${vercelDomain}/update-password`;
    }

    const actualToken = email_data.token_hash || email_data.token;
    const isHash = !!email_data.token_hash;
    const magicLink = `${vercelDomain}/api/verify?token=${actualToken}&is_hash=${isHash}&type=${email_data.email_action_type}&redirect_to=${encodeURIComponent(targetRedirect)}`;

    if (email_data.email_action_type === 'recovery') {
      actionLabel = "Reset Password";
      subject = "Action Required: Reset your SSS Password";
      messagePrefix = "We received a request to reset your password for your SSS Member Services Portal account. Please click the button below to choose a new password.";
    } else if (email_data.email_action_type === 'email_change') {
      actionLabel = "Confirm Email Change";
      subject = "Action Required: Confirm your email update";
      messagePrefix = "We received a request to change the email address associated with your SSS Member Services Portal account. Please click the button below to confirm this action.";
    }

    // 3. Construct Simple HTML Email Body
    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h3 style="color: #333333; margin-top: 0;">${actionLabel}</h3>
          <p style="color: #4a4a4a; line-height: 1.6; font-size: 14px;">
            ${messagePrefix}
          </p>
          <div style="margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #0038A8; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 6px; display: inline-block;">${actionLabel}</a>
          </div>
          <p style="color: #666666; font-size: 12px; line-height: 1.5; border-top: 1px solid #eaeaea; padding-top: 20px;">
            If the button above does not work, copy and paste the following secure verification URL into your browser:<br><br>
            <a href="${magicLink}" style="color: #0038A8; word-break: break-all;">${magicLink}</a>
          </p>
        </div>
      </div>
    `;

    // 4. Determine Recipients
    // Supabase Webhooks don't tell us if it's sending the "Confirm Old Email" or "Confirm New Email" 
    // step of the email_change flow. So we send to BOTH to guarantee delivery to the correct inbox!
    const recipients = [user.email];
    const newEmailTarget = user.email_change || user.new_email;
    if (email_data.email_action_type === 'email_change' && newEmailTarget && newEmailTarget !== user.email) {
      recipients.push(newEmailTarget);
    }

    // 5. Send Email(s) via MS Graph
    for (const recipient of recipients) {
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
            toRecipients: [{ emailAddress: { address: recipient } }]
          },
          saveToSentItems: "false"
        })
      });

      if (!sendMailResponse.ok) {
        const err = await sendMailResponse.json();
        console.error("Microsoft Graph Error for " + recipient + ":", err);
        throw new Error(`Graph API Error: ${JSON.stringify(err)}`);
      }
      console.log(`Successfully sent email to ${recipient} via Microsoft Graph API`);
    }

    return new Response(JSON.stringify({ message: "Email(s) sent successfully" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Vercel Edge Function Exception:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
}
