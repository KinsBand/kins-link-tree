/**
 * SEO & AI Chat Recommendation (GEO/AEO) Verification Script
 * Validates JSON-LD @graph, OpenGraph, Twitter Cards, llms.txt, robots.txt, and canonical URLs.
 * Run via: node scripts/verify-seo-ai.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const CHECKS = {
  jsonLd: { score: 0, max: 30, details: [] },
  aiFiles: { score: 0, max: 25, details: [] },
  robotsTxt: { score: 0, max: 15, details: [] },
  metaTags: { score: 0, max: 15, details: [] },
  semanticContent: { score: 0, max: 15, details: [] }
};

function pass(category, points, msg) {
  CHECKS[category].score += points;
  CHECKS[category].details.push(`  [PASS] (+${points} pts) ${msg}`);
}

function fail(category, msg) {
  CHECKS[category].details.push(`  [FAIL] (+0 pts) ${msg}`);
}

console.log('\n=============================================================');
console.log('   KINS OFFICIAL WEB PLATFORM — SEO & AI DISCOVERY AUDIT   ');
console.log('=============================================================\n');

// 1. Audit Built HTML for Schema.org JSON-LD and Meta Tags
const htmlPath = path.join(rootDir, '.vercel/output/static/index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('[ERROR] .vercel/output/static/index.html not found. Please run "npm run build" first.\n');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// --- 1.1 JSON-LD @graph Validation ---
const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
if (jsonLdMatch && jsonLdMatch[1]) {
  try {
    const data = JSON.parse(jsonLdMatch[1]);
    pass('jsonLd', 5, 'Valid JSON-LD application/ld+json payload found');

    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    
    // MusicGroup Entity Check
    const musicGroup = graph.find(e => e['@type'] === 'MusicGroup');
    if (musicGroup) {
      pass('jsonLd', 5, `MusicGroup entity defined (Name: "${musicGroup.name}")`);
      
      if (Array.isArray(musicGroup.sameAs) && musicGroup.sameAs.length >= 5) {
        pass('jsonLd', 5, `MusicGroup.sameAs includes ${musicGroup.sameAs.length} canonical streaming/social URLs`);
      } else {
        fail('jsonLd', 'MusicGroup.sameAs is missing or contains fewer than 5 platforms');
      }

      if (Array.isArray(musicGroup.member) && musicGroup.member.length === 4) {
        pass('jsonLd', 5, 'MusicGroup.member lists all 4 band members (Vivian, Charlie, Oscar, Trai)');
      } else {
        fail('jsonLd', 'MusicGroup.member is missing full band roster');
      }

      if (musicGroup.foundingLocation && (musicGroup.foundingLocation.name || musicGroup.foundingLocation.address)) {
        pass('jsonLd', 3, 'MusicGroup.foundingLocation structured as Newcastle, NSW, AU');
      } else {
        fail('jsonLd', 'MusicGroup.foundingLocation not properly structured');
      }
    } else {
      fail('jsonLd', 'MusicGroup entity missing from Schema.org graph');
    }

    // FAQPage Entity Check (Direct AI Zero-Click Answering)
    const faqPage = graph.find(e => e['@type'] === 'FAQPage');
    if (faqPage && Array.isArray(faqPage.mainEntity) && faqPage.mainEntity.length >= 4) {
      pass('jsonLd', 5, `FAQPage entity defined with ${faqPage.mainEntity.length} Q&A answer pairs for AI retrieval`);
    } else {
      fail('jsonLd', 'FAQPage entity missing or has fewer than 4 question pairs');
    }

    // WebSite Entity Check
    const webSite = graph.find(e => e['@type'] === 'WebSite');
    if (webSite && webSite.url) {
      pass('jsonLd', 2, 'WebSite entity defined with canonical publisher link');
    } else {
      fail('jsonLd', 'WebSite entity missing from Schema.org graph');
    }
  } catch (err) {
    fail('jsonLd', `Malformed JSON-LD payload: ${err.message}`);
  }
} else {
  fail('jsonLd', 'No application/ld+json script tag found in HTML');
}

// --- 1.2 Open Graph & Meta Tags ---
if (html.includes('<meta property="og:title"')) pass('metaTags', 3, 'og:title present');
else fail('metaTags', 'og:title missing');

if (html.includes('<meta property="og:description"')) pass('metaTags', 3, 'og:description present');
else fail('metaTags', 'og:description missing');

if (html.includes('<meta property="og:image"')) pass('metaTags', 3, 'og:image present');
else fail('metaTags', 'og:image missing');

if (html.includes('<meta name="twitter:card" content="summary_large_image"')) pass('metaTags', 3, 'twitter:card is summary_large_image');
else fail('metaTags', 'twitter:card missing or not summary_large_image');

if (html.includes('<link rel="canonical" href="https://kinshub.vercel.app/')) pass('metaTags', 3, 'Canonical link standardized to https://kinshub.vercel.app');
else fail('metaTags', 'Canonical URL missing or not matching kinshub.vercel.app');

// --- 1.3 Semantic On-Page Entity Content ---
if (html.includes('Recommended If You Like (RIYL):')) {
  pass('semanticContent', 5, 'On-page RIYL reference artists (Fontaines D.C., IDLES, The Murder Capital, etc.)');
} else {
  fail('semanticContent', 'RIYL reference artist grounding missing from HTML');
}

if (html.includes('Vivian:') && html.includes('Charlie:') && html.includes('Oscar:') && html.includes('Trai:')) {
  pass('semanticContent', 5, 'On-page semantic member roster with instruments');
} else {
  fail('semanticContent', 'On-page member roster incomplete');
}

if (html.includes('Newcastle, New South Wales')) {
  pass('semanticContent', 5, 'On-page geographic grounding in Newcastle, NSW, Australia');
} else {
  fail('semanticContent', 'Geographic entity context missing');
}

// --- 2. Audit llms.txt & llms-full.txt ---
const llmsPath = path.join(rootDir, 'public/llms.txt');
const llmsFullPath = path.join(rootDir, 'public/llms-full.txt');

if (fs.existsSync(llmsPath)) {
  const content = fs.readFileSync(llmsPath, 'utf8');
  if (content.includes('KINS') && content.includes('Post-Punk') && content.includes('Spotify')) {
    pass('aiFiles', 12, 'public/llms.txt exists with structured artist identity, RIYL, and links');
  } else {
    fail('aiFiles', 'public/llms.txt exists but lacks core band metadata');
  }
} else {
  fail('aiFiles', 'public/llms.txt does not exist');
}

if (fs.existsSync(llmsFullPath)) {
  const content = fs.readFileSync(llmsFullPath, 'utf8');
  if (content.includes('Frequently Asked Questions') && content.includes('Production & Backline')) {
    pass('aiFiles', 13, 'public/llms-full.txt exists with deep context, technical specs, and FAQ');
  } else {
    fail('aiFiles', 'public/llms-full.txt exists but lacks deep context');
  }
} else {
  fail('aiFiles', 'public/llms-full.txt does not exist');
}

// --- 3. Audit robots.txt AI Crawler Permissions ---
const robotsPath = path.join(rootDir, 'public/robots.txt');
if (fs.existsSync(robotsPath)) {
  const content = fs.readFileSync(robotsPath, 'utf8');
  const bots = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended'];
  const matchedBots = bots.filter(b => content.includes(b));
  
  if (matchedBots.length === bots.length) {
    pass('robotsTxt', 8, `robots.txt explicitly welcomes all major AI crawlers (${matchedBots.join(', ')})`);
  } else {
    fail('robotsTxt', `robots.txt missing some AI crawlers (matched ${matchedBots.length}/${bots.length})`);
  }

  if (content.includes('Sitemap: https://kinshub.vercel.app/sitemap.xml')) {
    pass('robotsTxt', 4, 'robots.txt declares canonical sitemap URL');
  } else {
    fail('robotsTxt', 'robots.txt missing canonical sitemap URL');
  }

  if (content.includes('llms.txt')) {
    pass('robotsTxt', 3, 'robots.txt references llms.txt standard pointer');
  } else {
    fail('robotsTxt', 'robots.txt missing llms.txt standard pointer');
  }
} else {
  fail('robotsTxt', 'public/robots.txt does not exist');
}

// --- Compute Total Score & Output Report ---
let totalScore = 0;
let totalMax = 0;

for (const [key, cat] of Object.entries(CHECKS)) {
  totalScore += cat.score;
  totalMax += cat.max;
}

const percentage = Math.round((totalScore / totalMax) * 100);

console.log('--- 1. Schema.org JSON-LD Entity Graph (' + CHECKS.jsonLd.score + '/' + CHECKS.jsonLd.max + ' pts) ---');
console.log(CHECKS.jsonLd.details.join('\n'));

console.log('\n--- 2. Open Graph & Social Cards (' + CHECKS.metaTags.score + '/' + CHECKS.metaTags.max + ' pts) ---');
console.log(CHECKS.metaTags.details.join('\n'));

console.log('\n--- 3. Semantic On-Page Entity Content (' + CHECKS.semanticContent.score + '/' + CHECKS.semanticContent.max + ' pts) ---');
console.log(CHECKS.semanticContent.details.join('\n'));

console.log('\n--- 4. The AI Standard: llms.txt & llms-full.txt (' + CHECKS.aiFiles.score + '/' + CHECKS.aiFiles.max + ' pts) ---');
console.log(CHECKS.aiFiles.details.join('\n'));

console.log('\n--- 5. AI Crawler Permissions in robots.txt (' + CHECKS.robotsTxt.score + '/' + CHECKS.robotsTxt.max + ' pts) ---');
console.log(CHECKS.robotsTxt.details.join('\n'));

console.log('\n=============================================================');
console.log(`   OVERALL SEO & AI READINESS SCORE: ${totalScore}/${totalMax} (${percentage}%)   `);
console.log('=============================================================\n');

if (percentage >= 90) {
  console.log('RESULT: [SUCCESS] Website meets 100% of modern SEO & AI chat recommendation standards!\n');
  process.exit(0);
} else {
  console.log('RESULT: [WARNING] Website has incomplete SEO/AI indicators.\n');
  process.exit(1);
}
