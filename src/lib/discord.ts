/**
 * Discord API Helper for Kins Fan Community & Subscription System
 * Handles role management (Subscribed, Listener) and member lookups via Discord REST API v10.
 */

export interface DiscordConfig {
  botToken: string;
  guildId: string;
  subscribedRoleId: string;
  listenerRoleId: string;
  webhookUrl: string;
}

const getEnv = (key: string): string => {
  let val = '';
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    val = String(process.env[key]);
  } else if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    val = String(import.meta.env[key]);
  }
  return val.replace(/^["']|["']$/g, '').trim();
};

export function getDiscordConfig(): DiscordConfig {
  return {
    botToken: getEnv('DISCORD_BOT_TOKEN'),
    guildId: getEnv('DISCORD_GUILD_ID') || getEnv('DISCORD_SERVER_ID'),
    subscribedRoleId: getEnv('DISCORD_SUBSCRIBED_ROLE_ID') || getEnv('DISCORD_ROLE_SUBSCRIBED_ID'),
    listenerRoleId: getEnv('DISCORD_LISTENER_ROLE_ID') || getEnv('DISCORD_ROLE_LISTENER_ID'),
    webhookUrl: getEnv('DISCORD_WEBHOOK_URL') || getEnv('DISCORD_SUBSCRIBER_WEBHOOK_URL')
  };
}

export interface DiscordMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    global_name?: string | null;
    avatar?: string | null;
  };
  nick?: string | null;
  roles: string[];
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

// In-memory cache for guild roles to avoid rate-limiting
let cachedRoles: { roles: DiscordRole[]; expiresAt: number } | null = null;

/**
 * Retrieves all roles in the Discord Guild.
 */
export async function getGuildRoles(config: DiscordConfig): Promise<DiscordRole[]> {
  if (!config.botToken || !config.guildId) return [];

  const now = Date.now();
  if (cachedRoles && cachedRoles.expiresAt > now) {
    return cachedRoles.roles;
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${config.guildId}/roles`, {
      headers: {
        Authorization: `Bot ${config.botToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`[Discord API] Failed to fetch guild roles: ${res.status} ${res.statusText}`);
      return [];
    }

    const roles = (await res.json()) as DiscordRole[];
    cachedRoles = { roles, expiresAt: now + 5 * 60 * 1000 }; // 5 min TTL
    return roles;
  } catch (err) {
    console.error('[Discord API] Error fetching guild roles:', err);
    return [];
  }
}

/**
 * Resolves a role ID by explicit ID or by searching role names (case-insensitive).
 */
export async function resolveRoleId(
  config: DiscordConfig,
  explicitId: string | undefined,
  targetNames: string[]
): Promise<string | null> {
  if (explicitId && explicitId.trim().length > 5) {
    return explicitId.trim();
  }

  const roles = await getGuildRoles(config);
  const normalizedTargets = targetNames.map((n) => n.toLowerCase().trim());

  for (const role of roles) {
    const rName = role.name.toLowerCase().trim();
    if (normalizedTargets.includes(rName)) {
      return role.id;
    }
  }

  return null;
}

/**
 * Searches for a Discord Guild Member by email username prefix, exact email, or discord handle.
 */
