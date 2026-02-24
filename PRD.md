# Product Requirements Document (PRD)

## Client Proof Vault

**Audience:** Freelancers  
**Primary Goal:** Enable freelancers to instantly present credibility so prospects trust them faster.  
**Product Type:** Web app (mobile-responsive, web-first)

---

## 1. Product Overview

Client Proof Vault allows a freelancer to create **one public, shareable proof page** containing testimonials, work examples, and credibility metrics.

The page is designed to be:

- Fast to create
- Easy to share
- Optimized for trust and clarity

This product is **not** a portfolio builder, CRM, or proposal tool.

The MVP defined in this document is complete. The next product focus is shipping value features that increase trust, sharing effectiveness, and measurable outcomes while keeping the core one-page model intact.

---

## 2. Target User

### Primary User

- Solo freelancers
- Independent contractors
- Service-based online professionals

---

## 3. Core User Actions

A user can:

- Create an account
- Create and edit one proof page
- Add, edit, reorder proof sections
- Upload images
- Publish and share their proof page
- View basic page analytics

---

## 4. Proof Page Definition

Each user owns **exactly one** proof page.

### Proof Page Content

- Title
- Short headline
- Optional bio
- Theme (light/dark)
- Accent color (preset)
- Public slug
- Status: `draft` or `published`

---

## 5. Proof Sections

A proof page consists of ordered sections.

### Section Types

- Testimonials
- Work Examples
- Metrics / Claims

Sections can be reordered.

---

## 6. Public Viewing

- Published proof pages are publicly accessible
- Draft pages are private
- No authentication required to view published pages

---

## 7. Media

- Images uploaded for testimonials and work examples
- Storage handled via Supabase Storage
- Media ownership tied to user

---

## 8. Analytics (Minimal)

- Track total page views per proof page
- Track last viewed timestamp
- No visitor-level analytics

---

## 9. Explicit Non-Goals (v1)

The following must **not** be implemented:

- Payments or subscriptions
- Multiple proof pages per user
- Custom domains
- Teams or collaborators
- AI features
- Rich text editing
- Social features (likes, comments, feeds)
- Proposal or CRM functionality

---

## 10. Success Criteria

- A new user can publish a proof page in under 10 minutes
- Pages load quickly on mobile
- Public/private access is correctly enforced
- The product feels focused and distraction-free

---

## 11. Roadmap (Post-MVP)

### Phase A: Value Features That Justify Payment Soon

- **Testimonial Request Links:** Users can generate a public request form URL to collect testimonials. New submissions enter a `Pending` state, and users can approve or reject each submission before it appears on their page.
- **Share Mode:** Users can open a condensed, share-focused page view plus copy a short “share summary” snippet for outreach messages.
- **Badges (Non-AI):**
  - **Verified Email:** Trust badge based on authenticated account email.
  - **Verified Domain:** Trust badge based on DNS TXT verification for a user-controlled domain.

### Phase B: Make It Premium + Measurable

- **Analytics Panel:** Simple dashboard for total views and views-over-time trends.
- **Public Page Polish:** Stronger typography and layout, improved image handling, and cleaner section ordering presentation.
- **Custom Domains:** Users can map a custom domain to their public proof page.

### Phase C: AI Assist (Low-Risk)

- **AI Headline + Bio Optimizer:** Rewrite suggestions to improve clarity and trust.
- **AI Testimonial Summarizer/Shortener (Optional):** Suggest concise testimonial variants.
- **AI Metric Framing Suggestions (Optional):** Suggest clearer metric phrasing without inventing claims.
