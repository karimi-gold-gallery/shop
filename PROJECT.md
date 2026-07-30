# گالری طلا و جواهر کریمی — Project Documentation

Complete technical and business overview of **karimi-gold-gallery**. Reading this document should be enough to understand what the product does, how it is built, and where everything lives in the codebase.

---

## 1. What this project is

**Karimi Gold Gallery** (گالری طلا و جواهر کریمی) is a Persian, RTL e-commerce web app for a gold and jewelry shop.

Customers can:

- Browse 18k and 24k gold jewelry by category
- See live prices based on the current gold price per gram plus making wage (اجرت)
- See their **personal discount** (if an admin granted one) already applied to every price
- Add items to a cart, place an order, and receive an order code
- Contact the gallery by phone to complete payment and pickup/delivery
- See their **membership level** (1–3) and how much more spending unlocks the next level

There is **no online payment gateway**. Checkout creates a pending order; fulfillment happens offline after the customer calls the shop with their order code.

Admins can:

- Manage categories and products (including images)
- Manage customers (list, create, edit, delete) and see each user’s level
- Grant any customer a **personal discount percentage** applied to all prices that customer sees
- Monitor automatically synchronized 18k and 24k gold prices
- View and update order statuses

---

## 2. Tech stack

| Layer | Technology |
|--------|------------|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19**, Tailwind CSS 4, Radix UI, CVA, lucide-react |
| Language | TypeScript |
| Validation | Zod 4 |
| Database | **PostgreSQL** via **Drizzle ORM** (`drizzle-orm/node-postgres` + `pg`) |
| Auth | Custom cookie sessions + **bcryptjs** |
| Dates | Jalali via `react-multi-date-picker` |
| Toasts | sonner |
| Font | **Vazirmatn** (`next/font/google`) |

### Scripts (`package.json`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local development |
| `npm run build` / `start` | Production build & serve |
| `npm run lint` | ESLint |
| `npm run db:push` | Push the Drizzle schema to the DB (`drizzle-kit push`) |
| `npm run db:generate` | Generate a SQL migration from schema changes |
| `npm run db:migrate` | Apply generated migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run seed` | Seed admin, categories, sample products, gold price |
| `npm run seed:users` | Seed 30 sample customer accounts |
| `npm run worker:gold-prices` | Optional local 30-second TGJU sync worker |

Production synchronization is configured in `liara.json`: one cron invocation
runs every minute and a second invocation waits 30 seconds. Both call the
protected sync endpoint using `CRON_SECRET`. Do not run the separate worker in
Liara at the same time, or each interval will be executed twice.

### Notable config

- `next.config.ts`: Turbopack root pinned; Server Actions body limit **10mb** (product image uploads)
- `drizzle.config.ts`: schema path (`lib/db/schema.ts`), migration output dir, `DATABASE_URL`
- No `middleware.ts` — auth is enforced in layouts and server helpers

---

## 3. Business model & pricing

### Core idea

Products are priced dynamically from:

1. **Weight** (grams of gold)
2. **Current gold price per gram** (تومان) — selected from the product's 18k/24k karat
3. **Wage / making charge** (اجرت ساخت) — per product, in تومان
4. **Personal discount** (درصد تخفیف اختصاصی) — per customer, 0 by default

### Formula

```text
basePrice = weight × goldPricePerGram + wage
unitPrice = basePrice × (1 − discountPercent / 100)
lineTotal = unitPrice × quantity
```

Implemented in `lib/pricing.ts`:

| Function | Purpose |
|----------|---------|
| `computeProductPrice(weight, wage, goldPricePerGram, discountPercent = 0)` | Final price the viewer pays |
| `computeBaseProductPrice(weight, wage, goldPricePerGram)` | Undiscounted price (crossed-out display) |
| `applyDiscount(amount, discountPercent)` | Discount any Toman amount |
| `normalizeDiscountPercent(percent)` | Clamp to `0…100`, non-finite → 0 |

### Gold price

- Stored as two rows in `GoldPrice`, keyed by karat 18 and 24
- TGJU Rial values are converted to Toman before storage
- Updated by the protected sync API and the separate 30-second worker
- Both prices and their source timestamps are shown in the admin dashboard

### Per-customer discounts

An admin can give any customer a discount percentage; every price that customer sees is reduced by it.

| Detail | Behavior |
|--------|----------|
| Storage | `User.discountPercent` — Float, `0…100`, default `0` |
| Who gets it | `CUSTOMER` role only — guests and admins always see list prices |
| Scope | Applies to the **whole** price (gold value + wage), not just the wage |
| Where resolved | `lib/pricing.ts` → `getUserDiscountPercent(user)` / `getViewerPricing()` |
| Admin UI | `/admin/users` — field in the create & edit dialogs, plus a “تخفیف” column |
| Validation | `discountPercentField` in `lib/schemas.ts`; blank → `0`, accepts decimals and Persian digits |
| Sorting | Uniform multiplier, so price sort order is unaffected — no change to ranking logic |

Customer-facing display when a discount is active:

- Product cards: تخفیف badge + crossed-out base price
- Product detail: crossed-out base price and the Toman amount saved
- Cart / checkout: “جمع بدون تخفیف” line plus a discount line
- `PersonalDiscountNotice` banner on `/products`, `/cart`, and `/profile`

### Order snapshots

When an order is placed, the system **freezes** prices into the order:

- Order-level: `goldPrice`, `discountPercent`, `totalGrams`, `totalWage`, `totalPrice`
- Line-level: `name`, `weight`, `karat`, `wage`, `goldPrice`, `unitPrice`, `quantity`, optional `imageId`

`totalPrice` and `unitPrice` are the **discounted** amounts — what the customer actually owes. Mixed-karat undiscounted totals are reconstructed from each line's snapshotted karat-specific `goldPrice`; the order-level `goldPrice` is retained as a gram-weighted compatibility value.

Later gold-price changes — and later changes to the customer’s discount — do **not** change historical orders.

### Order codes

Format: `KG-######` (e.g. first order → `KG-100001`)

