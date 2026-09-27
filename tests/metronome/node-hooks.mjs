/* Module hooks so browser-targeted engine code loads under node --test:
   extensionless config imports resolve to .ts, and Vite's import.meta.env
   (absent in Node) reads as an empty object. */
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); } catch (error) {
    for (const ext of ['.ts', '.js']) { try { return await next(spec + ext, ctx); } catch {} }
    throw error;
  }
}
export async function load(url, ctx, next) {
  const result = await next(url, ctx);
  if (url.endsWith('.ts') && result.source) result.source = String(result.source).replaceAll('import.meta.env', '({})');
  return result;
}
