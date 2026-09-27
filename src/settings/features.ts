/**
 * Resolved feature switches for page templates.
 *
 * A feature renders only when its toggle in functionality.config.ts is on AND
 * the content it needs exists. Unfinished features are left out of the page
 * entirely instead of being shown as disabled "coming soon" placeholders, and
 * they switch themselves on once their config data is filled in.
 */
import { functionalityConfig } from './functionality.config';
import { KINS_COVERS_DATA } from './covers.config';
import { UPCOMING_GIGS } from './gigs.config';

const audioPlayer = functionalityConfig.enableAudioPlayer ?? true;
const newsletter = functionalityConfig.enableNewsletter ?? true;

export const features = {
  /** Covers overlay. Stays useful with an empty catalogue: it shows the song
   *  the band is learning and the "Request a Cover" flow. */
  coversSearch: functionalityConfig.enableCoversSearch ?? true,
  /** At least one cover is published, so the overlay is worth a full search pill. */
  coversCatalog: KINS_COVERS_DATA.length > 0,
  /** Gig map dock tile + sheet: needs at least one upcoming show. The sheet's
   *  opener in gigMap.js is still stubbed to a toast; restore it with the data. */
  gigMap: (functionalityConfig.enableGigMap ?? true) && UPCOMING_GIGS.length > 0,
  /** Email signup form, nav Join button and hero "Notify me" action. */
  newsletter,
  /** Google One Tap signup: needs a configured OAuth client ID. */
  googleOneTap: newsletter && Boolean(import.meta.env.PUBLIC_GOOGLE_CLIENT_ID),
  /** Floating inspiration audio dock. */
  audioPlayer,
  /** "What Inspires Us" section: its previews play through the audio dock. */
  inspirationVault: (functionalityConfig.enableInspirationVault ?? true) && audioPlayer,
  /** Total followers card (reads public/followers.json). */
  followerCounter: functionalityConfig.enableFollowerCounter ?? false,
};
