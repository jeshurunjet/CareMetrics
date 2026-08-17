# CAREMetrics — UI Completion and Revision Instructions

The existing CAREMetrics UI is a good visual foundation. **Do not redesign the application from scratch.** Preserve the existing visual language, layout patterns, typography, navigation style, cards, tables, spacing, and overall look and feel.

The purpose of this revision is to complete missing screens and workflows so the Figma design can be used as the visual specification for full-stack implementation.

## 1. Important Design Constraint

Do not change the scope of CAREMetrics based only on the pages that currently exist.

The existing UI is incomplete. Continue using the established CAREMetrics page map and requirements as the source of truth.

Where new screens are required:

* Reuse existing CAREMetrics components and design patterns.
* Maintain visual consistency with the current dashboard.
* Do not introduce a completely new design system.
* Avoid unnecessary animations or decorative features.
* Prioritise accessibility, readability, and efficient workplace use.
* Design for desktop first while ensuring layouts can adapt to tablets and mobile devices.
* Do not implement backend functionality or invent technical architecture. These designs will later be implemented separately.

---

# 2. Authentication

Add the missing authentication experience.

Design:

* Login
* Forgot password
* Reset password
* Initial account/password setup where required
* Invalid/expired reset link state
* Basic authentication error states

The login experience should be simple and professional.

CAREMetrics will have different user permissions, so users should see the appropriate interface after authentication rather than selecting their own role during login.

---

# 3. Role-Based Interfaces

The application needs to clearly support at least two major perspectives:

### Management / Company

Management users require access to:

* Dashboard
* Employees
* Rostering
* Attendance/timesheets
* Leave
* Houses/services
* Clients
* Care management
* Care records
* Reports
* Notifications
* Administration

### Employee / Support Worker

Employees should have a simpler interface focused on their own work:

* Personal dashboard
* My roster
* Clock in/out
* My attendance/timesheets
* My leave
* Assigned house/service information
* Assigned clients
* Care recording
* Relevant alerts/notifications
* My profile

Do not expose management functionality to ordinary employees.

---

# 4. Employee Management

The existing staff area needs deeper employee-management screens.

Add:

### Employee List

Preserve the existing staff list where possible.

Provide:

* Search
* Filters
* Employment status
* Role
* House/service assignment
* Clear access to employee details

### Employee Profile

Create a complete employee details screen containing logical sections or tabs for:

* Basic details
* Contact information
* Employment information
* Role
* Assigned house/service
* Availability
* Roster
* Attendance/timesheets
* Leave
* Relevant documents/records
* Account status

Provide appropriate Edit actions without making the page visually cluttered.

### Add/Edit Employee

Create forms for adding and editing employees.

Use clear grouping rather than placing every field into one long form.

---

# 5. Houses / Services

This is an important missing area.

CAREMetrics needs to represent the houses or services where support is provided.

Create:

### Houses / Services List

Display:

* House/service name
* Location
* Status
* Assigned employees
* Assigned clients

Allow users to open a house/service.

### House / Service Details

Include:

* Basic information
* Address/location
* Assigned employees
* Assigned clients
* Current/upcoming roster
* Relevant alerts
* Recent activity

Where appropriate, reuse the location/map design already present in CAREMetrics.

### Add/Edit House

Provide a clear management form.

---

# 6. Rostering

Keep the existing rostering design but ensure the complete workflow is represented.

Management should be able to:

* View roster by week
* Filter by employee
* Filter by house/service
* Create a shift
* Edit a shift
* Reassign a shift
* Remove/cancel a shift
* Identify scheduling conflicts
* View unassigned shifts where applicable

A shift should clearly communicate:

* Employee
* House/service
* Date
* Start time
* End time
* Shift status

Employee users should have a simplified **My Roster** view showing only their relevant shifts.

---

# 7. Attendance and Timesheets

Create the missing attendance workflow.

### Employee Clock In / Clock Out

Design an employee-facing screen or dashboard component showing:

* Current shift
* Scheduled start/end
* Clock-in button
* Clock-out button
* Current attendance status
* Confirmation after clocking in/out

Where location validation is used, clearly display location status without making the interface intrusive.

### Management Attendance

Create a management screen containing:

* Employee
* Scheduled shift
* Actual clock-in
* Actual clock-out
* Total worked time
* Attendance status
* Exceptions such as late arrival or missing clock-out

