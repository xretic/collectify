# Compliance checklist

Where Collectify stands on the usual legal and accessibility basics. The legal texts are
templates written for this app: **have them reviewed by a lawyer** before a public launch, and
fill in the operator details (see [Deployment](DEPLOYMENT.md#environment-variables)).

| #   | Item                        | Status | Where                                                                                                                                                     |
| --- | --------------------------- | :----: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Privacy policy              |   ✅   | `/privacy-policy`: controller, legal bases (GDPR), processors, retention, rights, age, cookies                                                               |
| 2   | Terms of service            |   ✅   | `/terms`                                                                                                                                                  |
| 3   | Refund policy               |  n/a   | Nothing is sold; the Terms say the service is free and that prices and refund terms will be shown before any payment                                        |
| 4   | Cookie policy               |   ✅   | `/cookies`: every cookie and storage key, purpose and lifetime                                                                                             |
| 5   | Cookie consent banner       |   ✅   | Only necessary cookies today, so the banner just informs. Setting `NEXT_PUBLIC_ANALYTICS_PROVIDER` turns it into Accept all / Reject all / Customize (equal weight); scripts must check `hasConsent('analytics')` |
| 6   | Form consents               |   ✅   | Sign-up: unticked "I am 18 or older" box, links to Terms and Privacy under the email form, the Google/GitHub buttons and the sign-in dialog. `User.termsAcceptedAt` records when |
| 7   | No unnecessary data         |   ⚠️   | Sessions store no IP or user agent; rate-limit IPs live at most an hour. The optional birth date is now redundant (age is confirmed at sign-up) and could be removed |
| 8   | Third-party SDKs            |   ✅   | No analytics or ad SDKs. Processors are listed in the Privacy Policy (Vercel, Neon, Uploadcare, Resend, Pusher, Redis, Google/GitHub sign-in)                   |
| 9   | Dark patterns               |   ✅   | No pre-ticked boxes; declining is as easy as accepting; onboarding steps can be skipped; dialogs close; account deletion is in Settings                          |
| 10  | Hidden fees                 |  n/a   | No payments                                                                                                                                               |
| 11  | Fake reviews                |   ❌   | The seeded demo data (thousands of generated users, comments and likes) is fake social proof and must be removed before a public launch                     |
| 12  | Unsupported claims          |   ✅   | Marketing and SEO copy avoids claims the product cannot back ("real people" was removed); the Privacy Policy only promises image deletion when it is configured |
| 13  | Alt text                    |   ✅   | Content images carry alt text, decorative ones `alt=""`; icon buttons have accessible names                                                                   |
| 14  | Color contrast              |   ✅   | All 45 themes meet WCAG AA: 4.5:1 for text (including buttons), 3:1 for icons                                                                                |
| 15  | Keyboard navigation         |   ✅   | "Skip to content" link, a visible focus ring in every theme, ⌘K / Ctrl+K search, arrow keys in search and the item viewer                                       |
| 16  | Business details            |   ⚠️   | `/legal` shows `LEGAL_NAME`, `LEGAL_ADDRESS`, `CONTACT_EMAIL`, `LEGAL_COUNTRY`; they must be set                                                            |
| 17  | Age / children's data       |   ✅   | 18+ only, confirmed at sign-up (and by continuing with Google/GitHub); a birth date under 18 cannot be saved                                                   |
| 18  | Unsubscribe link in emails  |  n/a   | Only transactional emails (password reset, email confirmation). Any future digest or marketing email needs an unsubscribe link and `List-Unsubscribe`        |
| 19  | Font and image licences     |   ✅   | Google Sans comes from Google Fonts via `next/font`, Rubik is bundled; both are under the SIL Open Font License. Seeded images hotlink third-party artwork (see 11) |
| 20  | Data deletion and access    |   ✅   | Settings → Your data downloads a JSON export; Settings → Danger zone deletes the account (and, with `UPLOADCARE_SECRET_KEY`, its uploaded images)              |
