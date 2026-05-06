# Demo video script

A 2 to 5 minute screen recording. The brief asks for a live, fully-functional
app and a short demo, so the script below maps cleanly to the rubric:
authentication, projects, members and roles, tasks and the board, and the
dashboard.

Record at 1280×800 if possible. Use the seeded demo account on the live URL
so the data is real, not staged.

## Cold open (0:00 – 0:15)

> "Hi, I'm Chaitanya. This is Stride, a small team task manager I built for
> the Ethara AI Round 1 brief. It runs on Railway, the live URL is in the
> README. I'll do the whole thing on a fresh account, then sign in as the
> seeded admin to show roles."

## 1. Sign up flow (0:15 – 0:50)

- Open `<live-url>/`. The landing page sets the tone.
- Click **Get started**, fill name / email / password (8+ chars).
- Land on `/projects`, empty state.
- Mention quietly: passwords are hashed with Argon2id; the JWT is delivered
  as an httpOnly cookie and a Bearer header for API clients.

## 2. Create a project + invite a teammate (0:50 – 1:30)

- Click **New project** → enter "Q3 launch" + a short description.
- Open the project, switch to the **Members** tab.
- Note that the creator is `ADMIN`.
- Open another tab in incognito, sign up as a second user, e.g.
  `rohan@example.com` with the same password.
- Back in the original tab, invite `rohan@example.com` as a `Member`.
- Show the role chip changing if you flip the role to `ADMIN` and back.

## 3. Tasks and the board (1:30 – 3:00)

- Switch to the **Board** tab. Three columns: **To do**, **In progress**,
  **Done**.
- Click **New task**, create:
  - "Wire auth API to the SPA" — Status `In progress`, Priority `High`,
    Assignee Rohan, Due tomorrow.
  - "Kanban drag-and-drop" — `To do`, `High`, unassigned, no due date.
  - "Audit log for admin actions" — `To do`, `Low`, due yesterday (so you
    can show the overdue chip).
- Drag the second task from `To do` to `In progress`. Note that the move is
  optimistic (instant) and persists on refresh.
- Apply the **Priority: High** filter — two tasks remain.
- Toggle **Overdue only** — the overdue task surfaces.

## 4. Task detail and comments (3:00 – 3:45)

- Click into a task. The right rail has the editable status, priority,
  assignee, and due date.
- Edit the title in place — show that it saves on blur.
- Add a comment: "Pairing with Rohan after lunch."
- Mention quickly: a regular member who is neither creator nor assignee
  cannot edit; admins can. The check happens server-side.
- Switch to the second account, open the same task, show the same fields.

## 5. Dashboard (3:45 – 4:20)

- Back on the project, click **Overview**.
- Walk through the cards: total, in progress, overdue, due this week.
- The completion bar; the overdue list; recently updated tasks; workload
  by assignee.
- "All of this is computed in a single backend call. No pre-aggregation, no
  caching tricks — just one Prisma query per panel, batched in parallel."

## 6. Settings + delete (4:20 – 4:40)

- Switch to **Settings** (admin only).
- Rename the project, save, see it update everywhere.
- Mention the danger zone briefly without deleting.

## Close (4:40 – 5:00)

> "Code, docs, and the deploy guide are in the README. Tests cover Argon2,
> JWT, the env loader, every Zod schema, the error handler shape, the auth
> service, the project service (including owner-protection), and the task
> service's RBAC matrix. Thanks for watching."

## Recording notes

- Hide bookmarks, browser extensions, and the dock for a clean frame.
- Have both accounts pre-signed-up and tabs ready before you start; the
  signup flow is for the camera, not for the timer.
- If the recorder picks up audio, do a single take. Editing for a 5-minute
  clip is harder than re-recording.
