import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.details || typeof body.details !== 'string') {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Please provide feedback details.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const {
      feedbackType = 'Improvement / Idea',
      category = 'General Site',
      details = '',
      contact = '',
      deviceInfo = '',
      pageUrl = '',
      timestamp = new Date().toISOString()
    } = body;

    const webhookUrl =
      import.meta.env.DISCORD_FEEDBACK_WEBHOOK_URL ||
      process.env.DISCORD_FEEDBACK_WEBHOOK_URL ||
      import.meta.env.DISCORD_WEBHOOK_URL ||
      process.env.DISCORD_WEBHOOK_URL;

    // Determine color & icon based on feedback type
    let embedColor = 0xf59e0b; // Amber / Gold for improvements
    let typeEmoji = '💡';

    if (feedbackType.includes('Bug')) {
      embedColor = 0xef4444; // Red for bugs
      typeEmoji = '🐛';
    } else if (feedbackType.includes('Content')) {
      embedColor = 0x3b82f6; // Blue for content
      typeEmoji = '📝';
    }

    if (webhookUrl) {
      try {
        const discordPayload = {
          username: 'Kins Website Feedback',
          avatar_url: 'https://raw.githubusercontent.com/KinsBand/kins-link-tree/main/pfp.jpg',
          embeds: [
            {
              title: `${typeEmoji} ${feedbackType}: ${category}`,
              description: details,
              color: embedColor,
              fields: [
                {
                  name: '📁 Category',
                  value: category,
                  inline: true
                },
                {
                  name: '👤 Submitter',
                  value: contact ? `\`${contact}\`` : '*Anonymous Fan*',
                  inline: true
                },
                {
                  name: '📱 Client Info',
                  value: deviceInfo ? `\`${deviceInfo.slice(0, 200)}\`` : '*N/A*',
                  inline: false
                }
              ],
              footer: {
                text: 'Kins Official Website • Feedback HQ'
              },
              timestamp: timestamp
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
    } else {
      console.log('Site feedback received (No DISCORD_FEEDBACK_WEBHOOK_URL configured):', {
        feedbackType,
        category,
        details,
        contact,
        deviceInfo,
        timestamp
      });
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
