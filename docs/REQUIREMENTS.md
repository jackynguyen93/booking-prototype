# Ross House Association — Business Requirements

> **Version:** 1.0 — March 2026
> **Project Start:** July 2026 | **Target Launch:** Early 2027

---

## 1. Project Setup & Architecture

- Monorepo setup with CI/CD pipeline across development, staging, and production environments
- Code standards and linting enforced across the project
- Cloud infrastructure with server provisioning, domain, DNS, CDN, SSL, and storage buckets
- Environment secrets management
- Full database design covering users, organisations, bookings, invoices, content, access codes, documents, and grants — **critical to finalise before development begins**
- Authentication and authorisation system supporting 7 user types with role-based access control; accounts are organisation-level (one account per organisation, not per individual); admin impersonation capability required
- Transactional email and SMS infrastructure with a template system
- Design system with consistent colour palette, typography, spacing, and base UI components
- Accessibility baseline: screen reader compatibility (JAWS), keyboard navigation, ARIA patterns, accessible form standards — **WCAG 2.2 Level AA from the start**

---

## 2. Public Website

### 2.1 Homepage
- Hero section with mission statement and community hub narrative
- Clear calls to action: Book a Room, Join Us, Donate
- Latest news section

### 2.2 About / Our Story
- History of the building and its heritage significance
- RHA mission and values
- Community overview

### 2.3 Community Directory
- Searchable and filterable public directory of all tenant organisations
- Each listing shows services offered, opening hours, contact details, and organisation profile
- Tenant organisations can self-update their own public profiles via the portal

### 2.4 Membership & Tenancy Information
- Benefits of membership and tenancy
- Eligibility criteria and expectations
- Pricing overview
- Steps to join
- Current office vacancies

### 2.5 Meeting Rooms — Public Pages
- Room listing overview
- Individual room pages showing photos, capacity, layout options, AV equipment, pricing, and availability preview

### 2.6 Facilities & Building
- Location and access information
- Heritage building information
- Amenities available
- Accessibility features of the physical building
- Map embed on contact and facilities pages

### 2.7 Governance
- How RHA is run
- Committee structure and member participation
- Explanation of the community-owned governance model

### 2.8 Fundraising / Support Us
- Current fundraising priorities
- Impact stories
- Donation call to action
- Partnership and donor opportunities
- Donation platform integration (platform TBC)

### 2.9 News / Blog
- Post listing and individual post pages
- Categories and tags
- Social media links

### 2.10 Contact Page
- Contact form with general enquiry routing
- Map
- Staff directory

### 2.11 Publications Hub
- Public downloads: newsletters and annual reports
- E-bulletin sign-up
- Some publications gated by user type

### 2.12 Error Pages
- Branded 404 and error pages

### 2.13 Accessibility (All Pages)
- Accessible form standards applied across all 42 pages
- JAWS screen reader compatibility throughout

---

## 3. User Portal — Shared (All Logged-In Users)

### 3.1 Login / Register / Forgot Password
- Secure login
- Organisation-based registration form
- New accounts held pending RHA approval before user can book
- Password reset flow

### 3.2 Dashboard (Home)
- Personalised landing page based on user type
- Quick links, upcoming bookings, alerts, and news

### 3.3 Organisation Profile
- Edit public directory listing
- Update private contact details and billing information
- Manage nominated representatives

### 3.4 Publications & Resources
- Access to newsletters, e-bulletins, annual reports, policies, and house rules
- Content filtered and gated based on user type

### 3.5 Notifications Centre
- In-app notifications for booking confirmations, parcel alerts, and building news

---

## 4. User Portal — Meeting Room Booking

### 4.1 Room Availability & Search
- Calendar view and availability grid
- Filters by room, date, time, and user type

### 4.2 Room Booking Flow (Casual)
- Step-by-step flow: select room → choose date/time → review → accept T&Cs → checkout/payment → confirmation
- Facility users pay via PayPal at checkout
- Members and tenants are invoiced monthly

### 4.3 AV Induction Registration
- Prompt displayed at checkout for rooms with AV equipment
- Captures induction booking request before user can use AV

### 4.4 Booking Management (User)
- View, cancel, and modify own bookings
- View access codes for each booking

### 4.5 Recurring Bookings (Admin-Managed)
- Recurring bookings (weekly, fortnightly, or monthly) can only be created by admin — not by end users
- Admin can create a full year of bookings in one action
- Invoiced monthly as a combined statement