Provide filters for date, employee, and house/service.

### Timesheet Detail

Provide a detailed view where an authorised manager can inspect attendance records and resolve exceptions.

Do not make ordinary employees able to alter approved attendance records without an appropriate request/review process.

---

# 8. Leave Management

Preserve the existing leave design but complete the workflow.

Employees should be able to:

* View leave balances where applicable
* View previous requests
* Submit a leave request
* Select leave type
* Select dates
* Provide notes/reason
* See pending, approved, or declined status

Managers should be able to:

* View pending requests
* Open request details
* Approve
* Decline
* Review potential roster impact

Use clear status indicators.

---

# 9. Client Management

The existing Clients area needs detailed client screens.

### Client List

Maintain the existing visual style and support:

* Search
* Status filtering
* House/service filtering
* Access to client profiles

### Client Profile

Create a structured client profile.

The profile should provide access to relevant areas such as:

* Basic client information
* House/service
* Important support information
* Emergency/contact information where applicable
* Care sections
* Recent care records
* Relevant alerts
* Activity/history

Avoid presenting sensitive information unnecessarily on summary screens.

---

# 10. Care Management

This is one of the most important parts of CAREMetrics and requires significantly more design than the current Care Records screen.

The system should support **configurable care sections/templates** rather than assuming every client uses one fixed care form.

### Care Templates

Create a management screen listing available care templates/sections.

Examples could include:

* Personal care
* Medication-related observations
* Behaviour observations
* Meals/nutrition
* Fluid intake
* Sleep
* Activities
* Health observations
* Bowel movements
* Other organisation-defined care sections

These are examples only. Do not hard-code CAREMetrics around these categories because authorised users should be able to configure care sections.

### Care Template Builder

Create a UI that allows an authorised manager to define a care section.

The builder should support fields such as:

* Text
* Long text
* Number
* Date
* Time
* Yes/No
* Single choice
* Multiple choice
* Dropdown
* Rating/scale where appropriate

Allow the manager to:

* Add fields
* Give fields labels
* Mark fields required/optional
* Reorder fields
* Remove fields
* Preview the resulting form
* Save the template

Keep this interface understandable for a non-technical manager.

Do not expose database terminology or JSON configuration to the user.

### Template Assignment

Design how a care template can be assigned to:

* A client
* Appropriate groups/services where supported by the project requirements

### Template Editing and Version Awareness

Existing historical care records must remain understandable if a template changes later.

The UI should therefore distinguish between editing the current template and historical records created using previous configurations.

Do not design an interface that suggests editing a template will rewrite historical care records.

---

# 11. Recording Care

Create the employee workflow for entering a care record.

The employee should:

1. Open an assigned client.
2. Select the relevant care section.
3. Complete the configured fields.
4. Add relevant notes where required.
5. Review the entry.
6. Submit the care record.
7. Receive clear confirmation.

The form displayed to the employee should be generated conceptually from the care template designed by management.

The UI should make required fields obvious without becoming visually overwhelming.

---

# 12. Care Record History

Expand the existing Care Records functionality.

Managers should be able to:

* View records across clients
* Filter by client
* Filter by employee
* Filter by care section
* Filter by house/service
* Filter by date/date range
* Open an individual record

Client profiles should also provide a chronological view of relevant care records.

An individual care record should clearly show:

* Client
* Care section
* Date/time
* Recorded by
* Recorded values
* Notes
* Relevant status or alert information

Historical records should prioritise traceability.

---

# 13. Alerts

Design a consistent alert system.

Examples may include:

* Attendance exceptions
* Missing care information
* Care observations requiring attention
* Roster issues
* Other configured operational alerts

Create:

* Notification/alert centre
* Unread/read state
* Severity or priority where appropriate
* Link from an alert to the relevant client, employee, shift, or record

Avoid excessive use of warning colours. Alerts should communicate urgency clearly without making the entire interface appear critical.

---

# 14. Reports

Preserve the existing Reports area but ensure reports can represent meaningful CAREMetrics information.

Possible report categories include:

* Attendance
* Rostering
* Leave
* Care records
* Client-related trends
* Operational summaries

Provide:

* Date range
* Relevant filters
* Summary metrics
* Tables
* Charts only where they improve interpretation
* Export action where appropriate

