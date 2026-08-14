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
      'Improvement / Idea': 'https://discordapp.com/api/webhooks/1537676700199157862/vgZ-ZSOncntm_jmnRg3EIFl_s2noGib1ALxlCG1Mw_qXnB9wVI_BrsFAN7s3VU02pxpw',
      'Bug / Broken Item': 'https://discordapp.com/api/webhooks/1537794715712491591/o-sh7Hks55I-Cc_X8j6qXfGNMZ8lDP8yCzGg2085_cdEuQiqyKW9NxeeQ9wfNwsYiyax',
      'Content Fix / Typo': 'https://discordapp.com/api/webhooks/1537794718677733417/uaoohPCjEUbQMfwoeOxvHu-pkG8FBRndkAuP6w2VKdhperzqGEdsbddsQLR6E0T-l8z7'
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
    let embedColor = 0xf59e0b; // Amber / Gold for improvements
    let typeEmoji = '💡';

    if (feedbackType.includes('Bug') || feedbackType === 'bug_report') {
      embedColor = 0xef4444; // Red for bugs
      typeEmoji = '🐛';
    } else if (feedbackType.includes('Content')) {
      embedColor = 0x3b82f6; // Blue for content
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
                text: `Kins Official Website • Build: ${buildVersion}`
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