```ts
// lib/orders.ts
`KG-${String(100000 + orderCount + 1).slice(0, 6)}`
```

Generated from current order count (not UUID). Concurrent creates could theoretically collide; acceptable for current scale.

### Order statuses

| Status | Meaning (typical UI) |
|--------|----------------------|
| `PENDING` | Default after checkout — waiting for customer contact |
| `PAID` | Payment confirmed |
| `FINISHED` | Completed / delivered |
| `CANCELLED` | Cancelled |

Admin dashboard revenue sums `totalPrice` for orders with status `PAID` or `FINISHED`.

### Fulfillment flow

1. Customer places order → status `PENDING`, cart cleared
2. Customer is shown order code + shop contact on `/orders/[code]`
3. Customer calls the gallery and references the code
4. Admin updates status through the admin order UI

### Customer membership levels

Levels apply to **CUSTOMER** users only (not admins). They are **computed**, not stored on `User`.

Helpers: `lib/user-levels.ts`  
UI: `components/user-level-card.tsx` (profile), admin users table

| Level | Min total spent (تومان) | Notes |
|-------|-------------------------|--------|
| 1 | `0` | Default for every new registration |
| 2 | `50_000_000` | |
| 3 | `200_000_000` | Max level |

- **Spend source:** sum of `Order.totalPrice` where status is `PAID` or `FINISHED` (`LEVEL_COUNTABLE_STATUSES`) — this is the **discounted** amount, so a personal discount slows level progress slightly
- **Profile:** customers see current level, progress bar, remaining amount to next level, and all thresholds
- **Admin:** each customer row shows level + total spend
- Levels currently unlock **no benefits** — reserved for future perks. Personal discounts are set manually per user and are **not** tied to level

Thresholds live in `LEVEL_THRESHOLDS` and are easy to change later.

---

## 4. User roles & auth

### Roles

Stored as a plain string on `User.role` (not a Postgres enum):

| Role | Who |
|------|-----|
| `CUSTOMER` | Default on registration |
| `ADMIN` | Seeded admin; full admin panel |

### Session model

