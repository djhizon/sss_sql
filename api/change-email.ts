export const config = {
  runtime: 'edge',
};

import { createClient } from '@supabase/supabase-js';

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

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration missing service key' }), { status: 500 });
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify user JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);

    if (verifyError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
    }

    // Force update the email using the Admin API (bypasses email confirmation completely)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: newEmail,
      email_confirm: true
    });

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Email updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Change Email Error:", error.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
