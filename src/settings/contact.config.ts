/**
 * Canonical band contact channels. The ONLY place contact emails live.
 * Owner note: confirm the @kinsband.com mailboxes are receiving before
 * deploying — these replaced earlier Gmail addresses for brand consistency.
 */
export interface BandContact {
  role: string;
  email: string;
  description: string;
  cta: string;
  icon: string;
}

export const bookingEmail = "BookingsKinsBand@gmail.com";
export const generalEmail = "HelloKinsBand@gmail.com";

export const contacts: BandContact[] = [
  {
    role: "Live Booking & Shows",
    email: bookingEmail,
    description: "Headline concerts, festival lineups, venue booking & tour routing inquiries.",
    cta: "Contact Booking",
    icon: "fa-calendar-check"
  },
  {
    role: "General & Inquiries",
    email: generalEmail,
    description: "General artist inquiries, press features, sync licensing & collaborations.",
    cta: "Contact Hello",
    icon: "fa-envelope-open-text"
  }
];