| Detail | Value |
|--------|--------|
| Cookie name | `karimi_session` |
| Cookie value | 32-byte hex token |
| DB | `Session` row with `token`, `userId`, `expiresAt` |
| TTL | **30 days** |
| Flags | `httpOnly`, `sameSite: "lax"`, `secure` in production, `path: "/"` |

Core helpers live in `lib/auth.ts`:

| Function | Behavior |
|----------|----------|
| `hashPassword` / `verifyPassword` | bcrypt cost 10 |
| `createSession` | Create DB session + set cookie |
| `getCurrentUser` | Resolve cookie → user (or null); purge expired |
| `signOut` | Delete session + cookie |
| `requireUser` | Redirect to `/login` if anonymous |
| `requireAdmin` | Non-admin → `/` |
| `requireOnboardedUser` | Not onboarded → `/onboarding` |
| `requireIncompleteOnboarding` | Guard for onboarding page |
| `redirectIfAuthenticated` | Leave login/register if already logged in |
| `getPostAuthRedirectPath` | ADMIN → `/admin`; not onboarded → `/onboarding`; else `/` |

`SafeUser` is `User` without `passwordHash`.

### Auth flows

```text
Register → create CUSTOMER + session → /onboarding
Login    → POST /api/auth/login → session → post-auth path
Onboard  → profile fields + phone → onboarded=true → /
Logout   → POST /api/auth/logout (or logoutAction)
```

**Login** uses a classic HTML form `POST` to `/api/auth/login` (303 redirect) so browsers can offer to **save passwords**. Errors return to `/login?error=...&username=...`.

**Register / onboarding / profile** use Server Actions in `app/actions/auth.ts`.

### Onboarding vs profile

New users must complete onboarding before shopping checkout:

- Required: first name, last name, Jalali birth date, gender (`MALE` / `FEMALE`), phone
- Phone rules: Persian/Arabic digits converted to English; must match `09` + 9 digits (11 total)

Profile page can also update: national code, city, address, postal code.

Customers also see their membership level card on `/profile` (not shown for admins).

Admins can create customers from `/admin/users` (bypassing self-registration); those users are created as `CUSTOMER` with `onboarded: true`.

---

## 5. Database schema

File: `lib/db/schema.ts` (Drizzle), client in `lib/db/index.ts`  
Provider: PostgreSQL (`DATABASE_URL` via `drizzle.config.ts`)  
IDs: cuid2, generated client-side by the schema's `$defaultFn`

Table names are PascalCase and column names camelCase (both quoted), matching the
database as it was originally created — no rename migration was needed.
`createdAt` defaults to `CURRENT_TIMESTAMP` in the DB; `updatedAt` is written by
the client on every insert and update (`$defaultFn` / `$onUpdate`).

### Entity relationship overview

```text
User ──< Session
User ──< CartItem >── Product
User ──< Order ──< OrderItem >── Product
Category ──< Product ──< ProductImage
Setting (key/value)
GoldPrice (18/24 karat)
```

### Models

#### User

| Field | Notes |
|-------|--------|
| `username` | Unique |
| `passwordHash` | bcrypt |
| `role` | `"CUSTOMER"` \| `"ADMIN"` |
| `firstName`, `lastName`, `birthDate`, `gender`, `phone` | Profile |
| `nationalCode`, `address`, `city`, `postalCode` | Optional address/ID |
| `discountPercent` | Float `0…100`, default `0` — personal discount on every price this customer sees |
| `onboarded` | Default `false` |
| *(no `level` column)* | Level is derived from paid/finished order totals |

Deleting a customer with existing orders is **blocked** (`Order.userId` is `onDelete: Restrict`). Admin delete clears sessions + cart first when the user has zero orders.

#### Session

`token` (unique), `userId` → User (cascade), `expiresAt`

#### Category

`name` / `slug` unique, optional `description`

#### Product

| Field | Notes |
|-------|--------|
| `name`, `slug` | Slug unique |
| `weight` | Float, grams |
| `karat` | Required 18 or 24; existing products backfilled to 18 |
| `wage` | Float, تومان, default 0 |
| `active` | Default `true`; inactive hidden from storefront |
| `categoryId` | Restrict on delete |
| `images` | Binary blobs in DB |

