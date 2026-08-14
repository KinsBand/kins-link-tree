import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid payload.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const feedback = body.feedback || {};
    const feedbackType = feedback.type || body.feedbackType || 'Improvement / Idea';
    const category = feedback.category || body.category || 'General Site';
    const details = feedback.user_message || feedback.details || body.details || '';
    const contact = feedback.contact || body.contact || '';

    if (!details || typeof details !== 'string') {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Please provide feedback details.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const viewport = body.viewportWithDpr || body.viewport || 'N/A';
    const environment = body.environment || 'Standard Browser';
    const url = body.url || 'https://kinsband.com';
    const formattedDate = body.formattedDate || new Date().toISOString();
    const lastError = body.lastError || '';
    const buildVersion = body.buildVersion || '2026.08.1-prod';

    // Route to the correct Discord channel based on feedback type
    const webhookMap: Record<string, string> = {
      'Improvement / Idea': 'https://discord.com/api/webhooks/1537823822240026705/Gw3XTHhEbpqIGGxhXvQx6yeOoAOWVwCVLyo-36DtwqXNptDHR69KqN-4286oMpHfSB7G',
      'Bug / Broken Item': 'https://discord.com/api/webhooks/1537823829039124541/ePyQFBCtvGO9nHQWWopo6l4NDvjiweDq0R1WeURZBxsuAVpqco4hM0LC1r9nXnrpEuJg',
      'Content Fix / Typo': 'https://discord.com/api/webhooks/1537823842880192573/B11FLr0cU92wYSN_8Jl06K8gARQjvtznFJzL5ZZmXZISABg0RSHHVbxjmS_sjk4LaF8k'
    };

    let webhookUrl = webhookMap['Improvement / Idea']; // default
    if (feedbackType.includes('Bug')) {
      webhookUrl = webhookMap['Bug / Broken Item'];
    } else if (feedbackType.includes('Content')) {
      webhookUrl = webhookMap['Content Fix / Typo'];
    }

    // Allow env override if set
    const envWebhook =
      import.meta.env.DISCORD_FEEDBACK_WEBHOOK_URL ||
      process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
    if (envWebhook) webhookUrl = envWebhook;

    // Determine color & icon based on feedback type
    let embedColor = 0x3498db; // #3498DB Blue for improvements
    let typeEmoji = '💡';

    if (feedbackType.includes('Bug') || feedbackType === 'bug_report') {
      embedColor = 0xe74c3c; // #E74C3C Red for bugs
      typeEmoji = '🐛';
    } else if (feedbackType.includes('Content')) {
      embedColor = 0xe67e22; // #E67E22 Orange for content
      typeEmoji = '📝';
    }

    if (webhookUrl) {
      try {
        const descriptionLines = [
          `**User Message:**`,
          `"${details}"`,
          ``,
          `• **Category:** ${category}`,
          `• **Submitter:** ${contact ? `\`${contact}\`` : '*Anonymous Fan*'}`,
          `• **Viewport:** \`${viewport}\``,
          `• **Environment:** ${environment}`,
          `• **Date:** ${formattedDate}`
        ];

        if (lastError) {
          descriptionLines.push(`• **Last Error:** \`${lastError}\``);
        }

        const discordPayload = {
          username: 'Kins Website Feedback',
          avatar_url: 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/pfp.jpg',
          embeds: [
            {
              title: `${typeEmoji} ${feedbackType}: ${category}`,
              description: descriptionLines.join('\n'),
              color: embedColor,
              footer: {
                text: 'Kins Site Diagnostics'
              },
              timestamp: body.timestamp || new Date().toISOString()
            }
          ]
        };

        const discordRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload)
        });

        if (!discordRes.ok) {
          const resText = await discordRes.text().catch(() => '');
          console.warn('Discord webhook response warning:', discordRes.status, resText);
        }
      } catch (webhookErr) {
        console.error('Error forwarding feedback to Discord webhook:', webhookErr);
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Feedback received! Thank you for helping Kins improve the site.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Feedback API error:', err);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Failed to process feedback.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