Do not create charts purely for decoration.

---

# 15. Administration

Add an Administration area for authorised users.

Design sections for:

### Roles and Permissions

Allow authorised management users to understand:

* Available roles
* What each role can access
* Which users have a role

The interface should communicate permissions clearly without exposing implementation-level permission code.

### Organisation Settings

Provide a logical location for organisation-level configuration required by CAREMetrics.

### Care Configuration

Provide access to care templates and related configuration.

---

# 16. User Profile

Create a profile/account area.

Employees should be able to view relevant personal information and account settings.

Where editing is permitted, distinguish between:

* Information the employee can change themselves
* Employment information controlled by management

---

# 17. Empty, Loading and Error States

The current design should be extended beyond ideal populated screens.

For important pages, include reusable designs for:

* No records yet
* No search results
* Loading
* Failed operation
* Validation errors
* Successful save
* Permission denied
* Deleted/archived/inactive records where applicable

Do not create a separate elaborate page for every state. Establish reusable patterns that can be applied consistently.

---

# 18. Confirmation Dialogues

Create consistent confirmation patterns for significant actions, including:

* Deleting or archiving records
* Cancelling shifts
* Declining leave
* Deactivating an employee
* Other actions that could have significant consequences

Avoid confirmation dialogues for ordinary low-risk actions.

---

# 19. Navigation Review

After adding the missing screens, review the sidebar/navigation.

Ensure the management navigation logically groups:

* Dashboard
* Workforce
* Rostering
* Attendance
* Leave
* Houses/Services
* Clients
* Care
* Reports
* Notifications
* Administration

The employee interface should contain substantially fewer options.

Avoid an excessively long navigation menu. Use logical grouping or expandable sections where necessary.

---

# 20. Preserve Existing Good UI

Do not unnecessarily replace the current CAREMetrics visual design.

The current interface should remain the foundation.

Specifically preserve and reuse:

* Dashboard visual language
* Cards
* Tables
* Typography
* Navigation patterns
* Form styling
* Spacing
* Existing roster design
* Existing leave design
* Existing client design
* Existing report design
* Existing location/map components where appropriate

Improve inconsistencies rather than redesigning successful screens.

---

# 21. Prototype Important User Journeys

Connect the Figma prototype so the major workflows can be demonstrated.

### Employee Journey

Login
→ Dashboard
→ View today's shift
→ Clock in
→ View assigned house/service
→ Open assigned client
→ Select care section
→ Enter care record
→ Submit record
→ Clock out

Also support:

Dashboard
→ My Roster

Dashboard
→ My Leave
→ Request Leave

Dashboard
→ My Profile

### Manager Journey

Login
→ Management Dashboard
→ Employees
→ Employee Profile

Dashboard
→ Rostering
→ Create/Edit Shift

Dashboard
→ Attendance
→ Review Attendance Exception

Dashboard
→ Houses/Services
→ House Details
→ Assigned Employees/Clients

Dashboard
→ Clients
→ Client Profile
→ Care History

Dashboard
→ Care Management
→ Care Templates
→ Template Builder
→ Assign Template

Dashboard
→ Leave
→ Review Request
→ Approve/Decline

Dashboard
→ Reports

Dashboard
→ Administration

---

# 22. Do Not Implement the Final Technical Architecture

This Figma project is primarily the UI/UX specification.

Do not restructure the project around Figma's current React/Vite implementation or make architectural decisions for the production application.

The intended implementation will be handled separately and is expected to use:

* TypeScript
* Next.js
* PostgreSQL
* Prisma ORM
* Git/GitHub
* Appropriate hosted deployment

The implementation agent will use the completed Figma design as a visual and interaction reference.

Focus this revision on completing and refining the **UI, UX, screen states, navigation, and user journeys**.

---

# Final Objective

The completed Figma prototype should provide enough visual and interaction detail that another developer can understand:

1. What a support worker sees and does.
2. What a manager sees and does.
3. How employees, houses/services, clients, shifts, and care records relate.
4. How attendance and leave workflows operate.
5. How managers configure care templates.
6. How employees use those templates to record client care.
7. How stakeholder-relevant information can be reviewed and reported.
8. How the major workflows behave from beginning to end.

Do not add unrelated features simply to make the application appear larger. Complete the workflows required by CAREMetrics while maintaining the existing visual quality and consistency.