#### ProductImage

`data` (Bytes), `mimeType`, cascade delete with product. Served at `GET /api/images/[id]`.

#### CartItem

Unique `(userId, productId)`, `quantity` default 1. Cascade with user/product.

#### Order

| Field | Notes |
|-------|--------|
| `code` | Unique public code (`KG-…`) |
| `status` | Default `"PENDING"` |
| `totalGrams`, `totalWage`, `goldPrice`, `totalPrice` | Snapshots; `totalPrice` is post-discount |
| `discountPercent` | Float, default `0` — customer discount in effect at checkout |
| `note` | Optional customer note |
| Indexes | `userId`, `status` |

#### OrderItem

Line snapshot: `name`, `weight`, `karat`, `wage`, `goldPrice`, `unitPrice`, `quantity`, optional `imageId`. `unitPrice` is post-discount; the base price stays derivable as `weight × goldPrice + wage`. Product relation is Restrict (product cannot be deleted if referenced by order lines — delete product carefully / via admin flow).

#### Setting

`key` unique, `value` string. Reserved for extensible application configuration.

#### GoldPrice

One row per supported karat (18 and 24), storing Toman per gram plus the raw
TGJU Rial price, source timestamp, and last synchronization timestamp.

---

## 6. Application routes

### Storefront & account

| Route | Purpose |
|-------|---------|
| `/` | Home: hero, categories, featured products |
| `/products` | Catalog with search, category filters, sort, **pagination** (`?page=`) |
| `/products/[slug]` | Product detail + add to cart |
| `/cart` | Cart management |
| `/checkout` | Confirm order + optional note (requires onboarded user) |
| `/orders/[code]` | Order confirmation / detail (owner or admin) |
| `/login` | Login form |
| `/register` | Registration |
| `/onboarding` | First-time profile completion |
| `/profile` | Edit profile, membership level, paginated order history (`?tab=orders&page=`) |
| `/about` | About the gallery |
| `/contact` | Shop contact info from env/defaults |

### Admin (layout requires admin)

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard stats + gold price form |
| `/admin/products` | Product list (paginated) |
| `/admin/products/new` | Create product |
| `/admin/products/[id]/edit` | Edit product / images |
| `/admin/categories` | Category CRUD |
| `/admin/orders` | Orders list (paginated) |
| `/admin/orders/[id]` | Order detail + status actions |
| `/admin/users` | Customer list + create / edit / delete (paginated); shows level, spend & personal discount |