export async function findGuildMember(
  config: DiscordConfig,
  emailOrUsername: string
): Promise<DiscordMember | null> {
  if (!config.botToken || !config.guildId) return null;

  const queries: string[] = [];
  const clean = emailOrUsername.trim();

  // If email, add user portion (e.g., 'john.doe' from 'john.doe@gmail.com')
  if (clean.includes('@')) {
    const handle = clean.split('@')[0];
    queries.push(handle);
    queries.push(handle.replace(/[^a-zA-Z0-9_.]/g, ''));
  }
  queries.push(clean);

  for (const query of queries) {
    if (!query) continue;
    try {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${config.guildId}/members/search?query=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            Authorization: `Bot ${config.botToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.ok) {
        const members = (await res.json()) as DiscordMember[];
        if (members && members.length > 0) {
          return members[0]; // Best match
        }
      }
    } catch (err) {
      console.warn('[Discord API] Member search warning:', err);
    }
  }

  return null;
}

export interface RoleOperationResult {
  success: boolean;
  memberFound: boolean;
  memberId?: string;
  memberTag?: string;
  assignedRoles: string[];
  removedRoles: string[];
  message: string;
}

/**
 * Assigns the Subscribed role and Listener role to a Discord user matching the subscriber email.
 */
export async function assignSubscriberRoles(
  email: string,
  explicitDiscordId?: string
): Promise<RoleOperationResult> {
  const config = getDiscordConfig();

  const result: RoleOperationResult = {
    success: false,
    memberFound: false,
    assignedRoles: [],
    removedRoles: [],
    message: ''
  };

  if (!config.botToken || !config.guildId) {
    result.message = 'Discord Bot Token or Guild ID is not configured.';
    return result;
  }

  // Resolve Subscribed & Listener Role IDs
  const subscribedRoleId = await resolveRoleId(
    config,
    config.subscribedRoleId,
    ['subscribed', 'subscriber', 'subscribers', 'fan club', 'vip fan']
  );
  const listenerRoleId = await resolveRoleId(
    config,
    config.listenerRoleId,
    ['listener', 'listeners', 'music listener', 'kins listener']
  );

  const rolesToAssign: { id: string | null; name: string }[] = [
    { id: subscribedRoleId, name: 'Subscribed' },
    { id: listenerRoleId, name: 'Listener' }
  ];

  // Find Member
  let memberId = explicitDiscordId;
  let memberTag = '';

  if (!memberId) {
    const member = await findGuildMember(config, email);
    if (member) {
      memberId = member.user.id;
      memberTag = member.user.global_name || member.user.username;
      result.memberFound = true;
      result.memberId = memberId;
      result.memberTag = memberTag;
    }
  } else {
    result.memberFound = true;
    result.memberId = memberId;
  }

  if (!memberId) {
    result.message = 'No matching Discord member found in server yet for this email/handle.';
    return result;
  }

  // Assign roles via Discord REST API: PUT /guilds/{guild.id}/members/{user.id}/roles/{role.id}
  for (const roleObj of rolesToAssign) {
    if (!roleObj.id) {
      console.warn(`[Discord API] Role ID for "${roleObj.name}" could not be resolved.`);
      continue;
    }

    try {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${config.guildId}/members/${memberId}/roles/${roleObj.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bot ${config.botToken}`,
            'Content-Type': 'application/json',
            'X-Audit-Log-Reason': `Kins Website Fan Club Subscription for ${email}`
          }
        }
      );

      if (res.ok || res.status === 204) {
        result.assignedRoles.push(roleObj.name);
      } else {
        const errText = await res.text().catch(() => '');
        console.warn(`[Discord API] Failed to add role ${roleObj.name} (${roleObj.id}): ${res.status} ${errText}`);
      }
    } catch (err) {
      console.error(`[Discord API] Error assigning role ${roleObj.name}:`, err);
    }
  }

  result.success = result.assignedRoles.length > 0;
  result.message = result.success
    ? `Assigned roles: ${result.assignedRoles.join(', ')} to member ${memberTag || memberId}`
    : 'Failed to assign roles via Discord API.';

  return result;
}

/**
 * Removes the Subscribed role when an email unsubscription event is received (e.g. from Substack).
 */
export async function removeSubscriberRole(
  email: string,
  explicitDiscordId?: string
): Promise<RoleOperationResult> {
  const config = getDiscordConfig();

  const result: RoleOperationResult = {
    success: false,
    memberFound: false,
    assignedRoles: [],
    removedRoles: [],
    message: ''
  };

  if (!config.botToken || !config.guildId) {
    result.message = 'Discord Bot Token or Guild ID is not configured.';
    return result;
  }

  const subscribedRoleId = await resolveRoleId(
    config,
    config.subscribedRoleId,
    ['subscribed', 'subscriber', 'subscribers', 'fan club', 'vip fan']
  );

  if (!subscribedRoleId) {
    result.message = 'Subscribed role ID could not be resolved.';
    return result;
  }

  let memberId = explicitDiscordId;
  let memberTag = '';

  if (!memberId) {
    const member = await findGuildMember(config, email);
    if (member) {
      memberId = member.user.id;
      memberTag = member.user.global_name || member.user.username;
      result.memberFound = true;
      result.memberId = memberId;
      result.memberTag = memberTag;
    }
  } else {
    result.memberFound = true;
    result.memberId = memberId;
  }

  if (!memberId) {
    result.message = 'No matching Discord member found in server for this email/handle.';
    return result;
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/guilds/${config.guildId}/members/${memberId}/roles/${subscribedRoleId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bot ${config.botToken}`,
          'Content-Type': 'application/json',
          'X-Audit-Log-Reason': `Kins Unsubscribe Webhook for ${email}`
        }
      }
    );

    if (res.ok || res.status === 204) {
      result.removedRoles.push('Subscribed');
      result.success = true;
      result.message = `Removed Subscribed role from member ${memberTag || memberId}`;
    } else {
      const errText = await res.text().catch(() => '');
      result.message = `Failed to remove role: ${res.status} ${errText}`;
    }
  } catch (err) {
    console.error('[Discord API] Error removing Subscribed role:', err);
    result.message = `Error removing role: ${String(err)}`;
  }

  return result;
}
