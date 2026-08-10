# Meumip storefront redesign brief

Updated: 2026-08-05

## Current status

The redesign is in the preparation and asset-definition phase. The supplied
hand-drawn screens are wireframes for layout and behavior only. They are not
pixel-perfect artwork that the implementation must copy.

No storefront redesign code should be treated as final until the core brand
assets below have been selected or approved.

## Confirmed direction

- Redesign the customer storefront with a soft, playful, pastel Meumip style.
- Preserve responsive behavior for mobile, tablet, and desktop; the 9:16
  sketches only define the mobile direction.
- Keep the administration area function-first for the initial redesign phase.
- Use reusable Angular components and typed `FormBuilder` forms.
- The backend remains available at `http://localhost:8080`.
- The `meumip.co` logo will be supplied as an SVG and optionally a transparent
  PNG fallback. The SVG wordmark must be outlined so it does not depend on a
  client-installed font.
- The primary handwritten font will be self-hosted as WOFF2 and must include
  Vietnamese characters and diacritics.
- The icon family must cover menu, search, voucher, cart, order history, and
  notification. Icons will be SVG assets using one consistent visual family.
- Slideshow content is managed by administrators. Images, links, ordering,
  visibility, and active dates must not be hard-coded in the frontend.

## Storefront features to implement

### Shared shell

- Sticky translucent/blurred storefront header.
- Logo, menu, search, voucher, cart, history, and notification entry points.
- Scrollable side drawer with dimmed/blurred page backdrop.
- Responsive navigation and fixed scroll-to-top/scroll-to-bottom controls.
- Shared pastel design tokens, typography, doodle decorations, buttons,
  dialogs, empty states, loaders, and form controls.

### Home and catalog

- Admin-managed hero slideshow with 3-5 visible slides.
- Voucher announcement/claim prompt.
- Product categories based on the final category taxonomy.
- Product sorting: newest, price ascending, price descending, and popular.
- Product grid density control with responsive column counts.
- Product card hover/focus/tap treatment, including the requested text color
  transition.
- Pagination backed by the API.
- Review area; initially decorative/blurred unless real review data is approved.

### Customer drawer and information

- Login and registration entry points.
- Notification preferences.
- Claimed vouchers and expiry state.
- Purchase history.
- Working hours and peak-period warning.
- Bank information and official payment QR asset.
- Social links and email.
- Order/terms information, exchange policy, and care instructions.

### Existing customer flows to restyle

- Product detail.
- Cart.
- Checkout, including voucher application.
- Authentication.
- Order list and order detail.
- Contact/shop-information content.

## Backend and administration work

- Slideshow entity and admin CRUD, including a desktop image, an optional
  mobile crop, alt text, destination link, sort order, active state, and an
  optional publish window.
- Category entity, product-category assignment, and admin management.
- Public product pagination, category filtering, and sorting.
- Popularity metric definition and server-side sorting.
- Voucher, user-voucher, and redemption models; server-side checkout validation.
- Customer notification-preference endpoints.
- Site/shop settings for hours, bank QR, social links, and policy content if
  these values need to be editable by administrators.
- Real review endpoints only if the review area is changed from decorative to
  functional.

## Asset checklist before visual implementation is finalized

- [ ] Approved `meumip.co` SVG wordmark.
- [ ] Transparent PNG logo fallback.
- [ ] Approved handwritten web font with Vietnamese support.
- [ ] WOFF2 files for only the weights actually used.
- [ ] Six approved SVG icons: menu, search, voucher, cart, history,
      notification.
- [ ] Optional matching SVG doodles/decorations.
- [ ] Initial 3-5 slideshow images (desktop plus optional mobile crops) with alt
      text and destination links.
- [ ] Official category list and product mappings.
- [ ] Official bank/payment QR image.
- [ ] Final social URLs and email address.
- [ ] Approved working hours, holiday warning, policies, and care text.
- [ ] Final voucher business rules.

## Proposed visual asset workflow

1. Use Figma as the source file for the logo, icon components, color styles,
   typography, and responsive mockups.
2. Start icons from one consistent SVG family instead of drawing from scratch.
3. Adjust stroke width, rounded line caps, colors, and small path details in
   Figma; keep every icon on the same 24x24 grid and optical weight.
4. Export icons and the outlined logo as SVG. Export transparent PNG only as a
   fallback or for channels that cannot use SVG.
5. Keep source assets in the design file and production exports in Angular's
   public asset directory using stable kebab-case names.
6. Self-host the approved fonts; preload only the main WOFF2 file and retain a
   readable system-font fallback.

## Recommended defaults pending final approval

- Logo wordmark direction: custom outlined lettering, separate from body text.
- Handwritten UI font shortlist: Mali, Pangolin, Patrick Hand, or Itim.
- Readable body/form font: keep a conventional rounded sans-serif; do not use
  handwriting for long descriptions, forms, prices, or admin tables.
- Icon workflow: Streamline Freehand if a paid consistent library is acceptable;
  otherwise Iconify for Figma using one open-source icon set and light vector
  customization.
- Voucher baseline: VND 20,000, one claim per authenticated customer, valid for
  seven days after claim, all products, non-stackable, no minimum spend until a
  different rule is approved.
- Admin UI remains structurally unchanged except for new management pages and
  fields required by slideshow, categories, vouchers, and site settings.

## Not started yet

- Brand asset creation/approval.
- Storefront redesign implementation.
- New slideshow/category/voucher/preferences/site-settings backend schema and
  endpoints.
- Corresponding admin management screens.