### API

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/login` | Credential check, session, 303 redirect |
| `POST` | `/api/auth/logout` | Clear session → `{ ok: true }` |
| `GET` | `/api/images/[id]` | Stream product image bytes (`force-dynamic`, cache 1 day) |

### Layouts / guards

| Layout | Guard |
|--------|--------|
| Root `app/layout.tsx` | RTL `lang="fa"`, header/footer shell, Toaster |
| `login` / `register` | `redirectIfAuthenticated()` |
| `onboarding` | `requireIncompleteOnboarding()` |
| `admin` | `requireAdmin()` + sidebar |

---

## 7. Server actions

### Auth — `app/actions/auth.ts`

| Action | Does |
|--------|------|
| `registerAction` | Validate → create user → session → `/onboarding` |
| `onboardingAction` | Save required profile → `onboarded` → `/` |
| `updateProfileAction` | Update full profile from `/profile` |
| `logoutAction` | Sign out → `/` |

### Cart — `app/actions/cart.ts`

| Action | Does |
|--------|------|
| `addToCartAction` | Login required; create or increment; skip inactive products |
| `updateCartQuantityAction` | Set qty; qty ≤ 0 removes line |
| `removeFromCartAction` | Remove line |
| `clearCartAction` | Wipe cart (used after order) |

### Orders — `app/actions/orders.ts`

| Action | Does |
|--------|------|
| `placeOrderAction` | Snapshot prices **with the customer’s discount applied**, store `discountPercent` on the order, create `PENDING` order, clear cart, redirect to `/orders/{code}` |

### Admin — `app/actions/admin.ts` (all call `requireAdmin`)

| Action | Does |
|--------|------|
| Category CRUD | Create / update / delete (delete blocked if products exist) |
| Product create/update | Fields + multi image upload from FormData `images` |
| `deleteProductAction` / `deleteProductImageAction` | Remove product or one image |
| `updateOrderStatusAction` | Validate via `orderStatusSchema` |
| `deleteOrderAction` | Delete order |
| `updateGoldPriceAction` | Upsert gold price setting |
| `createUserAction` | Create `CUSTOMER` (admin form; `onboarded: true`), including `discountPercent` |
| `updateUserAction` | Update customer profile + `discountPercent`; optional password change. Also `revalidatePath("/", "layout")` because prices are personalised |
| `deleteUserAction` | Delete customer if no orders; clears sessions + cart |

Product/category slugs: `lib/slug.ts` — slugify name + short random suffix.

Admin users UI: `components/admin-users.tsx` (`CreateUserButton`, table with edit/delete dialogs).

---

## 8. Catalog & search

Helpers: `lib/products.ts`, `lib/product-search.ts`

### Storefront listing

- Only **active** products by default
- URL query params: `q` (text), `category` (comma-separated slugs), `sort`, `page`
- Changing filters rebuilds the URL **without** `page` (resets to page 1)
- Paginated via `getFilteredProductsPage` → `{ products, pagination }`

### Sort options

| Value | Behavior |
|-------|----------|
| `newest` | By created date — true DB `skip` / `take` |
| `price-asc` / `price-desc` | Rank by computed price (`weight × gold + wage`), then hydrate the current page. Personal discounts are a uniform multiplier, so they never change the ordering |

### Categories (seeded)

| Persian name | Slug |
|--------------|------|
| انگشتر | `ring` |
| گردنبند | `necklace` |
| دستبند | `bracelet` |
| النگو | `bangle` |
| گوشواره | `earrings` |
| زنجیر | `chain` |

---

## 9. Pagination

Shared helpers: `lib/pagination.ts`  
UI: `components/pagination-controls.tsx` (prev/next, page numbers, range label, RTL)

| Constant / page | Default page size |
|-----------------|-------------------|
| `DEFAULT_PAGE_SIZE` (admin products, orders, users) | **20** |
| `PRODUCTS_PAGE_SIZE` (storefront `/products`) | **12** |
| `PROFILE_ORDERS_PAGE_SIZE` (`/profile?tab=orders`) | **10** |

Query param: `?page=` (1-based). Invalid / out-of-range pages are clamped.

Categories admin list is **not** paginated (expected to stay small).

---

## 10. UI & design system

### Brand & locale

- Fully **Persian (Farsi)** UI, document `dir="rtl"` / `lang="fa"`
- Brand names: گالری کریمی / گالری طلا و جواهر کریمی
- Logo: `public/logo.png`
- Visual tone: warm beige backgrounds, gold primary actions, deep navy accents

### Design tokens (`app/globals.css`)

| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#f7f1e6` | Page beige |
| `--foreground` | `#2a241c` | Body text |
| `--primary` | `#b08843` | Gold actions |
| `--secondary` | `#ece0c8` | Soft surfaces |
| `--navy` | `#01034e` | Brand navy |
| `--gold` | `#c9a14a` | Gold accent |
| `--destructive` | `#b3261e` | Errors |
| `--radius` | `0.85rem` | Corner radius |

Utilities include `.navy-gradient`, `.gold-gradient`, `.beige-texture`.

### Typography

**Vazirmatn** mapped to `--font-sans` (Arabic + Latin subsets).

### Component layers

1. **UI primitives** — `components/ui/*` (shadcn-style): button, input, select, dialog, table, badge, card, etc.
   - Button/badge variants include `navy`, `gold`, `success`
2. **Domain components** — e.g. `site-header`, `site-footer`, `main-nav`, `product-card`, `product-filters`, `add-to-cart-button`, `cart-item-row`, `order-code-box`, `profile-form`, `user-level-card`, `personal-discount-notice`, `pagination-controls`, `admin-*` (including `admin-users`), `jalali-date-picker`, `digits-input`, `user-menu`, `search-box`

