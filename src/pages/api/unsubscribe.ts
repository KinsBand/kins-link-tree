import type { APIRoute } from 'astro';
import { POST as handleUnsubscribe } from './substack-webhook';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  return handleUnsubscribe(context);
};
