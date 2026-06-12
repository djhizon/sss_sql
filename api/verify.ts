export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const tokenHash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type');
    const redirect_to = url.searchParams.get('redirect_to') || '/dashboard';

    if ((!token && !tokenHash) || !type) {
      return new Response("Missing verification parameters", { status: 400 });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response("Server Configuration Error", { status: 500 });
    }

    let verifyQuery = `type=${type}&redirect_to=${encodeURIComponent(redirect_to)}&apikey=${supabaseKey}`;
    if (tokenHash) verifyQuery += `&token_hash=${encodeURIComponent(tokenHash)}`;
    if (token) verifyQuery += `&token=${encodeURIComponent(token)}`;

    // Construct the secure Supabase Verification URL
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?${verifyQuery}`;

    // Redirect the browser to Supabase's API. Supabase will instantly process it and redirect back to the app with the session.
    return Response.redirect(verifyUrl, 302);
  } catch (error: any) {
    console.error("Verification Proxy Error:", error.message);
    return new Response("Internal Server Error", { status: 500 });
  }
}
