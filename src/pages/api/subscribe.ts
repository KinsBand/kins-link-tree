import type { APIRoute } from 'astro';

export const prerender = false;

const DEFAULT_SUBSTACK_DOMAIN = 'kinsbandoffical.substack.com';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Please enter a complete and valid email address (e.g. name@example.com).' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const rawDomain = import.meta.env.SUBSTACK_DOMAIN || process.env.SUBSTACK_DOMAIN || DEFAULT_SUBSTACK_DOMAIN;
    const substackDomain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    let substackSuccess = false;
    let errorMessage = '';

    // 1. Submit email to Substack free subscription API (form-encoded)
    try {
      const substackUrl = `https://${substackDomain}/api/v1/free?nojs=true`;
      const formData = new URLSearchParams();
      formData.append('email', cleanEmail);
      formData.append('source', 'website_footer');

      const response = await fetch(substackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': `https://${substackDomain}/`
        },
        body: formData.toString()
      });

      if (response.ok) {
        substackSuccess = true;
      } else {
        // Fallback: Attempt JSON payload to Substack API
        const jsonResponse = await fetch(`https://${substackDomain}/api/v1/free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': `https://${substackDomain}/`
          },
          body: JSON.stringify({ email: cleanEmail, domain: 'substack.com', source: 'subscribe_page' })
        });

        if (jsonResponse.ok) {
          substackSuccess = true;
        } else {
          const text = await response.text().catch(() => '');
          errorMessage = `Substack responded with status ${response.status}`;
          console.warn('Substack subscription response warning:', response.status, text);
        }
      }
    } catch (err: any) {
      console.error('Substack fetch error:', err);
      errorMessage = err?.message || 'Network error reaching Substack.';
    }

    if (substackSuccess) {
      return new Response(
        JSON.stringify({
          status: 'success',
          message: "Subscribed to Kins on Substack! Check your inbox to confirm."
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Return success to the user so client UX remains smooth while providing fallback notice
      return new Response(
        JSON.stringify({
          status: 'success',
          message: "Welcome to Kins! Redirecting to Substack to complete subscription...",
          redirectUrl: `https://${substackDomain}/subscribe?email=${encodeURIComponent(cleanEmail)}`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ status: 'error', message: 'Subscription processing error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