### 4.6 Access Codes Delivery
- Daily access codes auto-generated from booking data
- Codes delivered to user by email and SMS on the day of the booking
- Requires integration with Inner Range Integrite security system

### 4.7 Phone Booth Booking
- Available to tenant organisations only
- Free of charge
- Maximum 2 hours per day
- Can only be booked up to 1 week in advance
- Bookable in 30-minute blocks

### 4.8 Car Park Booking
- Admin-managed only (2 bays available)
- Bookable in 30-minute blocks
- Price caps at 4 hours regardless of booking length
- Exception: Melbourne Winery (commercial tenant) may book via their own account

### 4.9 Booking Notifications
- Confirmation emails and SMS sent on booking
- Reminder emails and SMS sent before the booking
- All notifications include room details and access codes

---

## 5. User Portal — Tenants & Members

### 5.1 Tenancy Information & Documents
- View lease and rental details
- Upload and download signed documents

### 5.2 Invoice & Payment History
- View outstanding and past invoices
- Download invoice PDFs
- Pay invoices online

### 5.3 Photocopier & Security Codes
- View organisation-specific photocopier code
- View permanent building access codes

### 5.4 Key & Swipe Register
- Update the key register (list of authorised staff and volunteers with building access)
- Order new keys or swipes

### 5.5 Maintenance & Incident Reporting
- Submit maintenance requests and incident reports
- Track status of submitted requests

### 5.6 Community Noticeboard
- Post events, share news, offer or request office furniture
- Community feed visible to all members and tenants

### 5.7 Event RSVPs
- RSVP to RHA events including AGM, workshops, and subcommittee meetings

### 5.8 Content Submissions
- Submit articles and content for the e-bulletin, newsletter, and annual report
- Editorial queue for admin to review submissions

### 5.9 Window Display Requests
- Submit a request to book a slot in the main foyer window display

### 5.10 RHA Equipment Grant
- Available to tenant organisations only (biannual)
- Apply for the grant, track application status, and upload supporting documents

### 5.11 Governance Section
- Read meeting minutes
- View AGM documents
- View current committee members, working parties, and subcommittees

---

## 6. User Portal — Donors & Partners

### 6.1 Donor / Partner Portal
- View fundraising updates and impact reports
- Access partner resources
- Manage donations and payment plans

### 6.2 Donation Management
- View and update recurring donations
- Download receipts
- Update billing information

---

## 7. Admin Panel

### 7.1 Admin Dashboard
- Overview statistics: bookings, revenue, active members/tenants, outstanding invoices, and enquiries

### 7.2 User & Organisation Management
- Create, edit, and approve user accounts
- Assign roles and manage organisation details
- Impersonate users for support purposes

### 7.3 Booking Management
- View, edit, and cancel all bookings
- Create recurring bookings on behalf of users
- Manage car park and phone booth bookings

### 7.4 Meeting Room Product Management
- Update room details, photos, and capacities
- Set pricing per user type and adjust availability rules

### 7.5 Invoicing & Finance
- Trigger end-of-month Xero sync
- View full invoice history
- Enter manual charges
- Manage refunds
- Xero API integration: combined monthly statement per organisation

### 7.6 Membership & Tenancy Admin
- Review and approve membership and tenancy applications
- Upload signed lease documents
- Manage renewals and track enquiries and waitlists
- **Note:** Renewal feature requires careful attention

### 7.7 Key & Access Code Management
- View and edit key registers
- Manage permanent access codes
- Oversee daily code generation
- Inner Range Integrite integration

### 7.8 Maintenance Request Queue
- View, prioritise, and update the status of maintenance and incident reports

### 7.9 Communications & Email Campaigns
- Compose and send segmented email campaigns to replace Campaign Monitor
- Manage subscriber lists
- Option to use a third-party tool (e.g. Mailchimp) if more practical

### 7.10 Publications Management
- Upload and manage newsletters, annual reports, and e-bulletins
- Set access permissions by user type

### 7.11 Grant Application Management
- Review RHA Equipment Grant applications
- Approve or reject applications
- Communicate outcomes to applicants
- Managed as a post type in the CMS

### 7.12 Donor & Partner CRM
- Track contacts, contributions, and engagement history
- Manage the fundraising pipeline

### 7.13 Contractor Sign-In
- Digital sign-in system for contractors visiting the building
- Replaces the current paper folder
- Managed as a post type in the CMS

### 7.14 Parcel Alert System
- Alert the relevant tenant organisation when a parcel arrives at the front desk

### 7.15 Analytics & Reporting
- Website usage reports
- Booking analytics and revenue trends
- TagVenue source tracking
- Publication download statistics
- Google Analytics or equivalent integration

