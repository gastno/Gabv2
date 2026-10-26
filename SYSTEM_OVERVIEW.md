# Gabv2: What the System Can Do

This guide explains the current Gabv2 booking system for studio administrators and staff. It also gives staff a short, accurate way to describe the customer booking experience.

Gabv2 brings the Gabbablu beauty studio and Amor Tattoo together in one system. What each person can see depends on their role, the brands they can access, and which account and email services are configured for the website.

## Who uses the system

| Role | Main purpose |
| --- | --- |
| Administrator | Maintain studio information, services, staff access, and portfolios; review appointment records. |
| Staff member | Review assigned appointment information, manage appointment records, and maintain their available hours. |
| Customer | Browse a studio, find a service and available time, and make a booking. Customers with a working account can also review appointments and notification settings. |

Staff use the staff sign-in page to reach their workspace. Administrators use the same staff sign-in and are directed to the admin workspace according to their role. Customers browse the public site and can choose to sign in, create an account, or continue a booking as a guest.

## The administrator workspace

The admin workspace has separate areas for the calendar, brands, portfolio, staff accounts, categories, services, staff-service assignments, and the appointment ledger. The brands and records available to an administrator depend on their assigned access.

### Studio information and imagery

- **Brands:** Review and update brand names, locations, and descriptions.
- **Studio portfolio:** Choose a brand, update its logo and cover image, add or remove portfolio images, arrange their display order, and select a gallery layout. Supported layouts include grid, masonry, mosaic, featured-image, and carousel.
- Image uploads in the portfolio accept JPEG, PNG, or WebP files up to 5 MB each.

### Staff and service setup

- **Staff accounts:** Create and update staff accounts, profile information, credentials, avatars, and brand access.
- **Categories:** Create and maintain the service categories shown on studio pages.
- **Service catalog:** Create and maintain services, including their category, descriptions, duration, price, sale price, active status, and image.
- **Staff services:** Assign staff members to the services they provide. These assignments determine which specialists can appear for a service on the customer site.

Keep the customer-facing catalog accurate: customers use its descriptions, duration, price, sale price, and assigned specialists when choosing a booking.

### Appointments

- **Global Calendar:** Browse appointment, available-hour, and unavailable-time blocks by month. Filter the view by brand and staff member, then open a block to see its details. The calendar is for reviewing schedules; staff manage their own working hours in the staff workspace.
- **Appointments Ledger:** Review completed, cancelled, and no-show appointments. Filter by brand and sort the historical records by the displayed columns, such as customer, staff member, appointment date, payment status, fee status, and appointment status.

The ledger is a historical record, not a payment processor or a way to collect money from customers.

## The staff workspace

The staff workspace is called **My Schedule** and has month, day, and availability views. Dates and times are shown in Iceland time.

### Review the schedule

- Move between months or days to see appointments and availability.
- Select an appointment to review its booking information and, when provided, customer reference images.
- Depending on the appointment and the staff member's permissions, update its status, record payment or fee status, or cancel it with an optional reason.
- Appointment details contain customer information. Open them only when needed to handle the booking.

Payment and fee status are records for staff to maintain. The system does not automatically charge a customer's card or collect a cancellation fee.

### Maintain availability

- Add, edit, or remove working-hour intervals for a specific date.
- Add an unavailable period across one or more dates, optionally with a reason, and remove an existing unavailable period.
- The customer booking calendar uses the selected specialist's schedule and available appointment slots to show bookable dates and times.

Working hours entered here apply to their selected date; they are not a recurring weekly schedule.

## The customer experience

The home page directs customers to the Gabbablu or Amor Tattoo studio page. Customers can browse each studio's services, team, portfolio, location, and about information. The website provides English and Icelandic interface text.

### Booking a service

The booking flow is:

1. Choose a service from the studio's catalog.
2. Choose a specialist who is assigned to that service.
3. Choose an available date and time from the displayed options.
4. At the account step, choose the sign-in option or continue as a guest.
5. Complete the booking details and confirm the booking.

Guest bookings require the requested customer details and acceptance of the privacy and cancellation/no-show policy. The form also allows optional health, allergy, or safety information and up to five reference images. Each image must be JPEG, PNG, or WebP and no larger than 5 MB.

The booking form displays the service, duration, price, specialist, date, and time before submission. A successful booking is confirmed in the booking flow. If the booking cannot be submitted, the customer should follow the error shown and contact the studio if they need assistance.

### Customer accounts

When customer sign-in is configured, customers can sign in or create an account. The account area can show upcoming and previous appointments associated with that customer account, including appointment status and price. It also provides an email-notification preference and notification history.

Customer account availability depends on the website's sign-in configuration. If sign-in is not configured, the page displays a notice; customers can still use the guest booking option.

### Notifications

Customers can enable or disable appointment emails in their account. The system supports emails for appointment status changes and reminders before an upcoming appointment. Email delivery also requires the studio's email provider to be configured; customers should not be promised that an email will arrive. Customers can review notification history in the account when signed in.

## Important boundaries and limitations

- **Customer self-cancellation:** The customer account currently displays appointment history and notification settings, but does not provide a cancellation control. Customers who need to change or cancel a booking should contact the studio. Staff can update or cancel appointments from their workspace.
- **Sign-in during booking:** Choosing the sign-in link returns the customer to the studio page. The selected service and time may not be retained, so the customer may need to reopen the service and select a specialist and time again.
- **Payments and fees:** There is no automatic card charge or online fee collection. Staff record payment and fee status; any applicable cancellation or no-show fee is handled manually by the studio.
- **Account and email setup:** Customer account sign-in and email delivery depend on deployment configuration. If a feature reports that it is unavailable, staff should not promise it until the studio confirms it is configured.
- **Booking availability:** Customers can select only the dates and times presented as available for the selected service and specialist. Staff should keep date-specific working hours and unavailable periods up to date.
- **Privacy information:** Booking asks for personal information, including a Kennitala, and offers an optional health/safety field. The website's privacy policy is marked provisional and identifies details the business still needs to confirm. Refer customer privacy questions to the studio's approved policy and contact rather than making assurances about retention or legal requirements.
- **Cancellation/no-show terms:** The customer-facing booking text says that a cancellation made less than 48 hours before an appointment or a missed appointment may result in a 5,000 ISK fee, handled manually by the studio; staff may waive it. Explain the displayed policy and refer case-specific questions to the studio.

## A short explanation staff can share with customers

> You can choose Gabbablu or Amor Tattoo, browse the services and team, and select a specialist, date, and available time. You can continue as a guest or use the customer sign-in option. The booking form asks for your contact details and the required policy consents, and it lets you add optional safety information or reference images. If you need to change or cancel a booking, please contact the studio. Email updates are available when your account preference is enabled and the studio's email service is configured.