### Important UX details

- Sticky header with live gold price strip and cart count (Persian digits)
- Checkout and order pages explain offline phone fulfillment
- Order code is copyable (`OrderCodeBox`)
- Numbers often displayed with `toPersianDigits` while forms normalize input to English digits

### Digit handling

- `toPersianDigits` / `toEnglishDigits` in `lib/format.ts`
- `DigitsInput` converts Persian/Arabic numerals as the user types
- Zod schemas preprocess digit fields with `toEnglishDigits`
- Phone: must be `09XXXXXXXXX` (11 digits)

---

## 11. Validation (`lib/schemas.ts`)

| Schema | Highlights |
|--------|------------|
| `loginSchema` | username min 3, password min 6 |
| `registerSchema` | username `^[a-zA-Z0-9_.-]+$`, password confirm match |
| `phoneSchema` | English digits + `/^09\d{9}$/` |
| `onboardingSchema` | Name, birthDate, gender, phone |
| `profileSchema` | Onboarding fields + optional national/postal/city/address |
| `categorySchema` | Name required |
| `productSchema` | weight > 0, wage ≥ 0, category required |
| `goldPriceSchema` | price > 0 |
| `orderStatusSchema` | `PENDING` \| `PAID` \| `FINISHED` \| `CANCELLED` |
| `adminCreateUserSchema` | username, password, name, phone, gender, birthDate, optional city, `discountPercent` |
| `adminUpdateUserSchema` | same + optional password, address/national/postal, `onboarded` |
| `discountPercentField` | Shared: blank/missing → `0`; Persian digits and decimals accepted; must be `0…100` |

Formatting helpers also live in `lib/format.ts`: `formatToman`, `formatGram`, `formatPercent`, `formatDateJalali`, etc. (locale `fa-IR`, timezone `Asia/Tehran` for dates).

---

## 12. Shop contact config

`lib/shop.ts` — `getShopInfo()` merges env with defaults:

| Env var | Default |
|---------|---------|
| `SHOP_PHONE` | `021-52002092` |
| `SHOP_MOBILE` | empty |
| `SHOP_ADDRESS` | بازار بزرگ تهران، پاساژ دلگشا، طبقه ۳، واحد ۲۷ |
| `SHOP_INSTAGRAM` | empty |
| `SHOP_SLOGAN` | زیبایی و شکوهی که شایسته شماست |
| `SHOP_EXPERIENCE` | با بیش از ۴۰ سال سابقه تک‌فروشی و بنکداری |

Used on footer, contact page, and order confirmation.

---

## 13. Environment & setup

### Required / important env

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (required) |
| `ADMIN_USERNAME` | Seed admin username (default `admin`) |
| `ADMIN_PASSWORD` | Seed admin password (default `admin12345`) |
| `SHOP_*` | Contact/branding overrides (see above) |
| `NODE_ENV` | Affects secure cookies |

### Typical local setup

```bash
# 1. Install
npm install

# 2. Set DATABASE_URL in .env

# 3. Push schema
npm run db:push

# 4. Seed admin + sample catalog
npm run seed

# 5. Run
npm run dev
```

Default admin after seed: username/password from env (or `admin` / `admin12345`). Change the password in production.

Seed also creates gold price setting `4500000`, six categories, and sample products with generated SVG images (skips existing slugs).

### Optional sample customers

`scripts/seed-users.ts` — creates **30** sample `CUSTOMER` accounts (`user01` … `user30`, password `User12345`). Skips existing usernames.

```bash
npm run seed:users
```

### Legacy

`scripts/migrate-sqlite-to-pg.ts` — one-off migration helper from an earlier SQLite era.

---

## 14. End-to-end purchase path