### 7.16 Foyer Digital Screen Management
- Remotely update the foyer TV to show the daily booking schedule per room
- Screen must support a web-based display format

---

## 8. Integrations

### 8.1 Xero
- Sync monthly charges to Xero
- Create combined invoices (one statement per organisation per month)
- Mark payments as received
- Manage Xero contacts per organisation

### 8.2 PayPal
- Payment gateway for casual bookings by facility users
- Automatic refunds in line with the cancellation policy
- Non-refundable 2% booking fee applied to all PayPal payments; refunds calculated after deducting this fee

### 8.3 Inner Range Integrite (Security System)
- Generate daily and permanent access codes from booking data
- Deliver codes to users via email and SMS
- Vendor API availability to be confirmed

### 8.4 TagVenue
- Track which users and bookings originated from TagVenue
- Record revenue and enquiry data for reporting
- API or webhook availability to be confirmed

### 8.5 Donation Platform
- Online donations integration (GiveNow, Stripe, or PayPal Donations — platform to be confirmed)

### 8.6 Google Maps
- Location map embedded on contact and facilities pages

---

## 9. Testing & Launch

| Task | Notes |
|------|-------|
| Accessibility audit & remediation | WCAG 2.2 AA across all 42 pages and user flows |
| Cross-browser & device testing | Desktop and mobile (iOS/Android); Chrome, Firefox, Safari, Edge |
| Performance optimisation | Page speed, image optimisation, lazy loading, caching |
| Security review | Authentication hardening, input validation, CSRF/XSS protection, rate limiting |
| User acceptance testing (UAT) | Two rounds with the client |
| Content upload & migration | Client provides written content; migrated from SharePoint and Excel |
| Staff training & documentation | CMS training sessions, admin user guide, video walkthroughs |
| Go-live & deployment | Production deployment, smoke testing, DNS cutover, monitoring setup |
| Post-launch support | Four weeks of bug fixes and minor adjustments post go-live |

---

## 10. Business Rules Summary

### Booking Rules
- All rooms bookable in **30-minute blocks**
- Bookings for the following year open to the public on **1 December** each year
- **Recurring bookings** must be created by admin — users cannot self-book recurring slots
- New users must be **approved by RHA** before they can make any booking
- Users must **accept Terms & Conditions** before completing a booking
- Users must complete an **AV induction** before first use of any AV-equipped room

### Access Hours
| User Type | Booking Window |
|-----------|---------------|
| Members & Tenants | 7:00am – 11:00pm, Monday – Sunday |
| External Facility Users | 8:00am – 8:00pm, Monday – Sunday (later bookings by arrangement) |

### Cancellation Policy
| Notice Given | Outcome |
|-------------|---------|
| 2+ business days before booking | Full refund (minus non-refundable 2% PayPal fee where applicable) |
| Less than 2 business days | 50% of hire price charged; user must contact RHA directly to cancel |
| No notice / day of booking | Full price charged regardless of whether the room was used |

### Rent Scale (Per m² Per Year, Plus GST)
| Category | Rate |
|----------|------|
| Incubator | Negotiated rate |
| Small | $360 |
| Medium | $395 |
| Large | $420 |
| Associate | $530 |

### User Types
| Type | Description |
|------|-------------|
| Member (Non-Tenant) | Member organisation without office space |
| Member (Tenant) | Member organisation with office space in the building |
| Commercial Tenant | Commercial organisation renting space |
| Facility User | External user booking meeting rooms only |
| Donor / Partner | Funding or partnership relationship with RHA |
| Admin | RHA staff |
| Trades | Contractors and tradespeople |

### Pricing Categories
| Category | Description |
|----------|-------------|
| Tenant | Members with office space |
| Member | Non-tenant members |
| Associate Member | Associate member tier |
| Facility User — Non-Profit Small | |
| Facility User — Non-Profit Large | |
| Facility User — For-Profit Small or Individual | |
| Facility User — For-Profit Large, Government, or Education | |
| Admin / Trades | Internal use |

---

## 11. Decisions Outstanding

- Cloud hosting provider (AWS, GCP, or Azure)
- SMS gateway provider
- Donation platform (GiveNow, Stripe, or PayPal Donations)
- Inner Range Integrite API availability and documentation
- TagVenue API / webhook availability
- Updated branding: logo, colour palette, and fonts (in progress by client)
- Written content and images (to be provided by client)
- Ongoing support retainer arrangement post-launch
