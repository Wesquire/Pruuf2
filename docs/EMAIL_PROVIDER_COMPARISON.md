# Pruuf Email Platform Comparison (Non-Technical Summary)

**Version:** 1.0  
**Audience:** Non-technical stakeholders (product, marketing, operations)  
**Purpose:** Help the team understand which email service to use for Pruuf.

---

## 1. What Pruuf Needs from Email

- **Low volume:** Under ~1,000 emails per month for a long time.
- **Critical importance:** Some emails are safety-related (missed check-in alerts).
- **Types of emails:**
  - Account sign-up and verification codes.
  - Invitations for new Members (with links/codes).
  - Missed check-in alerts and updates to Contacts.
  - Occasional trial/payment notices.
- **Priorities:**
  - High reliability and deliverability.
  - Easy for non-developers to review what was sent.
  - Ability to adjust wording and layout of emails over time.
  - Reasonable cost (not rock-bottom, but good value).

---

## 2. Options at a Glance

| Provider  | Best At                                           | Fit for Pruuf Today            |
|----------|----------------------------------------------------|--------------------------------|
| Postmark | Reliable transactional (system) emails & logging   | **Excellent – recommended**    |
| SendGrid | Marketing campaigns, automation, and segmentation  | Good, more for future marketing|
| Resend   | Developer experience and code-centric templates    | Okay, weaker for non-dev users |

---

## 3. Postmark

**What it is**  
A service focused on important, one-off “system” emails like verification codes, password resets, and alerts.

**Strengths for Pruuf**
- **Reliability:** Very strong track record for delivering transactional emails to inboxes.
- **Safety fit:** Ideal for safety-adjacent alerts (like “Missed check-in”) where failure is not acceptable.
- **Simple dashboard:** Easy to:
  - Search for a specific email sent to a user.
  - See if it was delivered, opened, or bounced.
- **Template support:** Has a visual editor so non-devs can adjust subject lines, copy, and layout once we move templates into Postmark.
- **Aligned with our build:** Already chosen in our architecture and partially integrated into the backend.

**Weaknesses**
- Not focused on heavy marketing automation (complex campaigns, drip sequences, etc.).
- Slightly more expensive than bare-bones tools, but at our low volume this means only a few dollars per month difference.

**Summary**  
Postmark is an excellent match for Pruuf’s current stage: low volume, high-importance emails, and a need for a clean, understandable dashboard.

---

## 4. SendGrid

**What it is**  
A general-purpose email platform used for both system emails and large marketing campaigns (newsletters, automated sequences).

**Strengths for Pruuf**
- **Marketing features:** Strong tools for:
  - Campaigns and newsletters.
  - Audience lists and segmentation.
  - A/B testing and automation flows.
- **Template editor:** Non-developers can create and manage email templates in a visual editor.
- **Pricing tiers:** Has free and low-cost starter plans that easily cover our early volume.

**Weaknesses**
- **Complexity:** The dashboard has a lot of options and can be overwhelming if we mainly care about a handful of critical transactional emails.
- **Reliability perception:** Generally good, but community feedback is more mixed than Postmark’s reputation for critical transactional alerts.
- **Rework cost:** We would need to redo some of the Postmark-focused integration and documentation if we switched.

**Summary**  
SendGrid is a strong option **if and when** Pruuf leans heavily into email marketing and wants marketing staff to live inside the email platform every day. It is more platform than we need for core safety alerts right now.

---

## 5. Resend

**What it is**  
A newer, developer-focused email service built for modern JavaScript/TypeScript apps and “emails defined in code.”

**Strengths for Pruuf**
- **Developer experience:** Very clean APIs and tooling that developers enjoy using.
- **Modern stack alignment:** Fits nicely with a modern TypeScript and serverless mindset.
- **Cost:** Competitive, usage-based pricing with generous free tiers for low volume.

**Weaknesses**
- **Non-dev experience:** The product is aimed at developers; the dashboard and tools are not as friendly or feature-rich for non-technical staff as Postmark or SendGrid.
- **Track record:** Newer provider with less long-term history than the other two; that’s a small but real risk for safety-related alerts.
- **Content ownership:** Works best when developers own email templates in code, which reduces flexibility for non-devs.

**Summary**  
Resend is attractive for engineers, but is not ideal if we want non-technical team members to manage email content and troubleshoot deliveries using the provider’s UI.

---

## 6. Side Note: Push Notifications (FCM) vs Alternatives

Pruuf uses **two channels** for alerts:
- **Push notifications** via Firebase Cloud Messaging (FCM).
- **Email notifications** via an email provider (the subject of this document).

Other multi-channel tools (like OneSignal or more complex orchestration platforms) exist, but:
- We already designed our own simple rules (which alerts go by push vs email).
- Our volume is small.
- Adding another big tool would increase complexity and cost without a clear benefit today.

Conclusion: FCM + email is appropriate for now; this document focuses on choosing the email side.

---

## 7. Recommendation

**Primary choice: Postmark (Recommended Now)**

- Best match for Pruuf’s current needs:
  - Low volume.
  - High-importance transactional emails (verification, invitations, missed check-ins).
  - Simple, clear dashboard for non-technical teammates.
- Already aligned with and partially integrated into our architecture.
- Easy path to give non-devs more control by moving key emails into Postmark templates.

**Secondary / future option: SendGrid**

- A good option to add later if:
  - We invest heavily in marketing emails (newsletters, drip campaigns).
  - Marketing needs advanced segmentation and automation tools directly in the email platform.
- In that scenario, we could:
  - Keep Postmark for critical safety emails, and
  - Use SendGrid for purely marketing messages.

**Not recommended as primary today: Resend**

- Great developer experience but not ideal for non-technical users.
- Newer provider with less of a track record for safety-critical alerts.

---

## 8. Plain-Language Summary (One Page)

- Pruuf sends a small number of **very important** emails (verification, invitations, safety alerts).
- We value **reliability and clarity** over cutting every possible cost.
- **Postmark** is the best fit today:
  - It specializes in these kinds of important system emails.
  - Its dashboard is straightforward enough for non-technical teammates to use.
  - It is already the service our technical design is built around.
- **SendGrid** is a strong marketing and campaign tool we can consider later if email marketing becomes a major focus.
- **Resend** is nice for developers but not as helpful for non-developers, and is less proven for safety-critical use.

**Bottom line:**  
Use **Postmark** as the primary email provider for Pruuf now, and revisit adding a marketing-focused tool like **SendGrid** only if our email marketing needs grow significantly.