```text
Browse catalog (live gold price in header)
        ↓
Login / Register → Onboarding (if needed)
        ↓
Add to cart → /cart → /checkout
        ↓
placeOrderAction
  • compute each line with the current price for its product's karat
  • apply the customer's personal discount (if any)
  • create Order + OrderItems (PENDING), storing discountPercent
  • generate KG-###### code
  • clear cart
        ↓
/orders/KG-######  (show code + shop phone)
        ↓
Customer calls gallery
        ↓
Admin: PENDING → PAID → FINISHED  (or CANCELLED)
```

---

## 15. Key file map

| Concern | Path |
|---------|------|
| Drizzle schema | `lib/db/schema.ts` |
| Drizzle client / helpers | `lib/db/index.ts` |
| Drizzle config | `drizzle.config.ts` |
| Seed | `scripts/seed.ts` |
| Sample users seed | `scripts/seed-users.ts` |
| Auth helpers | `lib/auth.ts` |
| Auth actions | `app/actions/auth.ts` |
| Login API | `app/api/auth/login/route.ts` |
| Gold price storage/sync | `lib/gold-prices.ts`, `lib/tgju-gold-prices.ts` |
| Pricing and viewer discount resolution | `lib/pricing.ts`, `components/personal-discount-notice.tsx` |
| User levels | `lib/user-levels.ts`, `components/user-level-card.tsx` |
| Pagination | `lib/pagination.ts`, `components/pagination-controls.tsx` |
| Orders helpers / actions | `lib/orders.ts`, `app/actions/orders.ts` |
| Cart actions | `app/actions/cart.ts` |
| Admin actions | `app/actions/admin.ts` |
| Admin users UI | `app/admin/users/page.tsx`, `components/admin-users.tsx` |
| Products / search | `lib/products.ts`, `lib/product-search.ts` |
| Validation | `lib/schemas.ts` |
| Formatting / digits | `lib/format.ts`, `components/digits-input.tsx` |
| Shop copy | `lib/shop.ts` |
| Design tokens | `app/globals.css` |
| Root shell | `app/layout.tsx` |
| Admin UI | `app/admin/**`, `components/admin-*` |

---

## 16. Design / product decisions (summary)

1. **Offline checkout** — trust + phone fulfillment fits a traditional gold bazaar business; no payment provider complexity.
2. **Price = weight × gold + wage** — standard Iranian jewelry pricing; wage is per piece, not per gram.
3. **Snapshot on order** — protects both shop and customer when gold price moves.
4. **Images in Postgres** — simple deploy (no S3 required); served through `/api/images/[id]`.
5. **Cookie sessions** — no third-party auth; fits a single-shop app.
6. **Classic login POST** — better browser password-manager support than Server Actions alone.
7. **Persian-first UX** — RTL, Vazirmatn, Jalali dates, Persian digit display with English digit storage/validation.
8. **Computed membership levels** — no extra column to keep in sync; spend from settled orders drives level 1–3.
9. **Server-side pagination** — list pages use `count` + `skip`/`take` instead of loading full tables.
10. **Discount stored on the user, applied at render** — mirrors how a bazaar shop gives regulars a standing rate, and one column drives every surface. Kept off products so it never has to be re-applied per item.
11. **Discount applies to the full price, not just the wage** — simplest rule to explain to a customer. Switching to a wage-only discount is a one-line change in `computeProductPrice`.
12. **Discount snapshotted onto the order** — same reasoning as the gold-price snapshot: changing a customer’s rate must not rewrite their order history.

---

## 17. What is intentionally not built (yet)

- Online payment / gateway
- Email/SMS notifications
- Guest checkout (login required for cart/order)
- Inventory/stock quantities
- Multi-shop / multi-currency
- Soft-delete or archive for products with order history constraints beyond Restrict
- **Level benefits / privileges** — levels are visible and progress is tracked, but they do not change pricing, shipping, or access yet. Discounts exist but are granted manually per user, not automatically by level
- Coupon / promo codes, category- or product-scoped discounts, and time-limited sales (only the flat per-customer discount exists)
- Deleting customers who already have orders (blocked by design)

These are natural extension points if the product grows.

---

*Last aligned with the codebase after per-customer discounts, user levels, pagination, and admin user CRUD. Prefer the source files listed above when behavior and this document disagree.*
