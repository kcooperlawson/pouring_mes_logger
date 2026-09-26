# Formlabs MES — Changelog

What I added and what I fixed, newest first. One entry per day, whatever that day's real work actually was — a day with several small releases is one entry now, everything from it folded in under the one number, in the order it happened.

Anything before August 31 is written up from the short notes I made at the time. Some days had two or three releases in them.

---

## 3.30 — Saturday, September 26, 2026
**The guided tour, properly: it now walks through every screen instead of a handful, for operators, packers and managers alike.**

Installs over 3.29 or anything older.

### Why it only showed a few steps

A brand-new operator's first sign-in has the startup checklist in front of everything, and the tour auto-launches right then. Every step about Pouring, Downtime, Audit and Summary was pointing at a tab that didn't exist yet, so the tour quietly skipped them all - they saw about five steps and none of the screens they'd actually use. The tour can now show what's behind the checklist while it runs. Its dark overlay covers the whole screen the entire time, so nothing back there can be tapped or logged; it's only being shown, and the checklist is exactly where it was the moment the tour ends.

### What it covers now

- **Operators (32 steps, in chapters):** who you are and the written guide; the startup checklist card by card (pump, photo, final check, and the "someone already did it" override); every part of the Pouring tab - the shift ring, "Same as last hour", station and material, the lot check, the count, More details, Submit and Undo; Downtime including the timer; the three photo checks and "I'm ending my shift here"; your Summary; Account & Preferences (opened so you can see what's inside); what happens when the Wi-Fi drops; and the shift recap on sign-out.
- **Packers:** the same, with the Packing tab's cards in place of Pouring.
- **Managers (27 steps):** the sidebar; the Cockpit's daily rounds, today's numbers (and that any number opens the logs behind it), and each group of pages; then Live SCADA piece by piece (filters, headline, pouring numbers, shift trajectory, leaderboard, the log), Live Reactors, the Analytics Hub, IT Admin, the Operator Form, TV mode and the handbook. Each chapter opens the page it's about, so what's being described is what's on screen. Pages an account can't see are left out.
- A step whose screen part isn't showing yet - the lot check card only appears once a pump and resin are picked - is still explained, as a card in the middle of the screen, instead of being dropped.

### The tour itself works better

- **It scrolls to what it's pointing at.** Before, a step about something further down the page spotlighted a spot off the bottom of the screen. The spotlight also follows the page if you scroll.
- **Back works.** Going back past a step that had been skipped used to bounce straight forward again. Every step also puts its own screen back, so Back into the middle of an earlier section lands on the right tab.
- **No more dark pauses.** A step that doesn't apply used to leave a blank dark screen for two and a half seconds before moving on; two in a row looked like it had frozen. It now moves on in well under a second unless the page is still loading.
- Chapter names ("Logging an hour", "Live SCADA") and a progress bar on each card, arrow keys and Enter to move through it, and the card no longer lands on top of what it's describing.

## 3.29 — Friday, September 25, 2026
**A redesign day for the screens operators actually use: the startup checklist, a tab bar on phones, a calmer Pouring tab, a Summary that's worth opening, the last manager pages brought in line - and then animations you can actually notice, with a setting to turn them down.**

Same rule as the last redesign: nothing here adds or removes a step. Every field, check and button is still there and still does what it did. Installs over 3.28 or anything older.

### Operators

- **The startup checklist is step cards now.** Before, it was a big red "terminal locked" block that looked like an error. Now it opens with "N quick steps before you start" and uses the same numbered cards as Pouring: your pump, the start-of-shift photo, then the final check with a "Start my shift" button. The photo is a big tap target instead of a small file button. The "someone already did this pump's checklist today" override is still there, folded away at the bottom where it can't be tapped by accident.
- **A tab bar at the bottom on phones.** Pouring, Downtime, Audit and Summary sit where your thumb already is, with icons and the Audit badge. Desktops and tablets keep the tabs across the top. Toasts moved up so they don't land on the tab bar, and the tour knows how to find a tab in either place.
- **Pouring is calmer.** The count is one big "Good units filled" box with −10 and +10 buttons either side. Scrap, check weight and notes are folded into "More details", which tells you what's in there ("no scrap · not weighed") without opening it, and opens by itself whenever any of them has something in it. Nothing was removed; it's just not all shouting at once.
- **Found and fixed while doing it: the Submit bar was never actually sticky.** The page's outer box was set to hide overflow, and that quietly turns off `position: sticky` for everything inside it, so the Submit button just sat at the bottom of the form. It stays in view now, right above the tab bar on a phone.
- **Summary is a dashboard now.** It loads straight away instead of behind a "View My Shift Summary" button: today's units in big numbers, yield, scrap and your best hour as tiles, then an hour-by-hour chart with the best hour lit up, and splits by resin and by container. Career badges are still there, folded at the bottom.
- **Account & Preferences got a tidy-up.** Icon tabs (Account, Look, Feedback, What's new), a proper close button, and the tour button is a card you can't miss. Same settings as before.

### Managers

- **Scrap & Yield, Batch History, Cleanliness & Photo Audits and Checklist & Audit Status** now open with the same icon header as the Cockpit (one shared `PageHeader` component, so they can't drift apart again) and plainer titles, and sit in the same centred width as the rest.
- **IT Admin's Database, Plant configuration and Crash reports tabs** lost the emoji in their headings and use the theme's colours instead of hard-coded ones. Backup status uses coloured dots, and the warnings use proper icons.

### Animations you can actually notice

Most of the movement that was already in the app was so quick and small that nobody saw it. On a loud floor people glance at the screen rather than read it, so this pass is mostly about feedback - making it obvious that something happened - and nothing ever waits on an animation.

- **A step finishing** pops its number into a tick that draws itself on, and the card rings green once. Only when it actually changes, never for a card that was already done when you opened the page.
- **A pour landing:** the "Logged" banner drops in with a big tick, on top of the confetti and the number flying to the ring that were already there.
- **Tapping Submit before it's ready** used to do nothing at all. It still won't submit, but now the button shakes and the line saying what's missing flashes red, right under your thumb.
- **Starting your shift:** a padlock springs open in the middle of the screen ("You're all set"), a short burst of confetti, and the tabs rise into place behind it.
- **Tabs slide in from the side you moved towards**, and the highlight under the phone tab bar glides across instead of jumping.
- **"More details" and the other folds open smoothly** instead of snapping, and the −10/+10 buttons give the count a little bump so a tap is seen to land.
- **Something waiting on you** - an outstanding photo check - keeps a slow pulse on the Audit badge and the banner until it's done. The banner slides in the moment a check becomes owed.
- **Toasts** spring up with a coloured edge (green saved, red problem), a proper icon, and a thin bar that runs down for as long as they'll stay.
- **Summary** counts up to your numbers when you open it, the tiles arrive one after another, and your best hour catches the light now and then.
- **Managers:** the Cockpit's today figures count up as it opens and flash when the minute refresh changes one, and the Historical and Analytics line charts draw themselves left to right.

**A new setting for all of it: Account & Preferences → Look → Animations: Full, Subtle or Off.** Full is everything. Subtle keeps the useful movement (ticks, slides, shakes) and drops the confetti and anything that keeps pulsing. Off is no movement at all; everything still works the same, it just changes in place. It's saved to the device, not the account, same as sound - a shared terminal's setting isn't necessarily whoever's signed in. A device set to reduce motion always gets Off. The "Background animation" switch next to it now only does what it says: the moving theme backdrop. If you'd turned that off before, this device starts on Subtle.

## 3.28 — Wednesday, September 23, 2026
**Getting ready for second shift: clearer photo checks, a redesign of every screen that still looked old, a guided tour for anyone new, a recap at the end of each shift, QC in the exports, and a packing lot bug fixed.**

One day's work, one update. It installs over 3.27 or anything older.

### The three photo checks stopped feeling random

Raised directly: there's no clear indication of what needs doing, and Start/Transfer/End photos are confusing. They're not confusing because of what they're called any more (that got fixed in 3.26) - they're confusing because every one of them only shows up after the fact. The app can't tell you a transfer photo is owed until you've already poured at a second pump, and it can't tell you which pump is your "last" one until you've simply stopped working there. Nothing ever announced any of this in the moment; it just appeared later on the Audit tab.

Three changes, none of them touching when a photo actually becomes required - 3.27's quick-job rule is exactly as it was:

- **Picking a different pump on the Pouring tab now says the rule right there**, before you've poured anything: a quick job under 100 units on this pump needs no photo, going past that will ask for a transfer photo once you submit, and going back to your starting pump afterward never asks again. Said once, at the moment it's relevant, instead of a photo request turning up later with no warning.
- **A plain-language line on the Audit tab** explains what the three checks actually are: Start is your first pump each shift, Transfer is any later pump you stay at past a quick job, End is whichever pump turns out to be your last.
- **"I'm ending my shift here."** The app can never know your last pump in advance - it can only guess once you've stopped. Rather than wait on that guess, there's now a button that logs the end-of-shift photo for wherever you're standing, the moment you're actually done, without needing the app to have figured it out first.
- The outstanding-checks banner also updates the instant a pour lands now, rather than up to a minute later on its own poll - a transfer photo that just became owed shows up right away instead of on the next refresh.

### The rest of the app looks like the same app

Nothing in this section changes what any screen does, only how it looks. Pouring got a numbered-card layout back in 3.24 - a step ticks green when it's satisfied - and Downtime and Packing never did, so switching to either felt like landing on an older screen mid-shift. The same was true of most of the manager pages next to the Cockpit and Live SCADA.

- **Operator form:** Downtime and Packing now use the same numbered step cards as Pouring. The card lives in its own file (`StepCard.tsx`) so all three share one definition.
- **Manager pages:** Historical Production Trends, Log Management, Floor Personnel (Roster), Google Sync, Lot Verification, Fleet Production & Work Orders, Nexus Analytics, the Master Resin table, and the Users tab in IT Admin all get the icon headers, banded section dividers and icons the Cockpit and Live SCADA already had. Historical's line chart is the same gradient sparkline Live SCADA uses.
- Every hard-coded text colour on those pages (`#CBD5E1`, `#F8FAFC`, plain `white`) now uses the theme's own colours - the difference that matters if this is ever run on a light theme.
- The banded section divider had been copied into three pages; it's one shared component now (`shell/Band.tsx`).

### A guided tour, and the wall display's clock

**A guided tour, for anyone who has never used this before.** Getting ready for second shift to start using this for real - built around the honest answer to "what happens if nobody explains it to them." It auto-launches the first time a brand-new account signs in, highlighting one thing at a time with a spotlight and a Next button: for an operator or packer, that's who you are, the operator guide PDF, the startup checklist, Pouring or Packing, Downtime, your photo checks, your Summary, and where to sign out. For a manager or admin, it's the Manager Cockpit's daily rounds, today's numbers, Live SCADA, IT Admin, and the operations handbook. It skips - automatically, silently - anything that doesn't apply right now (a packer has no Pouring tab; an operator who already finished their checklist has no Step 1 card to show), so it never stalls on something that isn't there. "Take the interactive tour" in Account & Preferences runs it again any time, for a refresher or for someone who skipped it the first time.

Found and fixed while building it: the retry logic that lets a step skip past something not on screen was counting animation frames, and `requestAnimationFrame` gets throttled hard - sometimes to nothing at all - the moment a browser tab isn't the frontmost one. On a real phone that's normal multitasking; here it meant a step could stall silently instead of skipping. Switched to a plain wall-clock timer, which doesn't care whether the tab has focus.

**The wall display was reading its own clock, not the plant's.** Confirmed while making sure everything's solid for two shifts: every other shift calculation in the app already converts to the plant's own timezone rather than trusting the server's raw clock - a lesson learned once already, written up in `shift_clock.py`'s own notes - but the TV dashboard's KPI numbers had their own separate, older calculation that never got the same fix. If the plant PC's clock ever drifts from the plant's actual local time, the wall display could show the wrong shift as active while every other screen showing the correct one. Same fix, one more place: reads the plant's timezone now, not the machine's.

### Second-shift prep: packing lots, a shift recap, QC exports

**Packing could log two different lots under one lot number.** The lot box always opened on LOT-<today>-01. If a second lot got packed the same day and nobody changed the number, both went in as -01 - two batches, one lot on the record, which is the one thing a lot number is there to prevent. It now opens on the next unused number for today (-02, -03...), and shows the lots already packed today as buttons, so keeping on with the same lot is one tap and starting a new one is the default.

**A recap at the end of the shift.** Signing out - or logging the end-of-shift photo - now shows a card first: units poured or packed, litres, yield, your best hour, how many of your weight checks landed in the band, where you finished against everybody else doing the same job today (a position, never anybody else's name), any badge you earned today, and how far it is to the next one. "Not yet" goes back to work. Nothing logged today means no card - it just signs out.

**The guided tour, for people who already had accounts.** The tour only opens on its own for a brand-new account, and second shift's accounts already exist. IT Admin → Users now has "Show the guided tour": pick one person, or queue it for every operator and packer on a shift at once. It opens for them the next time they sign in, once.

**Google Sheets export, finished properly.**
- The page used to say "paste the script (ask your admin for it)." The script was sitting in the code the whole time and the page just never asked for it. The setup steps and a "Copy the script" button are on the page now, so linking a sheet no longer needs anybody else.
- A third export: **QC & Batch History.** One row per filling of a vessel - vessel, resin, lot, pump, filled and emptied times, hours in the vessel, when QC was sent, the result, the turnaround in hours, who recorded it and their note. QC lives on the batch, not on any production log, which is why it was never in the other two. It works for Excel, CSV and pushing to a sheet, the same as the others.

**Smaller things:**
- The Downtime tab remembers the station and reason from your last stop today. Never the minutes or the notes - those are about that one stop.
- The "this pump was already checked today" override asks who did it from the roster instead of a free-text box, so the audit record doesn't end up with "Maria", "maria g." and a nickname as three people. "Someone else" still takes a typed name.
- The Suggestions inbox shows what's open and in review by default. Resolved items are one tab over instead of burying the open ones.

## 3.27 — Wednesday, September 23, 2026
### A quick job on another pump doesn't cost two photos any more.

Found at work: I had to run 19 RPS bottles on another pump, five minutes of work. After I logged them the app wanted a transfer photo for that pump, and it had moved the end-of-shift photo over to it as well. Any pour on a second pump counted as moving to it, so that pump also became the last pump worked, and the end-of-shift photo goes to the last pump worked.

Now anything under 100 units on a pump that isn't the one the shift started on is a quick job, not a move. It asks for no photos at all. It also can't become the last pump worked, so the end-of-shift photo stays on the pump that was actually worked all day. Go past 100 units and it counts as a real move again, and the transfer photo comes back. The pump a shift started on is never a quick job.

The Audit tab says "Quick job on Pump X - no photos needed," and the Checks table marks that row as a quick job, so managers can see why nothing is owed there. The startup checklist for a new pump is unchanged. It's a safety check on the pump itself, and it already lets a clean station skip the photo.

Tested with the exact case: 19 units on a second pump owes nothing, and the end-of-shift photo stays where it was. A real move of 150 units still asks for the transfer photo and takes the end-of-shift photo with it.

### The badges step back.

The career badge, lifetime total and progress bar are gone from under the shift ring on the pouring form. The ring for today is unchanged. The badge wall moved from the top of the Summary tab to the bottom, folded away under "Career badges." Crossing a new badge gets the same small pop as a normal pour now, not the big burst.

### The Notes tab is gone. Feedback is the one place to write in.

Nobody was using Notes, and it was one more tab on the operator form. There were two ways to send something to management, Notes and Feedback, and only Feedback was being read. So Notes is gone, and so is the manager screen that answered it, "Notes from the Floor," with its card on the Manager Cockpit. Feedback, in the account panel, is where anything for management goes now.

Old notes are still in the database. Nothing was deleted, there is just no screen for them any more.

---

## 3.26 — Tuesday, September 22, 2026
### Generating a backup on the portable database failed with "pg_dump was not found", every time.

Reported from work: hitting Generate Backup on the portable install said pg_dump was not found and pointed at checking whether it was installed. It was installed - it ships bundled inside the portable database package itself - the lookup just could not find it.

The code was asking `pgserver` (the package the portable database runs on) where its own bundled pg_dump lives, using a name - `pgserver.POSTGRES_BIN_PATH` - that reads as the obvious way to ask. That name has never actually been there. It lives inside one of pgserver's own internal files, and that file does not hand it up to the name the rest of the code was asking. Every time this ran, it silently failed to find it and moved on, then found nothing else either, because a portable PC has no separately installed PostgreSQL for it to fall back to.

It went unnoticed here because this home PC has a real PostgreSQL install with its folder saved in `.env`, so the broken lookup was never actually reached - it succeeded on the very first thing it tried, every time. The portable database at work has none of that, so it was the one place this could actually be seen failing.

Fixed by finding pgserver's bundled folder from the package's own location on disk instead of the name that was never really there. Backups on the portable database work again. Checked with the exact failure recreated - PATH, the saved folder, and the "look for a separate install" fallback all turned off at once, the same as a portable PC actually has - and confirmed it finds the real, bundled pg_dump every time.

### A real workflow, not just a pile of correct screens. Plus a genuine bug the redesign turned up.

Prompted by an operator asking a couple of times how to do the audits properly. Went looking for why, and found the actual cause: the same underlying check had three different names depending on which screen showed it. The startup checklist called it "Morning Cleanliness Check." The Audit tab's own dropdown called the exact same thing "Start Of Shift (Cleanliness Check)." The status table called it "Start photo." Nobody could be expected to know those were one fact, and the transfer and end-of-shift checks had nothing prompting them at all - they were just two more options in a dropdown that always defaulted back to the first one, whatever was actually still owed.

**The Audit tab is rebuilt around "what do I still need to log," not a blank dropdown.** It reads the same compliance data the Checklist & Audit Status screen already shows managers, and turns it into three plain cards - Start-of-shift photo, Transfer photo, End-of-shift photo - each showing done-with-a-time or a "Log it" button, and only appearing when it's actually relevant to that pump. A spill report stays separate below, because it's something that happens, not a box to check every shift. The checklist gate's own Step 1 is renamed to match - "Start-of-shift photo," the same words everywhere it's shown - and now says plainly that it's the same thing the Audit tab tracks, not a second thing to go do.

**A banner, visible on every tab, says what's still outstanding today** - not just on the Audit tab where it might not be noticed. "Pump 7 · End-of-shift photo," click it, and it opens straight into logging that exact one. The Audit tab picks up a small number badge with the same count. Both go quiet the moment nothing is outstanding.

**Found while actually testing this, not by inspection: a real bug in the compliance logic.** Finishing the startup checklist with zero pours yet was making the end-of-shift photo show as already due - before a single unit had been poured. The "which pump was worked last" calculation picked whichever pump happened to sort first for an operator with no pours logged anywhere yet, instead of recognizing that a station nobody has poured on can't be "the last one worked." This wasn't just wrong in the new UI - it meant the Checklist & Audit Status screen managers already use was marking a shift that had only just started as behind before it had a chance to be. Fixed, and proven with a new test: a fresh checklist with no pours reads as complete, not as already outstanding.

**Managers get an actual "what to check today" list, not just a menu.** The Manager Cockpit landing screen now opens with three live, reasoned items - startup checklists & audits outstanding, downtime & scrap today, and suggestions & crash reports waiting - each with a line on why it's worth looking at and a click straight into the right screen. This sits above the existing status tiles, which still show the raw numbers; this is the ordered procedure a new manager would otherwise have to be told about by whoever had the job before them.

### Update this PC from a phone, with the file already in hand - no connection to the update server or GitHub needed.

The update server this runs against lives at home, and I don't always have a way to reach it from the plant - either because I'm not on that network, or because home's connection is down. Every other way to get an update onto this PC needed one of those two things reachable. If neither was, the only option left was carrying a USB stick.

The Updates screen now has an "Upload a package" card, right under the version this PC is running. Pick a `.zip` - off a phone, off a USB stick plugged into a laptop, wherever the file already is - and it goes through the exact same checks a package from the update server or GitHub already goes through: the same signature verification, the same "is this really a package and not garbage" check. Nothing about the pipeline that actually applies it is different - the same backup-first, verify-it-boots, roll-back-on-failure steps run either way. A bad file is rejected and never touches disk; anything that passes shows what it is - version, what it says about itself, how many files - before asking to actually install it, the same confirmation as anywhere else on that screen.

Built and proved this one the hard way before trusting it: a disposable plant PC, a real signed package built from this exact tree, uploaded over a real HTTP connection to a real running server, actually applied, and the version on disk actually changed. Found and fixed a real bug doing that - rejecting a bad upload was trying to delete the file while it was still open, which Windows won't allow, so a garbage upload crashed instead of just being refused. Fixed before it ever went out.

---

## 3.25 — Sunday, September 20, 2026
### The changelog reads like I wrote it.

Every 4.x entry is rewritten in plain English. Same facts, same detail, none of the long wandering sentences. Short sentences, no dashes holding three clauses together, and it says what changed and why in the words I would use standing at the pump.

The 3.x entries further down are untouched for now.

### Going back to an older version actually works now, the updater got a lot harder to break, and the Updates screen got rebuilt.

**"Go back to this" never worked.** I found this testing updates. The button was there, the files went back, and then the older release's own start-up hit a database stamped at a migration it has never heard of. The boot check failed, the whole apply rolled itself forward again, and there was no way to revert anything.

Two things were wrong. The schema was never walked back, and it can only be walked back while the NEWER code is still on disk, because its migration scripts are the only thing on the PC that knows how to reverse its own changes. So that now happens first, before a single file is written. If every migration in between has a working reverse, the schema really does go back. If one does not, the version table is set to what the older release expects and the extra columns stay behind, which is harmless to code that never selects them. The log says which of the two it did.

The second thing: writing an older release over a newer one left everything the newer one ADDED still sitting there, including its migration files, so the older code ran "upgrade to head", found them, and climbed straight back up to where it came from. Going back now clears out files the older release does not have, inside the folders a release owns. Never uploads, backups, logs, the database or the .env. A revert ends up as that release, not a mix of two.

**Proved on a real PC, not just in theory.** New `dev/simulate_rollback.py` builds a throwaway plant PC from an older commit with its own scratch database, installs the current release onto it, then goes back, and checks the schema, the files and that the older release starts up on its own afterwards. Sixteen checks, all passing.

**The updater is harder to break.**
- Free disk space is measured before anything is written. Running out half way through is the one failure that leaves a PC on neither version.
- Only one apply at a time. A second click, or a check that fires while one is running, is refused instead of two releases writing over each other.
- Old copies-aside are pruned to the newest five. Each one is a whole copy of the project, and they were never cleaned up.
- Every attempt is written to a history file, the failures as well as the ones that worked.

**The Updates screen.** The version this PC is on is now the headline, with one button for the newest release if there is one. Versions are grouped into newer, running now, and older ones you can go back to. The confirmation is in the app rather than a browser popup, and it says exactly what is about to happen, including what going back does to the database. Underneath is what this PC has actually been through, failures included, and how many copies are kept aside to go back to. The update source moved into a section that stays shut until you need it.

### Bigger tank drawings, and this PC will not install a release over itself.

**The tank drawings on Live Reactors were too small.** I shrank them three days ago, in 3.24, when the numbers moved next to them, and went too far. They are about twice the size again now, so a tank still reads as a tank from a step back.

**A development PC now refuses to apply a release to itself.** This happened to me while testing the rollback and versioning work above: a development server runs out of the project folder like any other PC, so an Update button pressed in a browser pointed at it reverted this project's own working tree to an older release, and the clean-out that makes a revert a real revert took the dev and tests folders with it, because a release package does not carry either. Nothing was lost - the copy taken aside before the update had all of it - but that is luck, not design.

A PC that builds releases has no business installing them, and it is easy to tell apart: a plant PC has no .git and no dev folder, it only has what a package ships. Applying a release on a checkout like this one is refused now. MES_ALLOW_SELF_UPDATE=1 in .env lifts it, for testing the updater on purpose.

### The badges are paced for what this floor actually pours.

Some pourers do three or four thousand units in a day, so a ladder that started at 100 and ran 250, 500, 1,000, 2,500 handed out five badges before first break and then went quiet. That is backwards.

The rungs are 1,000, 5,000, 25,000, 50,000, 100,000, 250,000, 500,000, a million, two and a half, five, and ten million. Roughly, at three thousand a day: the first is a day, the second a week, the third a month, the million is a year and a bit, and the top one is a career. Every rung is at least double the one below it, so none of them slide by unnoticed, and a strong single day now earns one badge instead of five.

**Today's ring steps in a size that suits the day too.** It used to tick every 25 units, which on a good afternoon meant a hundred flashes. It steps by 100 under 500, then 250, then 500, and by 1,000 once the day is past five thousand.

---

## 3.24 — Saturday, September 19, 2026
### The check weight now measures how accurate each operator is, not whether a pump is drifting.

Same box on the pouring form, same reading, read a different way. Each operator gets their average bias (consistently heavy costs resin, consistently light is a customer problem), how far a typical reading of theirs lands from target in either direction, how many were inside the tolerance band, and how many readings that is from. Closest to target is listed first, so it reads as a scoreboard and not a list of suspects. Going +8 then -8 no longer averages out to looking perfect. That is what the ± figure is for.

**Each person is measured against the pump they were standing at.** A pump that runs 8 g heavy makes everybody on it read 8 g heavy, which says nothing about the person. So there is a "vs pump" figure next to the raw one: the same readings with that pump's own median taken out, meaning heavier or lighter than everyone else on the same equipment. It shows a dash until more than one person has weighed on that pump, because a baseline built from one operator's own readings can only ever say that operator is average. The ranking uses the adjusted figure where there is one.

The note underneath compares people with each other, not with the middle, because two operators on one pump sit the same distance either side of the median by definition. It reads like "On the same pumps, Ben fills 6.0 g heavier than Ana." When the gap closes once the pump's own habit is taken out, it says that too, and that difference was the equipment and not the people.

The note only names anybody once there are at least five readings each. Two readings 9 g out is a coincidence. Twenty of them is a habit.

### Badges that run to a million, and the app moves when something happens.

**Career milestones.** The shift ring resets at midnight. That is right for a shift and useless as a record of the work. Under it there is now a lifetime total that never resets, and the badge it is working toward: 100, 250, 500, 1k, 2.5k, 5k, 10k, 25k, 50k, 100k, 250k, 500k, and the million. More can go on top later.

Nobody awards these. A badge is a total that has been passed, counted from the production logs, so deleting a bad log takes its units back out the same way it does everywhere else. Crossing one is the loudest thing that happens on that screen, because the first hundred happens once and the million might never happen. The Summary tab shows the whole wall including the locked ones, because a badge you cannot see is not something anyone works toward. The progress bar measures the gap you are climbing, not the distance from zero, so somebody at 600,000 reads as 20% of the way from half a million to a million instead of sitting at 60% for a season.

**Things move now.**

- The submit button fills up like a cartridge while the pour is being saved, instead of showing a spinner. It is an animation, not a real percentage. Nothing here knows how far along the server is.
- The count you typed flies up to the shift ring, which then counts up. They were always the same number a second apart and nothing said so.
- The tanks are alive. The level slides down when a pour lands instead of jumping on the next refresh, and a tank with resin in it has a slow shine that an empty one does not.
- The startup checklist turns each line green as you tick it, and the padlock springs open on the last one.
- The fill weight reading is a needle that swings to where it sits in the tolerance window and settles, so "in band, but only just" is something you can see.
- The drill-down panel builds itself, section by section, with the bars drawing from zero.
- The live log slides a new row in from the top, and the leaderboard actually swaps places when somebody overtakes.
- Pace variance is a needle that drifts across the shift, scaled to a tenth of the projected total either way so it means something at our size.
- Manager screens fade in when you switch between them.

All of it runs through one file and respects both switches: the operating system's reduced-motion setting and the app's own "background animations off" option. Nothing waits on an animation. A pour is never held up for a flourish. Counting numbers jump straight to the real figure on a hidden or throttled tab, because a wall display showing an old total is the one thing that cannot happen.

### The Manager Cockpit landing screen got rebuilt.

It was a column of identical thin bars, with explanation text hanging under some of them and not others, which is what made the rows look uneven and the page look unfinished.

Every card is the same shape now. An icon, the name, and one line about what that screen answers. The explanation sits inside the card, so the rows line up. The page has a maximum width, because a menu stretched across a wide monitor puts three words at one end and an arrow at the other. Each section has a line across the page instead of a small label floating above a grid.

**It also tells you something about the plant now.** A landing screen made entirely of buttons says nothing about the shift you just walked into. Across the top is the day so far: poured today, pumps running with how many people are on them, downtime, and checks outstanding. Checks outstanding is amber when something is missing and green when nothing is. Every tile opens the rows behind it, same as every other number in the app. The checks tile goes straight to the screen that names who.

### Live SCADA was bland, so I gave it some shape.

It had turned into a wall of identical flat boxes. Every number the same size, the same colour, in the same kind of card. Nothing was the headline and nothing looked worth a second glance.

- **The headline is a headline now.** The shift's litres are big, with a live dot when a shift is running, and the ahead or behind number sits in a coloured pill instead of trailing along as more text. Next to it is a small graph of the same rows the log below shows, by hour on a single day and by day over a range. The total tells you how much. The graph tells you whether it came in steadily or in one burst before lunch.
- **The stat boxes have icons, and colour where the number means something.** Run velocity is green at or above target and amber below it. Yield is green above 98%. Anything that cannot be right or wrong stays plain, because if everything is coloured then the colour says nothing.
- **The shift trajectory** says how far through the shift you are and how many hours are left, instead of leaving a bare bar to work out.
- **The leaderboard** is bars with medals. The bar is the comparison, the L/h is the detail. Off shift it takes the whole row instead of sitting alone in a third of it looking broken.
- **Sections are separated** with a line across the page (pouring, packing, the log), matching the cockpit, and the page has a maximum width so it stops spreading across a wide monitor.
- **The log** has a header that stays put, counts lined up on the right, and scrap in amber only when there is some.

### The pouring form, the reactor fleet, the sign-in screen, and every table in the app.

**The pouring form is three steps now and it looks like three steps.** It always was three. Station and material, the lot check, then the count. But all three were plain headings in one long column, so the screen operators use all day read as one wall of fields with no sense of where you were in it. Each step is its own card now, with a number that turns into a green tick when that step is done.

The submit button is stuck to the bottom of the screen. The count gets typed at the top of the last card, and on a phone the button was a scroll away from it. "Same as last hour" is a full-width button instead of a small link above the form.

**Live Reactors is one card per tank instead of three.** A tank used to be split across a drawing, a "remaining" box and a "what's in it" box, so reading one tank meant reading three cards, and reading the row meant reading twelve. Now each tank is one card: name and asset tag, a status pill, the litres left in big text, a fill bar, what is in it, and the time in the tank and QC state as small pills. The litres change colour with the level. Green normally, amber under a quarter full, red under a tenth. A QC failure outlines the whole card in red. The drawing is smaller now, because it is there so you recognise the tank, not so you read the level off it.

**Every table in the app improved at once.** They all use the same two style settings, so making the header stay put while a long list scrolls and making a row light up under the mouse was one change. It covers Batch History, Lot Verification, Log Management, the drill-down panel, the checklist status screen and the SCADA log.

**The sign-in screen.** It is the first thing anyone sees each morning on a terminal bolted to a bench, and it was a flat blue rectangle. It has a lit background now, a glass panel, bigger boxes and a bigger button for gloved hands, and the button fills up while it signs you in instead of going quiet.

**The Analytics Hub** is set to the same page width as the cockpit and SCADA, so the manager screens all line up.

### The IT Admin console got rebuilt.

It used to be six long labels in one row of buttons. On anything smaller than a desktop that row scrolled sideways, so half the console was off the screen, and nothing told you what any of the six were for.

Now it is a list down the left side. Each one has a line explaining what it does. The ones that pile up work show a count, so an unresolved crash report or a suggestion nobody answered is visible as soon as you open the page instead of being found by clicking through everything. A waiting update shows a count too.

Across the top are the three things worth knowing before you touch anything:

- What version this PC is on. It turns amber and names the new one when there is an update waiting.
- When the last backup was taken. Green if it is recent, amber once it is overdue, red if there has never been one. It also says how many backups are being kept.
- Unpacked WIP, with today's poured and packed numbers under it.

### The changelog is in the app now.

These notes were written for every release and then sat in a file on disk that nobody opens. You can read them in the app now, in two places: Account & Preferences, under "What's new", and IT Admin, under "What changed".

It reads CHANGELOG.md off the PC you are on, not a copy pasted into the app. That file ships inside every update package with the code it describes, so the notes always match the version that PC is actually running. The entry for that version is marked "on this PC".

Anyone signed in can read it. It is the same text that goes out with the release, and an operator who finds a screen different than it was yesterday deserves an answer.

---

## 3.23 — Friday, September 18, 2026
### Moving the resin list between PCs, and a reopened startup checklist that behaves like one.

**Moving the resin list.** `export_resins.py` writes this PC's resin specs to `resin_export.json`. On the other PC, `Import_Resins.bat` loads it into that PC's database. SKUs already there are skipped, so it is safe to run twice. Run it with the app already open.

**Reopening the startup checklist.** It no longer shows the red "terminal locked" banner for a checklist that is already done. It says so, with a button back to the form. A second cleanliness photo can be logged on a pump that was already checked today, for an operator taking over.

### Click any number and see what it is made of.

Every lot, run, pump, operator, resin, vessel and total is clickable now. A panel slides in from the right with everything behind it: the totals (units, litres, scrap, downtime), a breakdown by operator, pump, lot, resin, day and shift, every log with its weight and lot-check results, the runs it counts toward, the vessel batches it came out of, the cartridge lot checks, and for a pump or a person or a day, the downtime and photo audits.

Every name inside the panel is clickable too, so it goes as deep as you want. Back comes out again, Esc closes it, and the × on a filter chip widens the view. The logs download as a CSV.

It works on Live SCADA (every card, the leaderboard, the packing list and the log stream, and a card opens exactly the rows it was added up from), Assigned Runs, Live Reactors, Batch History, Lot Verification, Log Management, Historical, the Analytics Hub including each heatmap square, Scrap Intelligence, Checklist & Audit Status, and the operator's own shift ring and summary.

A run's panel counts its logs by the same rule the run's own progress counter uses, so the two can never disagree. Lots match however they were typed, so "lot-9001 " finds LOT-9001. An operator can click anything but only ever sees their own entries. A manager standing in for an operator sees what that operator would see.

---

## 3.22 — Thursday, September 17, 2026
### A plant PC can find and apply an update on its own, the bundled database is the standard way to run this, and the update that would not apply on a portable PC now applies.

**A plant PC finds out about a release by itself.** Until now an update travelled on a USB stick and nothing else. It still can, and that path is unchanged, but a PC with internet access now also checks GitHub Releases for a newer signed package, shows managers a banner when there is one, and installs it from the browser (IT Admin, Updates, or the banner's own button). Nothing about trust changes. It is the same signed zip going through the same `setup/apply_update.py`: checksum, signature, version check, database backup, whole project copied aside, write, prove it boots, put the old version back if it does not. `dev/make_update.py --publish` is what puts a release there. The check is cached for fifteen minutes and shared by every open page, because GitHub allows sixty unauthenticated calls an hour per address and a few manager tabs left open all day would spend the lot and start reporting failures instead of updates.

**An update could not be applied at all on a PC using the bundled database.** Reported from the work PC. The update ran, said the backup failed, and stopped. That is the updater doing its job, since it will not write anything without a backup behind it, but it could not take one. A portable PC has no `DB_URL` in `.env` (the bundled database picks its port at run time and never writes it down) and no installed PostgreSQL to provide `pg_dump`, so the backup step had nothing to work with. Both routes hit the same wall, USB included.

Fixed in `utils.py`, which now finds the bundled database in `pgdata\` and the `pg_dump` that ships with it. Alembic had the same blind spot one step later. It read `DB_URL` directly, so the update's own "does it still boot" check died on "Could not parse SQLAlchemy URL". `db_core.py` now resolves the database once for everything: `DB_URL` when there is one, the bundled database otherwise. Anything started from a console on a portable PC, the backup helper, the update's boot check, the gateway's `--check`, finds the same database the app uses.

**That fix shipped inside the update that could not be applied.** So there is a new `Repair_Updater.bat`: one self-contained file carried to the stuck PC alongside the package, the same trick `Unlock_Move_Package.bat` already uses for its own payload. It verifies the package's signature and checksums with that PC's own key, replaces only the updater's own handful of files, keeps the originals in `rollback\`, never touches the database, and installs `setup/bootstrap_update.py` so the PC has the repair tool from then on (START_HERE.bat, option 13). It cannot install a release. It can only make one installable. The public key that decides whether a package is genuine is deliberately not one of the files it will replace.

**Restarting after an update killed the database on a portable PC.** The 4.08 restart helper force-killed the server and relaunched plain `uvicorn`. In portable mode the database runs inside that process, so the PC came back with an app and nothing behind it, and a PC started on another port came back on 8000. Nothing builds a launch command any more. The app leaves a marker file, asks itself to stop the way Ctrl+C does, and whatever launched it starts it again, which in portable mode means the launcher starts the database too. Both launchers run the app in a loop that watches for that marker. I measured this rather than assuming it: raising SIGTERM inside the process on Windows kills it outright without uvicorn's handler ever running, which would have left the database up behind a dead app. SIGINT is the one that ends uvicorn cleanly.

**Update packages are the whole application now, not a diff.** A diff package has to be built against the exact version the far PC is on, and this project has no release tags, so `--from PT-V4.02` quietly meant "changes since the last commit" and could produce a package missing most of what it claimed to carry, which the far PC would install and report as a successful update. A full package cannot be missing a file, applies to any older version, and costs a few MB that a USB stick and a GitHub release both handle without noticing. The build refuses outright if `VERSION` or the built frontend is not in it.

**The bundled database is the standard way to run this now.** Option 1 installs it: Python, the packages, and nothing else. No PostgreSQL installer, no service, no password to invent, no admin rights. Option 3 starts whichever database this PC actually has (a real `DB_URL` in `.env` wins, otherwise the bundled one), so the same menu works on both kinds of PC and a move package that lands on either starts the same way. A PC with its own PostgreSQL is still fully supported. Option 14 installs against it and everything else is unchanged.

**A Device Gateway on another PC can reach the bundled database.** It is private by default (127.0.0.1, a new port every start, no password), which is right for the PC that owns it and useless to a gateway PC on the floor. New START_HERE.bat option 15 gives it a fixed port and a generated password, allows the postgres login from the plant's subnet with `scram-sha-256`, and prints the two things it cannot do itself: the Windows Firewall rule for this PC, and the one `GATEWAY_DB_URL` line for the gateway PC's `.env`. I verified it by connecting over this machine's own LAN address and confirming a wrong password is refused.

**Publishing a release from inside the app is off unless a PC says otherwise.** A signed release is trusted by every plant PC, so a browser button that builds and signs one belongs on the machine holding the private key and nowhere else. That means `MES_ALLOW_PUBLISH=1` in that PC's `.env`, and the Publish card does not render anywhere else. A plant PC asked to publish now gets a sentence explaining why it cannot, instead of a 500 from an import that was never going to work, since `dev/` does not ship in an update package.

**Updates can come from your own PC instead of GitHub.** `setup/update_server.py` (START_HERE.bat option 16) serves `dist\` read-only, which is a generated `latest.json` and the package itself and nothing else on that machine. A plant PC pointed at it with `MES_UPDATE_URL` in its `.env` uses it exactly as it would use GitHub: banner, one button, same installer. Whether the connection can be trusted does not come into it, because the package is signed and every file checksummed, so a copy altered on the way is refused on arrival. The download is checked against the listing's own hash before the installer is handed it. That is what makes plain HTTP from a home PC acceptable, and `--token` a way of keeping strangers out of the logs rather than a security boundary.

**A private repo no longer looks empty.** The GitHub check never sent this PC's token, so a repo that had been made private answered 404 and got reported as "no release has been published yet". It sends the token on every call now, and a PC without one is told the repo may be private and what to add.

### Fewer keystrokes an hour for operators, a straight answer on who did their checks, and pace figures that stop reading high.

**The estimated total and the pace were always higher than we expected.** It was arithmetic, not optimism. The plant's shared litres-per-hour figure was being applied to every pump, so two unconfigured pumps each claimed the whole plant's rate and three claimed it three times over. A pump's rate now comes from the first of these that exists: a rate somebody set for it, what that pump has actually been doing in its own logs, or a share of the plant figure split between the pumps that have neither. Each station's estimate says which of the three it used, so a number that looks wrong can be traced instead of argued about.

**A pump knows what kind of pump it is.** Piston diaphragm or electric motor, set when the pump is created and changeable afterwards. Nothing is guessed from the name any more.

**Logging an hour is one button when nothing changed.** "Same as last hour" fills in the pump, resin and cartridge from your own last entry of the day. The count is always typed. That is the one number nobody should ever be handed. The lot is typed too, because a lot that quietly carries over is a lot that ends up on the wrong drum.

**Downtime can be timed while it happens.** Start it when the pump stops, stop it when it runs again, and the minutes land in the box. The timer records the moment it started rather than counting up, so a phone in a pocket for twenty minutes still reports twenty minutes. Nothing is recorded until the log is submitted, and a stop two seconds after a start still counts as one minute rather than quietly buying back pace credit.

**A pour is celebrated against its own pump.** A hundred bottles is a strong hour on an old pump and a slow one on a new one, so the celebration is scaled by what that pump has actually been doing. Its median hour, from its own logs. No configuration and no guessing about a pump nobody has characterised. Beating that pump's best hour on record says so by name. A pump with fewer than five hours behind it is not told its first hour is a record.

**Checklist & Audit Status: who did their checks, and when.** One row per operator and pump worked, with the four things that are supposed to happen: the startup checklist, the start-of-shift photo, a transfer check when somebody moved pumps, and the end-of-shift photo. It records nothing new. Every column is read from rows the floor already produces, which is what makes it a record of what happened rather than a second checklist about the first one.

A dash means that check is not expected on that row. The start-of-shift photo belongs to the pump the shift began on, and the end-of-shift photo to the last pump worked. A column that marks a correctly run shift as incomplete gets ignored by everybody within a week. Operators see their own on the Audit tab. Managers see the floor from the Cockpit. Any past date can be picked, so "did that get done last Tuesday" is a question the screen answers instead of a trip through the log tables.

**The startup checklist can be brought back up.** It carries the pump startup form link, and it used to disappear the moment somebody moved to another pump. A button on the operator form shows it again.

**"Browse pictures" only ever opened the camera.** On a phone it went straight to the camera with no way to pick a photo already taken, which is exactly what you want when the photo was taken ten minutes ago with gloves on. It offers the gallery now.

---

## 3.21 — Wednesday, September 16, 2026
### The portable launcher could fail to come back after a crash, every seeded account used a fixed demo password, and the operator screens got a pass of small polish.

**A crash could make the bundled database look permanently broken.** Reported directly: a portable-mode launch crashed and after that it would not start again. Two bugs compounding. First, `pgserver`'s own "wait for postgres to be ready" step gives up after a fixed 10 seconds, which is too short for the WAL recovery a real unclean shutdown needs on this setup. A Windows file-locking retry alone can run 30 seconds. Postgres itself reliably finished starting a few seconds later in the background, but the old code treated that timeout as fatal and crashed outright. Second, the shutdown path was not as deterministic as it sounded. Both fixed, and the launcher now waits the way the database actually behaves.

**Every seeded account, including the admin one, used a fixed published password.** The demo accounts a brand-new database creates (`operator` and `sasha` with PIN 1234, and `manager` with PIN admin123) exist so a fresh install has something to sign in with. A known admin password left in place on a real install is a real credential, not a placeholder. The portable launcher now asks, the moment a truly new database is created, for a real name, username and PIN, and creates that as the admin, retiring `manager` once it exists. Declining keeps `manager` and admin123 as before. The same prompt is available on demand afterwards.

**Small motion, mostly for operators.** A few places that changed instantly now change noticeably. The lot verification panel shakes on a mismatch and pulses on a match. The master log stream's newest row flashes when a fresh entry lands. The "Drawing from Reactor X" tank icon gulps when a pour posts. The Undo button has a countdown ring that drains through its 120 seconds. Switching between Pouring, Downtime, Audit, Notes and Summary slides instead of snapping. The checklist unlock sweep is joined by the newly unlocked screen fading up. Buttons press down on touch, and the phone vibrates once on a normal submit.

### A granted ability like "See the plant dashboard" had no way in from the operator's own screen, the vaporwave and synthwave grid had two real rendering bugs, and 4.03's polish pass never reached the one screen it was meant for.

**Granting an operator a screen like Live SCADA did nothing they could reach.** Reported directly. Abilities were handed out to an operator and their pourer and neither could get to what they had been given. The ability itself was enforced correctly on every API call the whole time. This was purely the frontend. Three places decided who sees the manager-side screens by role alone, with no idea a specific ability could be granted on top of it: the app's root route sent any operator or packer straight to the operator form regardless of what they held, the "← Manager Cockpit" button only checked for manager or admin, and the sidebar inside that shell listed screens by role. All three read abilities now.

**The Vaporwave 1984 and Synthwave Sunrise grid had two real bugs, not just a look somebody did not care for.** Reported as "the vaporwave one looks a little weird" next to the others. Both themes share the same receding grid. The animation moved the pattern 60px per cycle while the grid was drawn in 48px tiles, so it visibly snapped once per loop instead of scrolling. And the original 78-degree tilt over a very short 200px perspective folded the grid almost flat. Both fixed. More visible on Vaporwave's saturated magenta than on Synthwave's softer pink, though both were affected the same.

**The animation pass from 4.03 never reached the operator form.** All of that work landed on individual controls, but the full-page background flourish had only ever been wired into the manager shell. An operator on Vaporwave 1984 or The Matrix saw a plain background on the one screen they look at all shift. It is on both screens now. Neon Cyberpunk was tagged as a glow theme from the start but never actually given a flourish, and has one now.

### The operator-form background from 4.04 was there but effectively invisible on a phone, plus a canvas bug that would have undercut the fix on one theme.

**The flourish added in 4.04 could not be seen past the first few seconds on a phone.** Reported after trying it at work. The animation renders behind the whole page, but the card on top of it is solid, and the Pouring tab grows taller than a phone screen as soon as a station and resin are picked. The card then covers the whole visible area at any scroll position, leaving only the brief "just signed in, nothing picked yet" moment where it shows at all. Fixed by making the card itself slightly see-through with a light blur on any theme that actually has a flourish. Plain themes are untouched, since there is no reason to blur a card over nothing.

**The Matrix's falling-glyph canvas only measured its container once.** Caught while checking the fix above. It sized the canvas to its parent's height a single time when it first loaded and used a window resize listener to catch anything after that. On the operator form the page starts short and grows as the checklist and pour fields appear, and none of that resizes the window, so the canvas stayed at its original short height while the page grew past it. The bottom half of a real pour form had no rain behind it at all. It watches the element itself now.

### The Operations Handbook link in the manager sidebar had no permission check of its own.

Reported right after 4.04's ability-based navigation fix went in. That fix filtered every tab and cockpit card down to what a person's abilities actually cover, but the "Operations handbook (PDF)" link below the nav list was never part of that system. It rendered for anyone who reached the shell at all. The handbook is written for managers, and operators already have their own Operator Guide linked from their own screen. It is behind the same check as everything else now, the same gap the "Launch TV Mode" link had and got fixed for in 4.04.

### The Device Gateway survives the network between the floor PC and the MES PC, says honestly when nothing is being read, and does Find Devices and Test Connection on the PC the machines are actually cabled to.

**A few seconds without the database ended the gateway for good.** I found this by simulating a floor-PC gateway on a flaky network (a fake PLC, a real `run_gateway.py` process, and network links I could unplug or stall) before deploying one on a corporate network. The rescan loop had no error handling at all. The first failed query raised out of it and the process exited with a traceback, and nothing was read from any machine again until someone noticed and restarted it by hand. A 25-second drop between the two PCs was enough. A stalled link did the same thing the moment it cleared.

Every loop in `device_gateway/service.py` now treats a database error as an outage to wait out: one plain log line, a reminder every minute, a retry every few seconds, and it carries on the moment the database answers. The database connection has a connect timeout and TCP keepalives now, so a connection whose far end silently vanished becomes an error within about a minute instead of waiting forever. Startup got the same treatment. `run_gateway.py` logs in before going any further and, if it cannot, says why in words somebody at the floor PC can act on. A `pg_hba.conf` rejection prints the exact line to add, a timeout points at the firewall, and a `localhost` address points out that the `.env` was copied from the MES PC. It keeps trying instead of exiting, so a floor PC that boots before the MES PC still ends up connected.

Verified end to end. Through a pulled database link and a 45-second stall the gateway stayed up, resumed on its own, and every pour the fake PLC counted (44 of 44) landed in production logs.

---

## 3.20 — Tuesday, September 15, 2026
### The move-to-new-PC package is password protected, management can mark a reactor filled without waiting on a pump, and three real bugs that predate today got found and fixed along the way.

**`pgserver` split out of the main install.** It has no wheel past Python 3.12, and `pip install -r requirements.txt` failing on it took the whole install down with it. Nothing installed, not even packages that had already resolved. It lives in its own `requirements-portable.txt` now, installed only by the bundled-database launcher. The main install path never sees it.

**The move-to-new-PC package is password protected now.** This came out of a direct question about where the resin catalogue is stored and whether it travels with the move. The app's own access control there is real. SKU and resin code are behind `manage_resins` and never leave the ungated lookup endpoints. But none of that survives a `pg_dump`. The full database backup, resin catalogue included, was travelling inside a zip built with PowerShell's `Compress-Archive`, which has no password option at all. New `Unlock_Move_Package.ps1` and `.bat`, plain PowerShell and .NET because the receiving PC has not installed anything yet, AES-256 encrypt the package before it leaves the machine it was built on and unlock it on the other end.

**A no-hardware simulator added to the Device Gateway**, so a pump or a scale can be tried, demoed, or used to train someone on Analytics and the TV dashboard before any real machine is wired up. It generates a fill cycle on a timer (weight ramping, holding, resetting, a unit counted per cycle) through the exact same path a real Modbus or OPC-UA device uses. Creating one fills in its own tag map, since its raw tags are already named after what they mean.

**The gateway could not have connected to a single real or simulated device.** Found while proving the simulator worked end to end, not caused by it. The one function the background poller calls read a device's connection details with a plain `json.loads()`, but `connection_json` is encrypted at rest. Every device would have shown a connection error, on every attempt, forever. The admin page's own Test Connection button never caught it, because that button builds its adapter from a plain dictionary and never touches the stored encrypted copy. Fixed to decrypt first.

**The database's LAN announcement could never complete.** `service_announcer.py` exists so a Device Gateway on another PC can find the database without a hand-typed address. It was started from a plain synchronous startup handler, which runs directly on uvicorn's event loop rather than in a worker thread the way route handlers do. `zeroconf` saw a loop already running on that thread, tried to attach to it, then handed its registration back to that same loop and waited, which can never resolve while the handler doing the waiting is the thing blocking the loop. Every launch logged an error and the announcement silently never went out. Moved onto a plain background thread, which has no loop for `zeroconf` to find.

**A clean station no longer needs a photo.** The daily cleanliness check required one no matter what. A "Station is clean, skip the photo" box lets it through on the notes alone, so a routine clean station does not need a picture nobody was going to look at.

**The Pouring tab stopped asking what the checklist already knew.** Every other tab after the startup checklist already carries the station forward. Pouring never got it and asked again from a blank field every time. It also never used the existing mechanism for remembering what an operator poured last. Station carries over from the checklist now, and cartridge and resin fill in from the last logged pour. Found a bug in that mechanism on the way: its route was missing the `/reference` prefix every sibling endpoint carries, so the first attempt at wiring it up 404'd.

**Management can mark a reactor filled, instead of relying on an operator's changeover at the pump.** Filling a vessel had only ever been inferred from an operator confirming a resin swap at the pouring form, which means a vessel filled for the first time (nothing to swap from) or topped off with the same resin (not a swap at all) got no fill time on record. A "Mark a reactor filled" panel on Live Reactors opens a new filling explicitly, closing whatever was open first. It also finally uses `ReactorBatch.lot_number`, a column that has existed since batch tracking was built but that nothing ever filled in or displayed. It shows as its own column in Batch History and in the CSV export.

**Documentation caught up.** The Operator Guide describes the skip-the-photo option. The handbook's device-gateway appendix lists the simulator and what it is for, and its test-suite count is current again. `dev/check_page_fit.py`, the tool that catches a document's content clipping off the bottom of a printed page, had a hardcoded Linux browser path that never once resolved on this Windows machine. Fixed, and it immediately caught a five-pixel clip on the operator guide that had been shipping unnoticed.

### The move-package encryption from 4.01 could fail outright on a real machine, and the resin tracking got a pass of fixes and a restored feature.

**Encrypting the move package failed with "Array dimensions exceeded supported range" on a real PC.** The encrypt step read the whole package into one byte array and then built a second full-size array for the ciphertext on top of that. That is well inside .NET's per-array ceiling for a package this size (a little under 200 MB), but a 32-bit PowerShell process, or one already short on contiguous address space, can hit the ceiling on a single sizeable array long before the file is anywhere near 2 GB. Rewritten to stream the package through in 1 MB chunks, so both directions hold a few MB at most no matter how large the package gets.

**Unlocking the package on a work PC needed a file nobody was told to bring.** `Unlock_Move_Package.bat` has always needed `Unlock_Move_Package.ps1` next to it, but `Move_To_New_PC.bat`'s closing instructions only ever said to copy the `.bat` and the encrypted package. A work PC that got exactly the two files it was told to get failed immediately with "Unlock_Move_Package.ps1 is missing", with nothing to hint that a third file existed. The `.bat` is fully self-contained now. It carries a base64 copy of the script inside itself and unpacks it to a temp file.

**`run_mes_api.bat` is gone, folded into `START_HERE.bat`.** START_HERE has always called itself the only entry point, but starting the app for real still meant calling out to a second file that people kept opening directly. Option 3 runs the same checks and the same launch inline now. The READMEs and the code comments that named `run_mes_api.bat` point at START_HERE instead.

**Marking a reactor empty did not clear the resin.** It only closed the QC and dwell-time batch row. It never touched `Reactor.current_resin`, which is the field the pouring form and the tank wall both read. A tank marked empty kept matching new pours and kept drawing down exactly as if nothing had happened, which is how an operator (and a manager testing the same button) could log against a reactor everyone believed was empty. It clears the resin now as well as closing the batch.

**Marking a reactor filled did not reset what the tank wall showed.** The level is worked out from production logs, not stored. It sums everything logged since the newest lot it can find for that resin and pump. Topping off with the same resin, which is the exact case this button exists for, left the old lot as the newest on record, so the wall kept counting down from before the top-off. Fixed to anchor a fresh lot when one is given, or fold in a calibration adjustment when it is not, so the level reads full immediately.

**The same resin coming back to a pump it held before could read the wrong level.** This was the root cause behind both of the above. The "since when" boundary was worked out purely from lot text, with no memory of when the current occupancy actually began. A resin swapped away and back, before any fresh lot was logged, could still be showing draw-down from months earlier. It is anchored to the reactor's own batch-open time now.

**The "Manage Permanent Reactor Fleet" panel bypassed all of that.** A manager picking a different resin from that dropdown never closed the old filling, never opened a new one and never touched the displayed level. It was a silent, unaudited way around every safeguard the other three fixes just added. Reassigning the resin there behaves like the changeover it is now: batch closed and reopened, level reset, and one audit line recording what changed and who did it. An edit that leaves the resin alone, like fixing a tag or a bay marker, still has no side effects.

**Tank level reconciliation is back.** The old Streamlit app let a manager or operator correct a tank's level to what they read off the sight glass, recording the difference as its own event rather than silently overwriting a number. That code stayed in `crud.py`, fully tested, but never got a route or a screen in the rewrite, so there was no way to fix a drifted level short of editing the database by hand. There is a "Reconcile level" control on each reactor card again, by percentage or by exact litres.

---

## 3.19 — Monday, September 14, 2026
**Streamlit is gone. The FastAPI and React app is the only app now.**

The migration this changelog has been tracking piece by piece since the operator form pilot is finished. `Home.py`, everything in `pages/`, `ui_shell.py`, `components.py`, `database.py`, `theme_engine.py`, `themes.py`, `.streamlit/` and `run_mes.bat` are deleted, not just unused. Streamlit and its add-ons are out of `requirements.txt`. START_HERE.bat no longer offers a Streamlit option. The two launchers, one for a real PostgreSQL install and one for the bundled database, are the only ways to start the app.

Six test files that only tested Streamlit's own rendering are deleted with it, along with a handful of smoke and parity scripts that went the same way. Five more had real, still-useful checks tangled up with Streamlit-only sections. Those are trimmed rather than deleted, with a comment where the old section was explaining what retired and why.

**Bugs the removal surfaced. Not caused by it, fixed anyway:**

- **WIP read as zero for several hours every evening.** The WIP endpoints worked out "today" from UTC, but a production log's date is stamped from local time. Between local evening and UTC midnight the two disagreed and the WIP tile silently showed 0 with real unpacked production on the floor. Both read local time now.
- **A freshly tracked reactor could show a negative dwell time.** The backfill that gives a vessel already holding resin an opening batch row copied a UTC timestamp straight into a field that is local everywhere else. Fixed the conversion and corrected the one row it had already written wrong.
- **`Move_To_New_PC.bat` could not run.** Activating the venv bakes in the absolute path it was first created at, and this project has moved folders since, so activation silently added a dead PATH entry and every `python` call underneath hit the system interpreter instead. Now it calls `venv\Scripts\python.exe` directly, the same fix the other launchers already had.
- **An update package's signature always failed to verify.** The applier checked a package against this machine's own public key, ignoring the argument that says which PC's folder is actually being updated. Harmless on the one PC that always is this one, wrong for anything else including its own test suite.
- Two Windows-only bugs in the dev tooling: the test runner's ordering fix compared forward-slash paths against Windows backslash output and never matched, so the ordering it named was never happening, and one test expected a write failure to raise when the function deliberately catches, logs and returns False like the rest of `crud.py`.
- `pgdata\` (the bundled database) and `certs\` (the per-machine TLS cert) added to both the update builder's skip list and the applier's never-touch list. They were only protected on one side of that pair before.

**The version is visible again.** It retired with `Home.py`'s own version line and was never rebuilt, so nothing in the running app said what it was running. `VERSION` at the project root is the one place it is written now, read by the update builder, the applier and the app itself, and the sidebar footer shows it.

**The launcher prints the address for the phones** every time now, instead of only when asked.

**114 real resin specs added**, transcribed from the plant's own wall reference card. Every V1, V1/V2 (split into one row per format, since a spec here is per cartridge), V2, RPS, Pigment and Amazon formulation on it, SKU left blank as instructed. The two placeholder demo specs already in the database are untouched.

**Known gap, not closed today:** the update builder's default mode figures out what to ship by asking git what changed, and `api/` and `frontend/` have never been committed, so it cannot see either one. Building an incremental update would ship everything else and silently leave out most of the running app. This release's own commit fixes that, but it is worth knowing if a future release is ever built before that history exists.

**Also not finished:** the handbook and operator guide still carry screenshots of the old Streamlit screens. Only the operator guide's sign-in figure was re-shot against the real React app before time ran out. The screenshot scripts all drive Streamlit selectors against port 8501 and need rewriting before the rest can be regenerated.

---


## 3.18 — Friday, September 11, 2026
### Security posture, findings 1, 5, 6, 7 and 8

Went through `Formlabs_MES_Security_Posture.pdf` (PT-V3.46) one finding at a time. Found a stray, non-functional set of Ruby on Rails files sitting in the project (`app/models/`, `database/migrations/`) that something else had dropped in while apparently trying to fix Finding 5 — deleted them; this is a Python project with no Ruby anywhere in it, and the real fix for Finding 5 (the `ResinSpecHistory` audit trail in `models.py`/`crud.py`) was already in place. Finding 8 (the mDNS announcer ignoring the gateway toggle) turned out to already be fixed too — `service_announcer.py` already checks `enable_device_gateway` before it broadcasts anything, I just hadn't crossed it off the list.

- **Finding 1, plain HTTP, closed.** `setup/generate_tls_cert.py` writes a self-signed certificate to `certs/mes.crt` / `mes.key`, covering this PC's hostname, LAN IP, `localhost` and `127.0.0.1`. `run_mes.bat` and `START_HERE.bat` (option 3) pick it up automatically and serve HTTPS instead of HTTP whenever both files are present; option 8 generates or renews one by hand. `install_mes.bat` now runs it as step 7 of setup, and `_preflight.py` reports the certificate's presence and expiry.
- Self-signed means a one-time "not trusted" warning on each phone the first time it connects — expected, not a bug. An internal CA certificate can go in at the same two paths instead.
- Added `cryptography` to `requirements.txt` for the cert generation; I haven't pinned it to an exact version yet, since it's a brand-new dependency and there's no venv here to read the installed version off of.
- **Finding 6, unsigned update packages, closed.** `setup/update_signing.py` is the one place both `dev/make_update.py` and `setup/apply_update.py` now agree on what a signature covers. Every build signs its manifest with an Ed25519 private key (`dev/update_signing_private.pem`, never committed, created once with `dev/make_update.py --init-keys`); `apply_update.py` checks it against `setup/update_signing_public.pem` (committed — not a secret) right after the checksum check, and refuses the update, same as before, if it's missing or doesn't match. A checksum only ever proved a file arrived intact; this is what proves it actually came from me.
- `_preflight.py` now also reports whether `setup/update_signing_public.pem` is present.
- **Finding 7, plain-text gateway credentials, closed.** `gateway_crypto.py` encrypts `Device.connection_json` (MQTT/OPC-UA usernames and passwords, mainly) at the one boundary that ever touches it, `device_crud.py` — every page and protocol adapter still just hands over a plain `connection` dict and has no idea encryption exists underneath. The key lives in `.env` as `GATEWAY_ENCRYPTION_KEY`, generated automatically the first time any device is ever saved, so a plant that never touches the gateway never gets one. It reads a plain-JSON row from before this fix without complaint, so I had nothing to migrate — no devices were configured here yet anyway.

### Streamlit reruns the entire page on every input — mitigated on two spots on the operator screen, more to come

`Operator_Form.py` reruns top to bottom on every widget interaction, which is just how Streamlit works, but it got reported from the floor as a jarring wait after typing or tapping anything. Two changes so far, both picked because neither one has any live cross-widget behaviour that a rerun-per-keystroke was actually holding up:

- The Downtime tab's four fields are inside `st.form("downtime_form")` now — the page used to rerun on every character typed into "Corrective Action Taken"; it reruns once, when the button is pressed.
- The resin lookup quick-reference (added the same day, see below) is `@st.fragment`-wrapped — its search box reruns only that table, not the whole page.
- Deliberately left alone: the Pouring tab (live tank-changeover detection depends on an immediate rerun when station/resin are picked) and the Audit tab (the photo preview only works because the camera/upload widgets rerun live). Both need me actually standing there clicking through them right after the change, which is why they're not in this entry yet.

**Finding 9 — admin and manager PINs held to a longer minimum**

The security posture doc flagged four-digit PINs everywhere, admin included, as a floor trade that makes no sense for an account that reaches Admin Panel, the user roster, and database backup/restore — reachable from anywhere on the network, not just a pump. `crud.pin_policy_error(role, pin)` is the one place this gets decided now (6 characters minimum for `admin`/`manager`, 4 unchanged for `operator`/`packer`), and every path that sets a PIN checks it: `update_user_credentials` (self-service, all seven pages that use it), Admin Panel's "Provision New User" and "Reset User PIN", and `create_admin.py`'s emergency tool.

- Knock-on fix: both installers' own `CLEAN_START` step calls `create_admin.py manager admin "Plant Lead"` to guarantee the seeded login works (see the 9/11 entry below) — with the new rule in place that call would have failed its own check on every fresh install. Bootstrap PIN is `admin123` now in both `install_mes.bat` and `Setup_On_New_PC.bat`, in the command and in the printed "sign in with" instructions, and `seed_initial_data()`'s own direct-INSERT default (the one write that happens outside `create_user`/`update_user_credentials` and so isn't caught by the new check) got bumped to match.
- **Not retroactive.** My own live `manager` login was very likely seeded or reset with the old 4-character default at some point — I need to go into IT Admin → Account & Preferences myself and give it a real PIN of 6+ characters, since the new rule only stops a *short* PIN from being *set* going forward.

**Looked at and found already done: startup diagnostics**

Went looking for a gap in `setup/_preflight.py` — the idea being that testing the real Postgres connection at diagnose-time could have caught yesterday's password mismatch before it showed up as a raw traceback. Turned out `check_database()` already does exactly that, already has a specific "password authentication failed → wrong password in .env, re-run option 1" message, and `check_env()` already verifies `PG_BIN_DIR` points at a real `pg_dump.exe`. Nothing to add here — `START_HERE.bat` → 5 already catches both of today's failure modes.

**Looked at and set aside: idle session timeout**

Also on my "what to do next" list off the security doc. Turns out to need more than a quick add: a new `last_seen_at` column (schema migration), and — the real complication — `utils.check_authentication()` currently short-circuits the moment a browser tab is already authenticated, so it never re-touches the database or re-checks anything for the rest of that tab's life. Making idle timeout actually work means changing that short-circuit to periodically re-validate, which is auth code every single page depends on. That risk profile is closer to the Pouring tab than to anything else done today, so I'm holding it for its own careful pass with live testing rather than bundling it in here.

**The SCADA volume card only knew about two cartridge types**

Reported from the floor: the Volume Output card on the SCADA terminal (`Home.py`) read "0 V2 | 0 RPS" style subtext no matter what actually ran, because it kept exactly two counters — one for anything containing "RPS", and everything else (unless it said "Pigment") went into the V2 counter, whether it was V2 or not. A day that poured entirely V1, like today, was silently counted and displayed as V2; a bulk drum pour would have been too; Pigment pours were dropped from the subtext entirely even though they were still in the liters total above it.

- Replaced the two hardcoded counters with a `cart_type_counts` dict keyed by whatever `cartridge_type` the row actually carries, and the subtext now lists every type that was poured, busiest first, instead of a fixed "V2 | RPS" pair. A future cartridge format added in Mgr_Resin_Canvas needs no change here to show up on this card.

**Also looked at: the startup checklist asking twice on old pumps**

Reported alongside it: going to an "old pump" sometimes re-asks the startup checklist even though another operator already cleared it today, and sometimes doesn't ask at all at a pump nobody has touched. `has_completed_daily_checklist`/`submit_daily_checklist` in `crud.py` are keyed on `(operator_name, shift, pump_station)`, and `pump_station` is a name in the `PumpStation` table — that part is working as designed (Section 4/5 of the security posture doc covers the per-pump intent). The twenty old pumps don't have that many distinct rows in `PumpStation` yet — we haven't figured out a label system for them — so two different physical pumps can resolve to the same station name, or the same name inconsistently, and that reads exactly like "sometimes already done, sometimes not." Not a code fix: every old pump needs adding as its own named station under IT Admin → Master Plant Equipment & Configuration → Pump Stations, the same way the three new pumps are set up.

- **Temporary override added, pending that.** The startup checklist gate (`Operator_Form.py`) now has a "this pump was already checked today" expander above Step 1: an operator can type who actually did it and unlock the terminal without redoing the photo and boxes. It records as a `CleanlinessAudit` row (audit type "Startup Checklist — marked already done (pump not yet labeled)") naming who unlocked it and who they say already did the work, so it shows up on Mgr_Cleanliness same as any other audit. Meant to come back out once the old pumps each have their own station name and the per-pump gate can be trusted on its own.

**`Setup_On_New_PC.bat` was broken, and wasn't installing PostgreSQL either**

Reported as "moving to another work PC has been a struggle." Opened the script and found why: an earlier edit had left it with a stray pair of unmatched `)` right after the `:launch` label, followed by an entire second, slightly different copy of the database-restore-and-schema steps and a second `:launch` label. In `cmd.exe` a bare `)` outside of an open block is a syntax error, so the script broke immediately after building the schema on every run, before it ever reached the point of restoring data or launching the app.

- Rewrote it as one clean flow instead of patching around the break. It also used to only *check* for PostgreSQL and stop with manual download instructions if missing, unlike `install_mes.bat`, which offers to install it automatically with winget — so a work PC without Postgres already on it needed a separate manual install before this script could do anything. It now calls the same `setup\_ensure_python.bat`, `setup\_ensure_postgres.bat` and `setup\_configure_env.py` that `install_mes.bat` uses, so both installers install Python and PostgreSQL the same way, ask for the Postgres login the same way and verify the connection before continuing, instead of two scripts that can quietly drift apart the way this one just had.
- Folded in the `verify_restore` row-count check that the broken duplicate section had been trying to add — it was a real feature, just wired in wrong. A restore now confirms the row counts match the backup's manifest before I call the database good, rather than only checking that `pg_restore` didn't error.
- Net effect: `Move_To_New_PC.bat` on the old PC, copy the one zip it produces to the new PC, unzip, run `Setup_On_New_PC.bat` — Python, PostgreSQL, the database, the restored data and the HTTPS certificate are all handled by that one script now, same as a from-scratch install with `install_mes.bat`.

**Two more from testing that install on a real machine: wrong Postgres version, and a login that wasn't guaranteed**

- **`_ensure_postgres.bat` installed PostgreSQL 17.** Every other PC here runs 18 — it's what `database.py` and the security posture doc both assume — so a fresh install landed a version behind everything else, including any backup taken from an 18 machine (an older server can't read a newer one's dump; see Finding in `check_dump_compat`). It installs 18 first now, falls back to winget's unversioned id, and only then to 17 as a last resort, so an install always ends up current unless nothing newer is available at all.
- **The seeded `manager`/admin login wasn't guaranteed.** `seed_initial_data()` only creates the `manager` account when the users table is completely empty, which should always be true on a clean install — but I still needed `create_admin.py` by hand to get into this one. Rather than chase why that one run's seeding didn't take, both installers now call `create_admin.py manager admin "Plant Lead"` right after the schema step, but **only when `CLEAN_START` is set** — never on a restore or a re-run, so a plant's real admin password is never silently reset. `create_admin.py` itself gained a non-interactive form (`create_admin.py <username> <pin> <full name> [email]`) so the installers can call it without anybody typing at a prompt; run with no arguments, it still asks interactively exactly as before, for using by hand as an emergency reset.

**Two more from moving to another PC, once it could actually get that far: a `pg_dump` that couldn't find itself, and a password Postgres no longer had**

- **`utils.py`'s `_get_pg_bin()` trusted a broken `PG_BIN_DIR` forever.** A reinstalled Postgres had left `.env`'s `PG_BIN_DIR` as `'C:\\Program Files\\PostgreSQL\\18\\bin'` — literal doubled backslashes and stray quotes, not a real path, since `.env` doesn't interpret `\\` as an escape. `_get_pg_bin()` returned that value unconditionally with no check that it pointed at anything real, so every backup failed with a bare `WinError 2` and nothing that explained why. It checks the file actually exists before trusting `PG_BIN_DIR` now, and falls back to re-detecting PostgreSQL (same scan `install_mes.bat` uses) when it doesn't — a bad value heals itself the next time anything touches the database instead of staying broken until I find this exact line again. The auto-detect path also persists with forward slashes now rather than `os.path.dirname()`'s native backslashes, since a persisted backslash path is exactly what `set_key()`'s quoting mangled in the first place.
- **Password authentication failed after the same Postgres reinstall.** Straightforward once found: reinstalling Postgres set a new password for the `postgres` role, and `.env`'s `DB_URL`/`PG_PASS` still had the old one. No code fix — just `setup/_configure_env.py mes` (or a manual `.env` edit) run again with the current password.

**Finding 11 — the resin lookup panel operators use mid-pour had no access check at all**

Section 8 of the security posture doc flagged this as the one open finding that actually exposes confidential information rather than an operational number: any signed-in account, any role, could open the "Master Resin Specification Lookup" expander on the operator screen (`Operator_Form.py`) and see — and, via `st.dataframe`'s own built-in toolbar, one-click export — the entire resin table, SKUs and internal codes included, for formulations that aren't even released yet.

- Added a new ability, `view_resin_lookup` (`crud.py`), granted to every role by default — operator and packer included, since checking a target weight mid-pour is the actual job and taking that away would break it. What changed is that it's a real, named door now rather than "anyone signed in", the same way every other screen in the app already works.
- The operator's quick-reference panel no longer shows the SKU or internal resin code — only what a pour is actually checked against: container format, resin name, target/min/max weight and the kg conversion. It's a plain HTML table now (the same pattern `Mgr_Resin_Canvas.py` already used for its own table) instead of `st.dataframe`, so there's no built-in export button to click.
- The full table, SKUs included, along with add/edit/delete, stays exactly where it already was — the manager-only Resin Canvas page, behind `manage_resins`, unchanged.

---

## 3.17 — Wednesday, September 9, 2026
**The day before test day**

Ten releases that day, folded into this one entry and sorted by subject rather than by the order they shipped in.

### Going over the documents before test day

My lead told me tomorrow is test day, so I read the handbook, the operator guide and the one-pager against what the app actually does now. Some of it was out of date and some of it was wrong.

**The documents**

- **The operator guide covers the measured pour properly.** It still called it Drum / Tote, and it did not mention the question about where the resin came from.
- **What happens after you submit** was written before the five-second block and before the confirmation moved to the bottom of the phone screen. Both are described now.
- **The guide says the form remembers your station, format and resin**, and that the question mark on the form opens the guide itself.
- **The checklist step mentions the vessel question** — which supply vessel the pump draws from, asked once per pump.
- **The handbook said the Device Gateway screen was unlinked and unreachable.** That has not been true since the switch went in.
- **The handbook role table said operators get the SCADA page.** They have not since Monday.
- **The plant settings section lists the switches** an administrator actually has, including measured pours and the gateway.
- **The test figures were from ten migrations ago.** Eighteen migrations, twenty suites, 1,543 assertions.
- **Rate is in the one-pager now.** Litres an hour against target, next to units and scrap, because pace is part of what the record is for.

**Pages that were quietly cutting themselves off**

Every page in those documents is a fixed sheet with the overflow hidden, so anything that does not fit is painted over the footer and cut. Six pages were doing it, and two of them were doing it before I touched anything — one had been cutting the end off its own note in the copy I was going to hand over.

- Six pages fixed, and all three documents rebuilt.
- **A checker that measures it.** `dev/check_page_fit.py` opens each document and asks every page whether its content is taller than the page. Run it before rebuilding the PDFs. It is how the two I did not cause were found.

**One thing in the app**

- **The operator nav had a Live SCADA link that bounces.** The page is manager and admin only now and sends an operator straight back to the form, so the link went. The sidebar was narrowed when that changed and this bar was missed.

### The dashboard link that was still there in four places

I fixed this yesterday and I only fixed one of them. Running today I still had Live SCADA on the operator form's side menu, and on the reactor screen it was on the top bar and in the side menu as well. The top bar of the form was the one I had fixed, so the two bars on the same screen disagreed with each other, which is worse than not having started.

The cause is that the list of pages is written out by hand in six navigation bars, and the rule about who gets the dashboard lived somewhere else again. Change one and the other five carry on as they were.

- **One function decides it now.** `can_view_scada`. The door on the SCADA page asks it, and so does every navigation bar. A link that gets drawn is a page that opens.
- **The four bars that still offered it don't.** Operator form side menu, reactor screen top bar and side menu, and the wall display's bar.
- **The reactor screen's side menu was listing every page to everybody** and leaving each page to refuse them at the door. An operator standing there was offered five links and could open two.
- **A test that fails if it happens again.** Every link to the SCADA page has to sit inside a branch that checked who is looking, or the navigation suite fails and names the file and line.

**And that test found a real hole**

Analytics Hub had no door on it at all. It came off the operator's menu when I narrowed their navigation, and that was the whole of it — the address still worked, so any signed-in operator who typed it or was sent the link saw the plant's full analytics. The handbook says operators do not have analytics. Now they do not.

- **Analytics Hub refuses anyone who is not a manager or an admin**, the same way the Manager Cockpit already did.
- The roles suite now checks both pages have that door, not just that the menu is right.

### A manager can give one person extra abilities

A role is a starting point, not a description of a person. I am a floor operator and I built this, so I need screens no operator needs, and the answer to that should not be to hand me a manager account and have every report count me as one. Somebody else will end up in the same spot.

- **IT Admin, Personnel, Extra Abilities.** Pick a person, tick what they can also do. Their role does not change. An operator with the plant dashboard still logs as an operator and still shows up as one everywhere.
- **Eight abilities to hand out.** See the plant dashboard. See the analytics hub. See the manager cockpit and its reports. Add and edit reactors. Edit master resin specifications. Log management and bulk cleanup. Floor roster and PIN resets. Export and sync.
- **Each one is written for the person handing it out**, not for me. The tick box says what it lets somebody do.
- **Two rules that are enforced in the code, not just hidden on the screen.** You cannot give away an ability you do not have yourself, and only somebody who administers the plant can give anything at all.
- **Every grant is recorded** with who gave it and when, and a removed grant keeps its row with who removed it. That history is on the same screen, because the first question anybody asks about a permission is how somebody came to have it.
- Nothing is granted by the upgrade. Every account keeps exactly what its role gave it until somebody ticks a box.

**The reason it is built this way**

The bug I keep hitting is not a permission hole, it is the same rule written down in more than one place. The door on a page said one thing and six navigation bars said another, so a link would go on being offered after the page stopped accepting it.

- **One function answers now.** The door on the page asks it and so does the link that offers the page. A link you can see is a page that opens.
- **One menu.** Every navigation bar and every sidebar list in the app is drawn from a single definition. There were six copies of that list. A test fails if a seventh appears.
- Every management screen refuses on the ability, not on a role name. Thirteen doors, one rule.

### Updates arrive as one file I drop in a folder

Once this is on the floor I cannot patch it the way I do at home, and I am not running git on that PC. I would rather walk over with a USB stick. So: one file, one folder, one menu option.

- **START_HERE.bat, option 7: Apply an update.** Copy the zip into `updates\`, run it, type YES.
- **The thing on the stick is only files and a list of them.** No script in the package runs. The program that reads it is already on the PC, installed with the app. A USB stick that can run code on a plant PC is a different thing to one that carries files, and this is the second kind.
- **It checks the package before it touches anything.** Every file has a checksum. A half-copied stick looks exactly like a good one until you read them, and that is the failure I expect to actually have.
- **It refuses the wrong package.** One built for a different version, one already applied, or an older one going backwards. Each of those stops before anything is written.

**What it does before it changes a file**

- **Takes a database backup**, and stops if that fails. An update with no backup behind it is the one that cannot be undone.
- **Copies the whole project into `rollback\`** with the date on it.
- Leaves `.env`, `backups\`, `logs\`, `uploads\` and the virtual environment alone. Those belong to the machine, not to the release. A package that tries to write to any of them is refused.

**And it checks its own work**

After the files are in, it compiles every one of them and then starts the app, which is what runs any new migration. If that fails it puts the old version back on its own and says so. The worst case is that nothing changed, rather than a broken screen and me standing there with a USB stick.

- Files a release removes are removed here too. One left behind still shows in the menu and still opens.
- New Python packages install from the bundled wheels first, the internet second, and roll the update back if neither works.
- Every run is written to `logs\updates.log`, and the package is moved to `updates\applied\` so the same one cannot be run twice.

On my side `dev/make_update.py` builds the zip from whatever changed since the version on the plant PC.

### A tank sets itself up from what the operator already types

I added a reactor in IT Admin and the level still did not move. I had to go back in as a manager and set the pump and the resin on it by hand. That is the exact thing the 3.16 entry was meant to end.

Three holes in it.

- **The startup checklist only offered tanks with no pump on them at all.** The checklist is asked once per day per station. Add a tank after that morning's checklist and there was no way to link it until the next one.
- **The pouring form was a dead end.** With no vessel on the station it printed a warning telling the operator to answer the startup checklist, which had already gone for the day.
- **A blank resin was treated as a changeover.** The form asked the operator to confirm that a tank had been changed over from nothing to something. There is only one sensible answer to that question, so it should not have been a question.

What it does now.

- **The same question is on the pouring form.** Any time the station has no tank on it, the operator picks one and links it, standing at the pump.
- **Tanks already on another pump are offered too**, labelled with where they are now. They used to be filtered out, so a tank plumbed to the wrong station could only be moved by a manager.
- **A blank tank fills itself in from the first log written at that pump.** The form says what it is about to record before you submit. A real changeover, where the tank already holds something else, still needs the tap.
- Adoption happens after the log is written rather than while the form is open. A resin picked and then corrected would otherwise be adopted on the way past.
- Retired and inactive vessels are out of both pickers.

Ten new checks in `tests/test_reactor_level.py` cover all three holes and the two cases that still have to refuse. One of those is two tanks on one pump, where which of them a pour came out of is the thing the app genuinely cannot work out.

Also `dev/run_tests.py`. The test scripts wanted `pgserver`, which only builds on Linux and macOS, so on this machine every one of them died before it ran a single check. It reads the address out of `.env`, points a scratch database at the same server, and runs whichever script you name.

### QC times, and how long resin sits in a reactor

My manager asked when resin goes to QC, how long it is there, when it comes out, and how long it sits in the reactor. All four are durations, and a duration needs two ends. The tank level is worked out from the logs every time somebody looks, so there was nothing to measure between and nothing to hang a QC result on.

A filling of a vessel is a record now. It opens when a vessel is changed over and closes at the next changeover or when somebody marks it empty.

- **The reactor half needs nothing typed.** The clock starts at the changeover, which operators already confirm at the pump.
- **Every vessel already holding something got a filling** when this went in, dated from its last changeover in the log. Where the log cannot say, it reads unknown rather than guessing at today.
- **The reactor page shows the age on each tank**, next to the level, and a QC panel for anyone with the new ability.
- **Both QC times are typed, not stamped.** The result comes back long before anybody is near a screen. A result timed before the sample went out is refused, and so is a result with no time on it.
- **The pouring form says when the tank is out at QC, on hold or failed.** It never blocks. A gap in somebody's paperwork should not stop a pour.
- **Batch History and QC Turnaround** in the cockpit: average turnaround, average time in a vessel, what is out at QC right now with the oldest first, and a CSV download.
- Recording QC is its own ability, so a lead can have it without being made a manager.

The page says plainly that QC times are hand entered. A turnaround figure built from when somebody got to a screen measures data entry, not QC.

### Two lines of work merged, and a test that was writing to the live database

Two sessions built releases the same day and both numbered a migration 0020. Two migrations with the same parent gives the database two heads and it stops migrating at all, so the batch one is 0021 now and follows the pump rates.

- **Eight test files only said `import _boot`** and never called it, with a comment claiming a test run can never touch production. DB_URL stayed on whatever `.env` said, which on this PC is the live database. Importing `_boot` now points it at the throwaway one on its own.
- **requirements.txt lists the versions actually installed here.** It pinned `numpy==2.5.2`, which needs Python 3.12, and this PC runs 3.11 with 2.4.6. A fresh install died on that line, and the offline package bundle came out empty. Ten unused Google API packages went with it.
- **Diagnose this PC checks the two documents are present**, and IT Admin links the update guide.

### One place to register a vessel

The reactor fleet is off the Master Plant Equipment section in IT Admin. It lives on the Live Reactors page, which is where I actually go.

Both screens could add and delete a tank. The reactor page does more. It sets the vessel type, which the fleet wall draws and which the IT Admin form never asked for, so a tank added there had its shape guessed from its capacity band. It also edits the pump and the resin after the tank exists, which the IT Admin form could only do at the moment of creation.

- IT Admin is pump stations and downtime codes now. Two columns instead of three, with a link across to the reactor page.
- Nobody loses anything. Adding and editing reactors is one ability and both administrators and managers hold it, so anyone who could open that section can already open the fleet expander.

### What the plant is expected to pour, worked out instead of typed

One number for the whole floor. Four hundred litres an hour, times however long the shift had been running, and that was every pace figure in the application. It cannot be right two days running. A day with one pourer read sixty per cent behind and a day with three read comfortably ahead, and the only lever anybody had was to retype the number, which then had to be retyped tomorrow.

Two different things were sitting inside that one figure. How fast a pump goes, which does not change from one day to the next, and how many pumps are running, which changes every shift.

- **The rate is on the pump now** (migration 0020). Set once when a pump is installed or rebuilt. An old pump expects less than a new one and it stays that way without anybody thinking about it.
- **Expected output is the pumps that were actually certified for the shift**, each at its own rate, for the hours it has been certified. One pourer expects one pump's worth. Three expects three. Nothing gets typed.
- **The hours come off the startup checklist, not off the pouring logs.** Taken from the logs, a station that poured nothing would be expected to pour nothing and the target would slide down to meet the output. Certifying a pump is a statement that it is running and it happens before a drop is poured, so a pump that goes quiet after being certified is still counted against the shift.
- **Logged downtime comes off.** A pump down for a changeover or a fault is not held against pace. That is also the first thing that has ever made logging downtime worth an operator's time.
- **IT Admin shows what each pump has actually run at.** A median over its recent shifts with the number of shifts behind it, next to what its target says, and a button to take the measured figure. Management reviews a number the floor produced rather than inventing one. A pump with fewer than three shifts on record is left out entirely.
- Every pump was seeded from the plant's own figure on the day this shipped, read out of the settings rather than written into the migration, so nothing moved. A pump nobody has set still uses it, and a shift with nothing certified falls back to the old arithmetic, so every day before this reads the way it always did.
- The old global field is relabelled as the fallback rate, because that is all it is now.

Three things I decided against. Dividing the plant target by how many people are pouring, since two on old pumps and two on new pumps are not the same expectation. Letting the target follow recent output, because a target that moves to meet the output can never be missed. And putting the rate on the operator instead of the pump. There is a `target_lph` column on the user record that nothing has ever read, and it stays dead. A rate against somebody's name changes what the wall leaderboard is for, and that is a decision about how the floor is run rather than a dashboard setting.

New `pace.py`, and `tests/test_pace.py` covering all of it, including the case where a certified pump pours nothing and is still expected to have poured.

### The wall display

Four things, and two of them had been wrong since I built it.

**The cards were not wrapping anything.** Three of them opened a card in one `st.markdown` call and closed it in another. Streamlit closes unbalanced HTML inside each call, so what I actually had was an empty bordered box with the contents sitting loose underneath it. Live Run Velocity, Top Pourers and Active Reactor Work Orders. All three are built as one string and drawn in one call now.

- `tests/test_card_markup.py` reads the source and fails if any page splits a card across two calls again. It needs no database. It found six more of the same fault, four in `Home.py` including the SCADA leaderboard and two on the cleanliness page. They are recorded there as a known list with counts, so nothing new can appear and the numbers only go down.

**A second Top Pourers card underneath the first, dimmed, with the previous run's numbers on it.** Streamlit lines up what it has already drawn against the new run position by position, and three blocks on this page came and went between runs. The arrival sweep, which stops after the second render. The stopped-record band. The finished-shift band. Each one that vanished shifted everything below it up a slot, and what fell off the end was the leaderboard. All three draw on every pass now, empty when there is nothing to put in them.

**The leaderboard was reading the whole day while every card above it read the active shift.** So the wall could say the plant had poured nothing and that a named person was pouring 353 litres an hour, at the same time, a hand's width apart. It divided by the shift clock as well, so the rate was a day of litres over a shift of hours and belonged to neither. Every card reads the same slice now. Unpacked floor work in progress stays a whole-day figure on purpose and says so on the card.

**The gauge is gone.** It was the only object on that wall drawn by a chart library, so it turned up with its own fonts and a red and olive and green arc that matched nothing else on the screen, and it spent a third of the width printing one number the card beside it already carried. Pace sits on the volume card now, as a rate and as how far ahead or behind in litres, green when ahead and amber or red when not, with a bar under it. Volume took the width back.

- The leaderboard is ranked rows with a bar under each name sized against the fastest, and larger type. It reads from across the floor.
- **No bar across the top of this page.** A row of page links is not something anybody presses from the far end of a plant. The same menu is in the sidebar, drawn from the same shared definition, so this page still cannot drift from what the abilities allow.
---


## 3.16 — Tuesday, September 8, 2026
**Everything the first real shift turned up**

Eleven releases that day. Nearly all of it came out of watching the app get used for real instead of me testing it at home. One heading, sorted by subject.

### Eleven manager pages refused a refresh

Scrap Intelligence, Historical, Log Management, Assigned Runs, Lot Verification, Cleanliness, Resin Canvas, Roster, Google Sync, Floor Comms and the Theme Gallery all checked your role before restoring your session. On a cold load there is no session yet, so all eleven answered Access Denied to a manager with every right to be there.

Press F5 on any of them and you were locked out. Same for a bookmark, or a link opened in a new tab. It only ever looked fine because arriving from another page carries the session in memory, and the one thing nobody does while testing is refresh.

- All eleven restore the session first now.
- I found it by accident. Five figures in the handbook turned out to be screenshots of the Access Denied message, taken by a script that only knew how to spot the login screen.
- That script now checks for text unique to the page before it writes anything.

Still open: Analytics Hub and IT Admin come back as an empty shell when opened by URL. They restore the session properly, so it is something else. Clicking through to them works, which is why nobody has hit it.

### Two from the first day of real use

**A tank could not be linked to anything.** I created a reactor in IT Admin and the level never moved. It turns out a vessel's level is worked out from the logs matching its pump and its resin, and the only code that ever set those two fields was work-order dispatch. We run with work orders off. So the add form asked for a name and a capacity, nothing set the other two ever, and every tank sat at full while the floor emptied it.

- The add form asks for the pump, the resin, the asset tag and the bay marker now, and says what happens if you leave the first two blank.
- `update_reactor_config` had been written months ago and imported into the reactor page. Nothing ever called it. There is a control for it now, so a tank already created can be linked without deleting it.
- **The pouring form says which vessel it thinks you are drawing from.** "Drawing from M-205 · bay E2". Nobody picks it, it comes off the station and the resin. If nothing matches it says so, and if two tanks match it says that instead of guessing. Your log records either way.

**The confirmation was drawing where you could not see it.** It goes at the top of the page and the form is four phone screens tall, so after submitting you were at the bottom looking at nothing and scrolling up every hour to check the entry saved. Which is the thing the banner exists to stop you doing.

- On a phone it is pinned to the bottom of the screen now, where the thumb already is. On anything wider it stays where it was.

### The submit button goes away for five seconds after a log lands

On the run where the confirmation was not showing up, I kept pressing Submit because I could not tell whether anything had happened. Every one of those presses wrote a real log with a real photo attached. Nothing looked wrong afterwards, which is the problem with a duplicate hourly count.

The banner is fixed and it sits at the bottom of the screen on a phone now. This is the second answer to the same question, and it is in the one place I am definitely looking after I press Submit.

- **For five seconds after a log saves, the button is not on the screen.** A green block stands where it was.
- **The block says what was recorded.** How many units of which resin, at which station, and the time. For a measured pour it says the litres and what they went into. It does not say "saved", because "saved" is the word I doubt when I cannot see the entry.
- **It counts itself down** so the screen does not look frozen, and the button comes back on its own.
- **Packing gets the same lock.** A packing count is as easy to send twice.
- Five seconds because a second press after that is a decision rather than a reflex, and because two real pours back to back should not leave anybody standing there waiting.

### The floor sets it up, not a manager

We run this as a logging system, so a manager opening a settings page to make the app work is a design fault. The operator already picks the pump and the resin every hour. The only thing missing was which physical tank the pump draws from, and that is not in any log.

- **The startup checklist asks which vessel this pump draws from.** One line, under the pump picker, where the operator is standing at the pump and can read the tag off the side of the tank. Asked only when that pump has no vessel on it yet. Answered once, never asked again, and the manager never touches it.
- **A resin change is confirmed at the pump.** Pick a resin the tank is not recorded as holding and the form says so: "M-311 is recorded as holding Op Set A, and you have picked Op Set B." One tap confirms the changeover. It is a tap rather than automatic because a changeover restarts that tank's level accounting, and a mis-picked resin doing that silently is worse than a question.
- The changeover is written down as its own row with no units on it, so it cannot move an output figure and the history says when a tank changed and who said so.

**The form opens where you left it** (migration 0016)

- Station, container format and resin are remembered and pre-filled. Twelve logs a shift and all three are the same every time.
- Remembered against the account, not the browser. A phone locking, a session dropping, a dead battery or a different handset are the normal cases on a floor, and a memory that lives in the tab survives none of them.
- The station is seeded before the checklist reads it. I had it in the wrong place first and an operator coming back would have been asked to redo the checklist for a pump they were not standing at.

The lot check is what protects all of this. A pre-filled resin is a box that already holds a plausible answer, but the lot number is still typed off the container every hour, and that is what actually catches the wrong material.

### Logging a pour into a container the app has never heard of

Today I poured out of a drum into brown 1L bottles. There is no SKU for those bottles and no spec on file, and the Container Format dropdown only offers things the app knows the size of, so there was no honest way to log it. I know how many bottles I filled and how much went in. That should be enough.

It nearly was. The measured-amount option already existed and does exactly this, and I scrolled past it, because it was called "Drum / Tote" and I was not filling a drum.

- **The option is called "Other container (measured amount)" now.** Same option, same stored code, nothing recorded under the old name needs touching. It asks for the amount in each container, the unit, how many, and a line saying what it went into in your own words. Nothing has to be registered and nothing has to match a list.
- **The container count goes to 999.** It stopped at 99, and a drum into 1L bottles is more than that, so one pour became three entries and a sum at the end of the shift.
- **The "Poured into" box says what it is for.** The placeholder used to list drums and totes only.

**Where the resin came from**

The bigger problem was quieter. Every log takes its litres off the tank on that station, because until now every log was a cartridge being filled from one. Resin poured out of a drum already left the tank, whenever that drum was filled. Charging the bottles to the tank as well takes the same litres off twice, and the wall display shows a vessel emptying that nobody has touched.

- **A measured pour asks where it came from.** The tank on this station, or a drum that was already filled.
- **An off-tank pour counts everywhere production is counted** and leaves the tank level alone. Your shift total, your own numbers, the run it belongs to, the exports, all the same. The level is the one reader that skips it.
- **The tank checks stop applying to it.** More litres than the vessel holds is not evidence of a typo when the pour did not come out of that vessel. The check that a number is not impossible stays.
- The form no longer prints "Drawing from RX-1" over a pour that did not come from RX-1.

Every log written before today is recorded as coming off the tank, which is what they were.

### The SCADA page was answering the question fifth

Six controls sat above every number on it: the time horizon, a date picker, then pump, resin, operator and shift. A manager opens that page to find out how the shift is going, and the first full screen was a control panel. The figures started below the fold.

Nobody touches those controls on most visits. Live Today, all pumps, all resins, all operators, all shifts is the question they came to ask. The filters are for an investigation that happens maybe one visit in ten.

- **The answer goes first.** One line at the top: how much has been poured this shift and whether that is ahead of or behind pace, with the shift, how far through it is, and what was expected by now underneath. You used to assemble that yourself out of four cards and a chart.
- **The six filters are one line and a closed drawer.** The line says what is applied. When anything is set away from its default it turns amber and says so outright, because reading filtered numbers without realising they are filtered is the one genuinely dangerous thing a dashboard can do to you.
- **The three-way view radio is gone.** Packing is a plant setting, not a view somebody picks. Its "Master" option showed exactly what the other two showed together, so it was three states and a decision in front of a page whose whole job is one glance.

The headline, the filter line and all four telemetry cards now fit above the fold on a 1400 px screen. Nothing was removed except the radio.

### Operators get one screen, and both documents are one tap away

Operators had the full SCADA page. Not the plant figures that bothered me — their own numbers are on their own form and the guide promises those are the same ones management sees. It is that the whole page is a management view: every station at once, every operator ranked by name, the plant's pace against target. That is the right screen for whoever is running the shift and the wrong one to have open at a pump, where the job in front of you is one station and one cartridge. Rate still matters, and the people who act on it still see it.

- The SCADA page is manager and admin only. An operator who lands on it is sent to their workstation.
- Their nav is two links instead of three.
- The sidebar menu is role-aware now. It used to list every page to everybody and let each page refuse them at the door, so an operator was offered five links and could open two.

**The documents**

- **A question mark, top right of the operator form.** Opens the eleven-page guide in its own tab, so nothing half-typed is lost. Small and grey — there when you want it, invisible when you do not. The guide, not the handbook: an operator has no use for the manager's document.
- **A grey line at the bottom of the manager menu** for the operations handbook. Deliberately not a button. It is something you go and find once.
- Both are served out of `static/`, and `dev/topdf.py` writes a copy there on every rebuild — otherwise the app would keep handing people last month's document with no sign that it had.
- A test now checks that every document the app links to actually exists where it serves it from, and is not an empty file. A help link that 404s is worse than no help link: it tells an operator the guide does not exist.

### The handbook link was only on two screens, and the machine gateway has a switch now

I added the handbook link and then could not find it. The operator guide showed up on the form the way it should, but the manager one was missing from every page I actually work on.

Six screens build their own sidebar menu instead of using the shared one. I wrote the link into the shared menu, so it landed on the SCADA page and the ten manager report pages and nowhere else. The Manager Cockpit, Analytics Hub, Live Reactors and IT Admin all missed it, and that is most of a manager's day.

- The link is one function now, called from all of them. One copy of it in the code instead of a snippet I paste and forget.
- A test checks it. If somebody builds a seventh sidebar and does not call it, that comes back as a failure instead of me hunting for a missing link again in a month.

**The machine gateway**

We built the gateway in August. It reads a bench scale or a pump controller and writes what it reads into the production log, the same way a typed entry goes in, so the reports and the reactor levels already understand it. It has never been connected to real equipment here, so I left the setup screen unlinked. You could only get to it by typing the address.

That was the wrong way to say "not yet". A plant that did want to wire something in had no way to find the screen or to know it existed.

- **A switch in Plant Settings.** Off unless somebody turns it on, under IT Admin with the rest of the plant switches.
- **When it is on the Device Gateway appears in the Manager Cockpit menu**, and in IT Admin. When it is off neither shows it.
- **The setup screen says where the switch is.** Open it with the gateway off and it tells you to turn it on in Plant Settings, instead of showing an empty registry that looks broken.
- That screen used to be administrators only while the menu it sits in is open to managers as well. Both use the same rule now, so nobody clicks a link and gets told they are not allowed.
- Turning the switch on registers nothing and polls nothing. The gateway process still has to be running and a device still has to be added by hand.

### A wall worth looking up at, and somewhere for a crash to go

- **The shift finishing is a moment now.** When the pour reaches the target a green band goes across the whole wall and the laser makes one last pass down the finished cartridge. It holds about twenty-five seconds. Second shift gets its own.
- My first version faded itself out after seven seconds. The timer starts when the browser inserts the element, not when the frame reaches the screen, so on a display nobody is standing at it could hit zero opacity having never been seen. The next refresh takes it away now.
- **The big numbers roll instead of snapping.** Volume poured, units packed, floor WIP. Digits roll, the comma stays put, and nothing moves at all when the figure has not changed.
- **The reactors look like tanks now.** Curved liquid surface with a highlight on it, a sheen down one side, and the level glides to its new height. The tote stays flat. It is a square bottle.
- At 99.7% the build card said "LAYER 46 / 46". The last layer belongs to the finished build.

**The database connection**

- `pool_pre_ping`. After a network blip or a Postgres restart the pool hands out connections that are already dead, and the page errors for a fault that had already fixed itself. It tests one before giving it out now.
- Connections retire at thirty minutes. Plant networks drop idle ones quietly.
- Fifteen simultaneous queries to thirty. Postgres allows a hundred, so the app was the narrow part.

**When a page breaks**

- **Crash reports.** A page that failed used to give whoever was standing there a red box and leave the detail in a log file nobody opens. Now it is caught and filed with the page, the account, the version and the traceback, and the person gets a code to read out. New tab in IT Admin.
- One row per kind of fault, not per occurrence. A page failing every ten seconds all afternoon would bury everything else.
- Tracebacks are redacted going in. A connection failure prints the database URL and the URL has the password in it.
- **It is not an auto-fix.** There is no such thing. A total adding up wrong looks exactly like one adding up right from the inside. What the app can repair on its own it already does: the schema, a stale backup, a dead connection. The rest needs a person, so what is worth automating is telling that person.

**How it looks**

- **The Analytics header was stacking on top of itself on a phone.** Fixed 2.2rem heading, a logo and a badge in a row, none of it allowed to wrap, 120 px to fit it in. Every page title is `clamp()` sized now and the badges drop onto their own line.
- **One type scale.** Five sizes, two weights, one 8 px step. These had grown page by page as raw HTML and drifted a few pixels apart. Nobody can name what is wrong with that, they just feel it.
- **One rhythm for movement.** It was 0.2s, 0.3s, 0.5s, 0.75s, 0.9s, 1s, 1.2s or 2.6s depending on the day I wrote it. Three durations and one curve now.
- **A proper icon and name on a phone.** Saved to a home screen it used to be a browser glyph and a chopped-off address. It is the Formlabs mark and **Pouring Log** now. Operators see that every shift before they open anything.

### The sign-in laser was striking twice

Reported as a double glitch, and that is exactly what it was. The screen renders, the cookie component answers a moment later with what it found, and that answer re-runs the script. So the laser started, got about a third of the way down, and was replaced by a fresh one starting from the top. Two half-strokes.

- The stroke waits 1.4 seconds before it starts, which is longer than the cookie takes to come back. The first render's laser is still sitting in its delay when the second replaces it, so only one of them is ever seen moving.
- It is only asked for on the first two renders. From then on the machine is drawn without it, so typing a PIN or ticking the box does not set it off again.
- The machine occupies the same space either way, so nothing on the screen nudges at the moment the laser stops.

Measured rather than eyeballed: sampling the laser's position every 150 ms, it holds still, then runs top to bottom once, with no upward jumps.

### More of the thing the sign-in screen does

The move people liked is an object revealed once as the screen arrives, and then stillness. It only works where there is a real arrival, so it went on the three screens that have one and nowhere else.

- **The wall display prints itself in.** One laser pass down the whole board when it first opens. Checked in a browser across three refresh cycles: it appears once and does not come back.
- **The fleet reads in.** Every tank fills from empty to what it actually holds, then holds still. It reuses the glide that was already there. A browser that will not animate an SVG level just draws the level, which is the right answer anyway.
- **The terminal comes to life.** Clear the startup checklist and the laser passes down the form as the tabs unlock. Once a shift, at the moment something actually changed.
- **The finished part lifts off the plate.** At BUILD COMPLETE the cartridge rises and its shadow deepens, the way you take a print off. It happens inside the twenty-five seconds the band is already up.

Every one of them plays once and then stops. The wall re-runs every ten seconds and the reactor page re-runs whenever somebody touches a control on it, so a sweep on every render would not be an effect, it would be a fault nobody could switch off.

Nothing went on Analytics or the Cockpit. A sweep works because it is rare, and a screen somebody is trying to read quickly is the wrong place to put a second of theatre.

---


## 3.15 — Monday, September 7, 2026
**The last day before the floor test**

Nine releases that day, put under one heading and sorted by subject rather than by the order they shipped in.

### Making it look like a 3D printing company's app

We print things for a living and the software did not show it anywhere. None of this changed how anything gets recorded.

- **The wall display builds a resin cartridge as the shift pours.** It fills from the bottom as output climbs toward the shift target, with layer lines on the part that is done and the laser sitting on the layer being written. There is no number to read. You can see how the shift is going from the far side of the floor.
- Nothing on it loops. The page reloads itself every ten seconds, so a repeating animation would restart mid-cycle every time and look like a fault. The height is a value that slides when the number actually changes and sits still when it does not. If it moves, something happened.
- Progress bars are laid down in slices now instead of one solid block. Same reading, and it looks like ours.
- The sign-in screen leads with a Form 4 and a laser passes over it once as the page loads. Once, not looping.
- All the pictures are our own product renders. Nothing in here draws a Formlabs machine, it just positions and reveals the real ones.

### Pouring an amount instead of counting containers

The record could only say how many containers got filled and then multiply by a fixed size. That is right for cartridges and jugs and wrong for anything decanted. There was no way to write down "we put 180 litres into a drum". So it went in as the wrong number of cartridges, or it did not go in at all. Either way the tank it came out of was wrong from then on.

- New container format, **Drum / Tote**, that takes an amount in litres or kilograms. The container count is still there as a small box that defaults to 1, because three identical drums off one tank is one thing that happened and I do not want anyone writing it three times.
- Converting kilograms needs a density, and the density was already sitting in the spec table without being called that. 1,110 g in a 1 litre cartridge and 5,550 g in a 5 litre jug are the same 1.11 kg per litre. The screen tells you what the amount works out to before you submit. You know you poured 200 kg. That it is 180 litres is the app's claim, so it should say so.
- **The amount gets checked against the tank.** Nobody types 2,500 cartridges and believes it, so a container count checks itself. But 1800 typed instead of 180 looks completely normal, and you find out an hour later when the vessel reads empty on the wall. More than the tank holds is blocked. More than the record thinks is left is only a warning, because a tank topped up before the new lot got logged really can give out more than the record says.
- Off by default. Until you switch it on, the container list has the same four entries it always had.
- One definition of what a log row is worth now feeds the tank levels, the shift totals, the wall display and the exports. A drum counted by one screen and not another gives you two believable numbers and no way to tell which one is wrong.

One bug caught before it shipped. The form picked its format by matching text, and "RPS (5L Bulk Jug)" has the word "Bulk" in it. Adding the drum option quietly turned every 5 litre jug into a measured pour and stopped lot-checking them. All 69 of the new sums passed while that was broken. The interface tests caught it.

### The Google export, which took me four goes

It was broken because the destination was one line in a settings file, and that line was not set on this install at all. So the page could only ever say "webhook missing", and the fix lived on the server where nobody standing at the page could get to it.

- **Anyone can link their own spreadsheet now.** Name it, paste the address, choose whether other managers can send to it. Yours stays private unless you share it.
- A Google Sheet link cannot receive rows. It is a document and it has no inbox. The sheet needs a small script published as a web app, and that address is the one that goes in the box. Everyone pastes the spreadsheet link first because that is the link they have, so the page spots it, says why it will not work, and hands over the four steps and the script.
- **A success code is not proof anything arrived.** A web app that is not published for everyone answers with a sign-in page and a success code. The export would have told me it sent several hundred records into a login form. Every reply from the script is signed now and only that signature counts.
- **The page was also telling me how many rows it sent, not how many arrived.** Those are two different things and I was printing the wrong one. A payload that reached the script and did nothing still came back looking fine. The script now reports what it actually wrote, read back off the sheet, and names the spreadsheet it answered from with a link. That link is the only thing that would show rows landing in the wrong sheet.
- The script stamps its own version on every reply. The usual way this breaks is a deployment still running last week's code, because saving the script editor publishes nothing and Google never mentions it.
- **Then a 401 that no setting could fix.** A work Google account belongs to a company Workspace, and Workspace admins normally forbid publishing a web app where anyone can reach it. So the page leads with **Excel and CSV downloads** now. No account, nothing to publish, nobody's permission to ask for, and the file opens straight into Sheets or Excel. It sits above the push because it is the one that cannot fail.
- The time period picker never did anything. All four options exported every log ever recorded, so "Live Today" on two years of history sent two years of history. It filters now, and the row count is printed above the button.
- One more of mine. Excel needs a package that was not installed here, and the download button builds its file while the page loads rather than when you press it. So the missing package did not fail a download, it took the whole page down. It only showed up once a wider date range gave the button some rows to work with. Something that only breaks once there is data in it will pass every check you make while writing it. CSV needs nothing, so that one is always there.

### Two things quietly doing nothing

**The messaging tab was promising somebody was listening.** Nothing in this app tells a manager a message has arrived. Not the home screen, not the sidebar, not the wall display. A manager sat at the PC all day would never know. But it was called "Direct Manager Communications", drawn like a chat, and sitting on the operator's screen. An operator typing "pump 2 is leaking" and going back to work thinking it was reported is the app swallowing something urgent. The data settles it, four messages ever, all from my account, all saying "test". It is called **Note to Management** now and says before you type that nobody is watching it live and to use the radio for anything urgent. I deleted nothing. Whether it earns a proper alert should come out of whether anyone uses it during testing.

**Log Out looked like it did nothing.** It was revoking the session and clearing the cookie fine, but the signed-in screen stayed up until you hit refresh, so an operator handing a phone to the next shift had no way to know the account was actually signed out. Writing a cookie makes the browser reload the page, so the line after it never ran, and that line was the one that forgot who was signed in. I swapped the order. Nine logout buttons also had a line after "go to the home page" that could never run.

### Weekends, and phones

- **The stopped-record alarm did not know it was Saturday.** It asks the shift clock whether a shift is running, and the clock only knew what time it was. Every day looked like a working day, so Saturday at six in the morning read as Shift 1 running with nothing logged, and the wall put up an alarm about a weekend. Every week. If it fires when nothing is wrong then by Monday nobody reads it. There are seven checkboxes under IT Admin now for the days the plant runs. A shift counts by the day it starts, so a Friday night shift is still watched into Saturday morning. It defaults to every day, so I need one visit to IT Admin to switch the weekend off.
- **Half the operator form was off the side of the phone.** I measured it at 390 px wide. The four tab labels wanted 642 px of room and had 358, so only two of them were visible. The other two sat off the right edge behind a scroll nobody finds. They are Pouring, Downtime, Audit and Notes now, and all four fit.
- Three other things I measured on a phone and left alone until real operators have used it. The form is four phone screens tall with Submit two screens down. Tap targets are under the recommended size unless glove mode is on. And the startup checklist asks for camera permission first thing every morning.

---


## 3.14 — Sunday, September 6, 2026
**The app running somewhere I am not standing**

Two releases that day. Both are about the app looking after itself on a machine nobody is watching.

### Two things failing where nobody is looking

- **Backups happen on their own now.** The backup function always worked, but nothing ran it on a schedule, so whether the data was protected came down to whoever last pressed the button. There is no scheduler on a floor PC, so the check rides on the app being opened. If the newest backup is over twenty hours old, take one. The last fortnight is kept, because a full disk is the same outage backups exist to survive.
- IT Admin shows the state. Green with the age of the newest backup, orange when it is days old, red when there has never been one. A section with nothing but a button on it does not tell a manager whether the plant is protected.
- The clean-up only deletes files matching this app's own naming, so a payroll spreadsheet left in that folder is safe.
- **The app notices when nothing is being logged.** The usual failure here is not corrupted data. The PC reboots and the database does not come back, or the app gets closed and nobody reopens it. Every figure still looks normal, because they are all worked out from the log and the last good hour is still the last good hour. The floor finds out when somebody tries to log. Management finds out weeks later. After about three hours with nothing logged during a running shift, the SCADA page says so at the top and the wall display carries a band the size of the wall.
- Silence outside shift hours is not treated as a fault, and a shift that has just started does not get blamed for last night's gap.

Two bugs caught in that work before it shipped. A backup dated in the future was treated as brand new, which would have stopped every real backup until the clock caught up. And the freshness check compared a timestamp with no time zone against one with a time zone, which crashed the home page. Getting that one wrong the other way would have been worse, because the sum would have worked, every log would have read four hours old, and the alarm would have fired all day.

Also deleted some dead code. `Home.py` still carried its own add- and delete-reactor functions, which did not know about vessel type, asset tag or bay marker. Anyone wiring them up would have created half-configured vessels. And the shift clock moved out of a page into `shift_clock.py`, because the wall display needed to know whether a shift was running and the only correct answer lived inside a page.

### Getting the app ready to be carried onto the floor, and moved twice

Testing starts next week. A laptop on the floor first, then a permanent PC. That is two moves, and the second one carries real production data.

- New `Check_This_PC.bat`. One page saying whether a machine is ready to run the plant, and if not, exactly what to type. Python and every package, the database reachable and at the right version, disk space, and port 8501 free. It takes a real backup while it is there, because nobody had ever actually taken one.
- It compares the two Postgres versions. The backup tool cannot read a database newer than itself, and that error only shows up halfway through a restore without ever mentioning versions.
- **The firewall is the most likely reason the phones will not work.** The app prints a confident web address and the handsets just time out. The app cannot spot this itself, because a blocked request never arrives and there is nothing to log. Windows normally asks once, but that prompt often gets blocked by work-laptop policy or hidden behind a window. The check looks for the rule and prints the command to add it.
- Give the phones the machine's name, not its number. A laptop's number changes when it rejoins the network and every bookmark made from the old one dies. That looks exactly like the app breaking. Both are printed, with the name marked as the one to write on the card.
- A restore is checked now instead of trusted. "Restored successfully" only means the restore tool did not complain. A dump can be cut short, a restore can be pointed at the wrong database, or one table can fail while the rest go through. The first sign of any of that is a month with a hole in it. Every backup writes a list of what the database held, and setup compares that against the restored copy table by table. If anything is short it stops and says not to start logging yet, because the old machine still has the data.
- Older dumps taken before those lists existed get skipped, with a reason. More rows than the backup is not a fault, since the plant may have carried on working.
- Every check that can fail also prints its fix.

---


## 3.13 — Saturday, September 5, 2026
**Browser faults, and the tanks**

Three releases that day. The first is three faults reported off the floor that only happen in a browser. The other two are both the vessels.

### Three faults from the floor that only happen in a browser

No new features. The three have the same thing in common. Each one was an action that needs the browser to receive the current screen, followed straight away by a refresh that throws that screen away. Python saw success every time.

- **"Remember this device" never wrote a cookie. Not once, on any device.** The cookie library does not write from Python. It renders a small component, and the browser has to receive that screen and run its code. A refresh on the very next line tore it down first. The library also updates its own in-memory copy, so the same run read the value back and everything looked fine. I checked in a browser and there was nothing in the cookie jar but Streamlit's own token.
- This was every cookie in the app. Nine places set a cookie and immediately refresh, so a chosen theme reset on the next visit, glove mode would not stay with a terminal, night dimming would not stick, and the operator's remembered pump station was never remembered.
- Fixed once in `utils.set_cookie`, which writes the cookie and then waits for the browser. 1.2 seconds, measured rather than guessed. At zero, not one cookie is written. At 1.2 all of them are, on desktop and phone. You only pay it on actions that write a cookie, and an operator opening the terminal triggers none.
- One guard came out of that. The "remember my station" cookie was compared against a value that is empty on the first run of a fresh page load, so it decided the cookie was wrong and rewrote it. That charged every operator the wait on the screen they open all shift, for a value that was already correct.
- **The confirmation after submitting a log was not appearing.** Same shape. A pop-up belongs to the current screen, and the refresh straight after can throw it away before the browser paints it. Desktop usually won that race. A phone reliably lost, so the operator at the pump submitted an hour's count, got nothing back, and had to open the last submission to check it existed. Every hour.
- Confirmations go through `utils.flash` now, which stores the message so it survives the refresh and shows it at the top of the next screen. I made it a banner instead of a pop-up on purpose. A banner stays until the next action. A pop-up vanishes after four seconds whether or not anybody was looking, and looking away is what an operator does between screen and pump. Eleven of them moved over.
- **The QR checksheet button was on the wrong side of a wall.** The startup checklist asks the operator to confirm they have scanned the daily station QR code, and the button that opens it sat behind the gate they cannot pass until they tick that very box. So entering the address in IT Admin looked like it did nothing.

### The reactor levels were never a reactor feature

Reported from the floor. With work orders disabled, the Live Reactor page was confidently wrong. Every tank drained to empty on the first day and stayed there, and the figures on the way down were understated by up to five times.

A reactor record holds a name, capacity, status, resin and pump. There is no fill level on it, so the level was always worked out. The problem was what it was worked out from. The assigned work order was quietly doing two jobs that are not work-order jobs. Its lot number answered when the tank was last filled, and its container format answered how big each unit is. Take it away and both answers vanish, so the page added up every log ever recorded for that resin and pump, and sized every one as a 1 L cartridge.

I reproduced it on a throwaway database first. A 5,000 L tank with two lots behind it read 4,000 L remaining with a run present and 400 L without. A 3,000 L tank drawn down in 120 five-litre jugs read 2,400 L with a run and 2,880 L without. 600 litres counted as 120.

- **The fix is that operators already tell us both things, every hour.** The lot number goes on every hourly log, so a new lot at a station means that tank was refilled. Every log also carries the container it was poured into, so litres get added up per log instead of assumed. No new field, no new screen, nothing extra for anybody to enter.
- It reads the same in both modes, because dispatching a run puts the same lot on the run and the log.
- Container volumes have one definition in `crud.py` now, replacing seven copies of the same expression across the reactors page, Home, the TV dashboard and the Google sync. With seven places to edit, sooner or later the totals and the tank levels disagree.
- Both level calibrations were rebuilt the same way. They divided the correction by a container size read off the work order, so with no run they assumed 1 L and wrote the wrong adjustment. On a tank nobody had poured from they could not calibrate at all. They work in litres now, and record the difference as an adjustment row belonging to its batch rather than looking like a refill. Dated and attributed, never an overwrite.
- The tank card's second line is the lot instead of the operator, since that is the thing somebody at the vessel can check against the container in front of them.
- The kilogram figure no longer depends on container format. A 1,110 g cartridge in 1 L and a 5,550 g jug in 5 L are the same 1.11 kg per litre. It was only ever a density.

### The fleet wall redrawn as the vessels actually out there

I took photographs of the supply vessels and pump carts. They turned out to be three completely different things, and the page had been drawing all of them as the same rounded rectangle.

Every fabricated vessel is built the same way. A bolted top flange, a barrel, a dark band at the joint, and a cone bottom in a steel frame. Only the totes are flat-bottomed. What differs is shape and marking. M-205 and the White V5 beside it are tall and narrow with litre marks painted up the barrel, 200 to 4,400. M-101 is short and wide with ribs down the cone and no printed scale, just two hand-written marks near the rim. The small one is a caged ULTRATAINER tote on a pallet with a red ball valve, about 1,041 L, flat bottomed.

- **Capacity cannot tell those apart.** M-205 and the Black V5 vessel are similar sizes and different shapes, so vessel type is a stored setting now instead of a guess off capacity. Migration 0011 fills it in from the old capacity bands so an existing fleet draws the way it did before, and a manager corrects the wrong ones.
- The litre marks are the best idea in the photographs. That is what the operator reads the level off, so the tall reactor carries the same scale and the liquid lands on the mark they would read it against. 2,193 L sits just above the 2,000 line, on screen and in the aisle. The squat mixer gets no scale. The real one has none.
- **The cone shape is in the arithmetic, not just the outline.** Below the joint the surface rises more slowly than the volume, because the vessel narrows underneath. A straight line would make a nearly empty vessel look a third full. That is also why half a tank does not sit half way up one of these.
- The liquid takes the resin's own colour instead of a fixed blue. A near-black resin is lightened until it reads as liquid rather than a hole, and the percentage over it switches between black and white text depending on what it sits on. White V5 and Black V5 are both in this fleet.
- Each vessel is stencilled with a tag (M-101, M-205) and stands beside a bollard with an orange bay marker (E2, F3). Two optional fields, drawn where they are in real life. A tank called "Reactor 2" on screen and "M-205" in the aisle is one translation step right at the moment somebody is checking whether the screen is telling the truth.
- A vessel with no resin says IDLE instead of 0.0%. It is not nought percent full of anything, and a number there sends somebody looking for a leak.

One caught before it shipped. Colour gradients are referenced by name, four vessels share one page, and duplicate names all resolve to the first. So every tank after the first would have drawn the first tank's colour, at the right level, on a wall whose whole job is being recognised by colour from across the room. Nothing would have looked broken.

---


## 3.12 — Friday, September 4, 2026
**One switch decides what this is: a logging system or an execution system**

The app worked with no work orders and told the operator it was broken for it. A plant that had not set one up got a heading with a manager's name over an empty space, a box telling it to find a manager, a yellow warning on every log, a warning pop-up after every submit, and a floor display announcing "No Work Orders configured" to a room, all shift. Five sentences all saying the same untrue thing, that something is missing here. Nothing was.

- **A simple mode setting (migration 0009), on by default.** On, the operator terminal is station, material, lot, counts. Off, every work-order screen comes back exactly as it was, and nothing entered is lost either way.
- The work-order parts are hidden once at the top of the operator page instead of checked in four places. That is why a stale run left open in the database cannot raise DO NOT POUR on a terminal with no way to show what it means. With no run to compare against, the lot check records instead of comparing, which is still the whole traceability answer.
- **A manager is the administrator now, unless the plant says otherwise.** A plant small enough not to dispatch work is small enough not to have an IT person. As a logging system a manager holds the whole console. Accounts and PIN resets, pumps, resins, settings, backups, cleanup. As an execution system, administration goes back to administrator accounts.
- The rule is one function, `crud.can_administer`, asked by eleven places across eight files instead of comparing text to `"admin"`. With eleven copies of a permission check, one of them ends up disagreeing with the other ten.
- Two guards, because this is a permissions change. Switching to execution mode with no administrator account would leave nobody able to reach the console, including to switch back. That save is refused with a message saying what has to exist first, while every other setting still saves. And a manager arriving at the console is told why they have it and what takes it away.
- The sign-in screen follows the mode. It read SCADA TERMINAL over MANUFACTURING EXECUTION SYSTEM, which is the largest claim the app makes, on the first screen anyone sees. As a logging system it reads POURING LOG over RESIN POURING · PRODUCTION RECORD.
- **The shift handover is gone (migration 0010).** It emailed four whole-day figures as a PDF. All of them are on the landing screen broken down by station, operator, resin and shift, which the report was not. It filtered by date, so the second shift's handover quietly included the first shift's work, and a night shift crossing midnight split across two reports. The incoming lead arrives before the shift and opens the app anyway. It was also the only feature that needed an outside email account, which made the least useful screen the most expensive to set up.
- Found next door while removing it. The Google Sync page offered a manual push, an auto-sync on shift handover, and a scheduled webhook. Only the first one existed. The choice was never read except to word the spinner, and one option was named after the screen I had just deleted.

Two real bugs fell out of the mode work. The recorded-lot message read back `L-L-2411A0742` with the prefix doubled, on the one screen whose whole job is being trusted about a code. And the settings save handed the database a value type it refuses, which loses the whole save. Unticking the packing option would have hit that the first time.

Two on the housekeeping side. Of forty-one top-level Python files, about twenty were the app. The rest were screenshot scripts, document builders and a retired installer sitting beside the code as if they ran on the floor. They live in `dev/` and `docs/` now, and `Move_To_New_PC.bat` excludes those folders instead of a filename list that goes stale.

And first-time setup defaults to a clean database now. `Setup_On_New_PC.bat` refused to run without a backup and always restored it, which would have put the development database, demo operators included, on the plant PC. A backup is an offer now. With none, the app builds its own database and seeds one administrator, three placeholder pumps and the downtime reasons.

---


## 3.11 — Thursday, September 3, 2026
**A readiness pass before testing at the plant**

No new features. The honest answer on whether the build was floor-ready was not yet. There were four faults the existing tests could not see, three of them because the tests fake out the very thing that was broken.

- **A restored backup would not have started.** The startup routine had three cases and only two of them ended on the current schema. A database with the app's tables but no recorded version, which is what an older backup restored onto another machine looks like, was marked as being at the starting version instead of being brought up to date. The app then ran seven revisions behind and died on the first settings read. Marking says where a database already is. It does not update it. This is the path `Setup_On_New_PC.bat` takes.
- **The IT Admin console was dead for every admin.** One sidebar line linked to a page it could not find, and that raises an error. The navigation renders near the top, so the whole console was an error page. The page sweep could not catch it because that harness fakes out page links. I found it by opening the page in a browser.
- A new source-reading check confirmed all 178 navigation targets across 20 files are real. It also flags pages nothing links to, which found the Theme Gallery, built and then left reachable only by typing its URL.
- **Every form label was almost invisible on the dark themes.** Streamlit colours anything a theme does not, using a value picked for its own light theme, so widget labels, navigation links and the popover button kept a near-black default on a dark background. Measured: nav links 1.35:1, widget labels 1.14 to 1.68:1, the preferences button 1.01:1, against a readable floor of 4.5:1. Worst on a phone, where the six nav buttons are the entire navigation. Fixed once in the shared stylesheet instead of in thirty-four themes. Measured afterwards across ten themes, 9.1:1 to 18.9:1.
- **RPS jugs are gated like every other format now.** They were the one exception, on the understanding that bulk jugs carried no lot label. They always have, and the plant has since made tagging before pouring a rule. The exemption that showed the expected lot on RPS is gone too.
- The wording follows the container, and only the noun differs. Cartridges and jugs carry the same label in the same place, on the bottom of the empty, so the check and the instruction are identical. On a jug the section reads *Jug Lot Verification*, *hidden on purpose, read the jug, not the screen*. It follows the container picker rather than the page, so switching format mid-session flips every one of those words.

The browser tests came out of this. The existing ones run the pages but render nothing, so none of them can see a control that is off-screen, a click that does nothing, or a page that failed after it drew. The new one drives a real browser through an operator's first hour, then does the whole thing again at phone size.

---


## 3.10 — Wednesday, September 2, 2026
**Fill weight, two shifts, light themes, and a floor-usability pass**

- **The app has always known the target fill weight and never once recorded a measurement against it.** The resin specs carry the target and the allowed range, 1110 g, accept 1100 to 1115, so it could say how many units were poured but not how much resin went into them. There is an optional check-weight box on the hourly form now (migration 0006) and a fill-weight section in Analytics.
- Passing the check and giving away resin are the same reading. A pump set to run safely clear of the low limit sits above target on every cartridge. Inside spec, passing every check, handing over free resin every time. Four of the sixteen specs make it worse by being lopsided, but it happens on an even range too. Every gram above target is about 0.09% of the fill, so 4 kg per thousand cartridges at 4 g heavy.
- **The reading is optional and can never block a submission.** A wrong lot is a defect. A heavy cartridge is information. Make it mandatory and within a week it is the target typed from memory on every log, and then the column is full of `1110` and looks like real data. It is never pre-filled either, for the same reason the run card had to stop printing the lot the gate was hiding.
- One field, not the three the paper form asks for. Three cartridges weighed in the same minute mostly measure the scale's noise, and the variation worth catching is between hours. The analytics weight each reading by the units logged alongside it, which turns "+3 g" into kilograms. The verdict is stored against the resin's range at the time, so editing a spec later cannot re-judge old readings.
- **The plant runs two shifts, not three.** The app assumed three and offered "Shift 3" everywhere. Rather than hardcode two, which only moves the wrong assumption, the count is a plant setting (migration 0007, default 2). Logs written when three shifts were offered keep their label and stay in every report.
- Found while generalising that. The gateway could not work out which shift 01:30 belongs to. It sorted the start times and took the largest match, but 01:30 is earlier than every start time, so the answer fell out of list order rather than any reasoning about midnight. The last shift of the day owns everything until the first one begins next morning.
- **Ten new themes, six of them light.** Not one of the original twenty-four was. On a brightly lit floor a dark screen is a mirror. New themes are a palette of about a dozen colours instead of fifteen hand-written rules, so a new component gets styled once. The original twenty-four are untouched. People have them saved by name.
- The contrast checker found two real failures in existing themes. Card labels were 3.9:1 in Default Dark, the theme most people look at, and 3.0:1 in Dracula. Both below the floor, both fixed.
- **Resin chips carry a texture as well as a colour.** Five pairs across the palette are the same colour to the eye, like Clear V4 and Rigid 4000, or Black V4 and Tough 1500. Those colours came off the plant's own sheet, where each one sits beside a full row of text. Shrunk to a chip, colour was carrying more than it can, and a Clear/Rigid mix-up is what the lot gate exists to catch. The texture comes from the resin family, so Clear V4 and Clear V4.1 still match while Clear and Rigid cannot. It survives greyscale printing and colour blindness.
- Patterns are assigned rather than worked out from the name, which collided where it could least afford to. Rigid 10K and Rigid 4000 look alike, carry target weights 370 g apart, and drew the same texture.
- **Glove mode.** Operators handling resin wear nitrile. Touch still registers but precision drops, and the form asks for number steppers and a lot field. A toggle pushes every target past the accessibility touch size and scales the type. Stored against the terminal, not the account, so a shared floor terminal keeps it for whoever signs in next.
- **Night dimming**, based on the plant's own shift times instead of a fixed hour, since "night" here means "not the day shift". It is a brightness and warmth reduction rather than new colours, so it works with all 34 themes. Photographs are exempt so a stamp under review keeps its true colour. What people reach for otherwise is turning the monitor down, and that destroys the colour coding the lot check depends on.
- **Undo on your own last log.** A typo, 2500 where 250 was meant, needed a manager to open Log Management, so the wrong number sat in every dashboard until somebody found it. Two minutes, own row only, latest row only, and never a flagged log, because that flag is a cartridge problem somebody may be reviewing. Run progress is recalculated from the surviving logs.
- **Focus mode.** During a pour the operator is at the pump, not the screen, and the four things they need, resin, lot, count so far and how many left, are scattered across a card, a progress bar and a form. One toggle replaces the page with those four, large enough to read from across the station.
- The pouring form says whether the log actually saved now. The write was unguarded. If the database was unreachable the page failed or quietly re-ran, and an operator who is unsure re-submits. A duplicated hourly count does not look wrong afterwards, so nobody catches it, and the network drops in parts of this building.
- **Operators are on their own phones, not a station tablet, and the app was pushing the page off the screen.** Two files forced the sidebar open, which on a 390 px handset covered four fifths of the page, so the first action of every hour was closing something nobody opened. It is automatic now. Open on a desktop and the wall display, closed on a phone.
- **The pump form is a button inside the app now instead of a sticker on the pump.** Scanning the QR code works but it is a one-way trip. The phone navigates away and the way back is the browser's back button, which costs the session and whatever was half-typed. A link button opens the same form in a second tab, so closing it puts the operator back mid-log. The address is a plant setting (migration 0008), because this app does not own that form.
- Addresses are checked where they are typed. The two real pastes are a bare host with no `https://`, which the browser resolves against this app and lands on a "not found" that looks like the app is broken, and a line lifted out of an email with a full stop on the end. Both get repaired. Anything that is not http or https is refused, including `javascript:`, which has no `://` and would otherwise have slipped through.
- **A setting that saved and was never read back.** `shift_count` had a column, a migration, an admin field and a working save, and the settings reader never returned it, so every picker fell through to the default. The default happened to be two. That is right for this plant, so nobody noticed.
- Five pages rendered nothing at all with no data. Scrap Intelligence, Historical Trends, Cleanliness, and both charts on the yield page. Most of the rest said something like "No assigned runs currently active", which states the obvious and leaves the reader stuck. Every empty screen says what will make it fill up and the next step. Not styled as an error, on purpose. Having no data yet is normal on a system installed last week, and painting that red teaches people to ignore red.
- Every light theme had white text on a cream card. The palette work removed hardcoded colours from the theme engine but not from the page markup. The worst was the filter header on the landing screen, the first thing anyone sees. Eighteen of these take their colour from the theme now.
- Every light theme also showed its own stylesheet as visible text. Streamlit passes stylesheets through a text formatter that treats an indented line as example code, so an indented style block added after other content gets shown instead of applied. Found in a browser after the tests passed.
- The in-range headline was rounding away the exception. 349 of 350 readings in range is 99.71%, printed as a clean `100%`, directly above a chart where the one out-of-range point is right there to see, and that point is the reason to open the panel. Only a real clean sweep reads 100% now.
- Pulled the repeated markup into `components.py`. Cards, stat tiles, notes and section headers were hand-written HTML copied page to page and drifting a little each time.

---


## 3.9 — Tuesday, September 1, 2026
**Resin colour identity everywhere a resin is named**

Every place the app prints a resin now prints it in that resin's colour. People on the floor recognise a formulation by the colour of its label long before they read the words, and the plant's master sheet has been colour-coded that way for as long as it has existed. The app was the only thing in the building showing every resin in identical grey.

- The operator's selection, run cards, reactor tanks, the TV board, the lot-verification feed, the log tables and the spec lookup all carry the same coloured chip. The Analytics donut and Scrap Intelligence bars use those colours instead of the chart library's defaults. A chart that invents its own palette teaches a second colour language for the same things.
- **The colours are the plant's own**, sampled off the master sheet, so the screen and the sheet on the wall read as the same document. Thirty-four formulations matched by name.
- A resin nobody has listed still gets the right colour. "A manager sets one" means every new resin is grey until somebody remembers. Formlabs names resins by family and revision, like Black V4, Black V4.1, Black V5, so an unlisted name matches on its family. Add Black V6 tomorrow and it is the correct grey-black straight away.
- Those rules are ordered most-specific-first. They are partial text matches, and "Clear Cast" contains "Clear", "Grey Pro" contains "Grey", "Fast Model" contains "Model".
- Anything matching no family is assigned one of forty prepared swatches, worked out from the name using md5 rather than Python's own hashing, which changes between restarts and would give the same resin a different colour every time the app starts.
- A manager can override any of it. Resin Canvas gained a colour picker, pre-set to whatever the resin resolves to today, so saving without touching it cannot quietly change anything.

**The `color_tag` column already existed, and real data showed it had never meant what I assumed.** I wrote migration 0005 to fill in rows still holding the old shared orange default, then restored an actual backup to rehearse the move. The column holds a container format colour, not a material one. One green on all forty RPS rows, one blue on all eighteen V1s, one rose on every Pigment. My migration read those as somebody's choices and left them, which would have shipped a feature where most resins render as one of six identical blocks. An empty-database test passes happily through that. Only real data showed it.

So I rewrote the migration around what actually separates the two. An identity is not shared. A colour worn by three or more distinct resin names is labelling a group and gets replaced. One worn by one or two is somebody's decision and gets kept. Distinct names rather than rows, because the same material legitimately has one row per container size. On the real table that turns 67 resins sharing 6 category colours into 33 real ones. Running it twice changes nothing the second time.

Three fixes to the move-to-a-new-PC scripts the same day:

- `Setup_On_New_PC.bat` marked the database as current after restoring it, but the dump carries its own version, and marking overwrites that without running anything, so every migration added since the dump would be silently skipped. Replaced with a call into the app's own startup routine, so setup and boot are the same code.
- `run_mes.bat` launched with the system Python instead of the one setup installs into. That works where packages happen to be installed globally. Everywhere else it dies with "No module named streamlit", and everywhere else is what a fresh PC is.
- `install_mes.bat` pointed at a file that has not existed since the app was reorganised, and tried to download and silently install Python from the internet, which is not something to run on a managed work PC.

Also a Postgres version check on the same script. This database is 18, and an 18 dump uses syntax older versions cannot read. Hand it to a version 16 tool and the restore dies on line 5 with a message that says nothing about the actual problem. And an optional offline-packages step in `Move_To_New_PC.bat`, because a work PC often cannot reach the package servers and that failure arrives several minutes into setup as a wall of red text.

---


## 3.8 — Monday, August 31, 2026
**Cartridge lot verification, per-station checklists, and the credentials out of git**

- **Closed the hole behind the lot mix-ups on the floor.** The pouring form used to fill the run's lot number into an editable box, so the form answered its own question and an operator could log a full hour without turning a cartridge over. The expected lot is hidden now and the operator types what is stamped on the bottom. The comparison ignores formatting, so typing the stamp verbatim (`L-2411A0742`) matches a lot the manager entered bare (`2411A0742`), while near-misses still fail.
- A mismatch never dead-ends the operator. A full-width STOP, then a required cause and details before the log will submit. The log saves flagged, carries the lot that was physically in the cartridge rather than the expected one, and gets an explanatory note. The run's progress bar does not move, on purpose. A mismatch that still produces a correct-looking count is one nobody notices. There is also a "wrong cartridge, pulled it, nothing poured" button. A catch is data worth having and there was nowhere to put it.
- **A photograph of the stamp is required on a mismatch, and only on a mismatch.** It started as a requirement on every check, and on a bad network segment here the upload took 20 to 30 seconds each time. The typed comparison is what blocks a wrong cartridge, so the check is exactly as strong without the photo, and half a minute of standing still per check is the friction that teaches operators to resent a control. It is worth thirty seconds on a flagged pour, which somebody reviews later and the operator may have to defend. It is not required to pull a cartridge and log the catch, because the safe action must never be slower than the risky one.
- A fast path so a per-log check does not decay into a reflex tap. A full check on the first log of a shift, on any change of run, lot, resin or station, after 4 hours, and on every 10th log. A one-tap confirm otherwise. A mismatch clears the fast path.
- I did not ask the operator to type the expiry printed under the lot. One field is all of their time this check is worth. The parser and columns are already written, so a later automatic pass over the photographs can fill them in.
- Corrected the stamp format after checking an actual cartridge. The base reads `L-<lot>` and `E-<date>`, not `L:` / `E:`. No functional impact, since the parser already stripped either separator, but every on-screen label said the wrong thing, and that is the kind of detail that makes an operator distrust the rest of the screen.
- New `lot_verifications` table (migration 0003) records every check, pass or fail, with the photo and both codes. New manager page with the flagged feed, per-operator coverage, an expiry watch, and CSV export.
- **The startup checklist is per-station now instead of once per day per shift.** A checklist certifies the condition of the pump you are standing at, so an operator moved to a different pump has certified nothing about it. The lock screen gained a "which pump are you starting at?" picker that feeds straight through to the logging tab. The cleanliness step is keyed by station too, so switching pumps mid-checklist cannot carry the previous station's photo over. Rows written before the column existed (migration 0004) count for any station on that date, so shipping this did not re-lock every operator who had already done their checklist that morning.

The test suite went in the same day and immediately found six things:

- The run card was printing the lot the gate was hiding. The active-run panel sits directly above the verification section and showed the lot in plain text, so the whole gate was decoration.
- Eight pages would crash on a theme change. Six never imported the date functions and two imported half of what they use, but the only call site is inside the theme-change branch, so it only blew up when someone actually switched theme from one of those pages.
- Log Management crashed whenever 1 to 9 records matched. Both row-count boxes were set to the number of matches against a minimum of 10, so a narrow filter or a quiet day made the value illegal.
- The TV dashboard was a hot loop. It ended with a refresh under a comment promising a 10-second wait that was not there, so it re-ran as fast as the machine allowed, several full-table queries per pass, continuously, on a screen that is up all shift.
- A CDN fetch could take down the operator terminal. The run-complete animation was fetched on every refresh with no timeout and no error handling, so a slow CDN or a floor PC that lost its internet would hang the terminal and then fail before one control rendered. Guarded now, 3-second timeout, fetched once per session.
- **The Admin Panel could never save plant settings.** The save function took fifteen separate arguments while its only caller passed a single bundle, so every click failed. That means shift start times, shift lengths, break minutes, rate targets, yield targets and the packing toggle have never been changeable from the interface, and every pace and yield figure is measured against those numbers. Here is how it survived a day of testing. The page sweep loads all 18 pages and reports them clean, but it never clicks anything.

Two more, both structural:

- Closed a cross-site scripting hole in the raw-HTML cards. The app builds a lot of its cards by dropping database values straight into markup, and most of those values are typed by people on the floor. Names, notes, messages, lot codes. An escaping helper at 28 points across 10 files. The non-security half of it is that a note containing a `<` was already breaking the card it rendered in.
- Extracted the page shell, 1,335 duplicated lines gone. Eleven manager pages each carried their own copy of the same 131-line navigation bar, sidebar and account popover. That duplication was the direct cause of the theme-change crash above, since the block had been pasted eight times and half the copies were missing an import. I did a straight lift rather than a rewrite, and every one of the 18 pages renders exactly the number of elements it did before.

Also added read caching, which there was almost none of, so every keystroke in a number box re-ran the whole script and re-queried the database for the resin list, pump list, operator list and settings. Seven reference reads cached. Production logs, runs and lot verifications left uncached, since those must be correct the instant after a write.

And killed the default sidebar navigation properly instead of hiding it. Every page injected styling to hide it after the fact, which is why it still flashed on load. The browser was being sent the nav and told to hide it a moment later. The supported switch needs a config file and the project had none. All 19 styling blocks removed. The new config also stops Python error details appearing in the browser, which is right for a floor terminal.

**Found the credentials sitting in git, and got them out.** The settings file holding the live database password, the email password and the Google Sheets webhook had been tracked since the repository was created and was on the server. The 3.3 entry below says the point of moving secrets into that file was that nothing sensitive sits somewhere it could be shared or committed by accident. That was the right instinct, it just needed one more step. The file was never added to the ignore list, so the file holding the secrets became the file committing them. It is untracked now, with a template committed for setting up a new machine, along with the old database file, a code dump, the runtime log and the editor folder. Untracking does not undo the exposure. The values are still in earlier commits. The repository is private, which lowers the urgency but does not remove it.

---


## 3.7 — Sunday, August 30, 2026
**Machine integration, and a batch of operator fixes**

Started building a real Device Gateway, a back end for wiring pump controllers, bench scales and eventually label printers straight into the app. I did not want to hardcode a protocol, because I do not yet know what our equipment actually speaks. Every machine gets one row in a `devices` table with a protocol column, and the code for each protocol lives behind one shared interface in its own file, so supporting something new is one new file and one line in the registry.

- Six adapters. Modbus TCP (panels on Ethernet, the likely fit for the filling controllers), Modbus RTU (the same over a serial cable), OPC-UA (newer equipment), MQTT (machines publishing to a broker), Serial ASCII (bench scales streaming plain text, matched against a configurable pattern rather than one hardcoded vendor format), and HTTP polling.
- **Machine readings write through the same function an operator's typed entry uses**, tagged "Automated Gateway". Every rule already in the app therefore applies to machine data for free. Run progress, marking a run done, the links to users, stations and resins. Analytics, the Manager Cockpit, Live Reactors and the TV dashboard needed no changes, because they read the same tables and cannot tell a keyboard entry from a machine one.
- A separate `device_readings` table for raw machine data. Fault codes, machine state, weight curves, uptime. Production logs are what the plant is measured on and should not fill up with machine noise, but that noise is exactly what you want when a machine starts misbehaving.
- A shared vocabulary (`normalize.py`) so every adapter reports the same names, and a `device_tag_maps` table holding each device's mapping from its own raw tag to one of those names.
- The poller is its own long-running program, not part of the app. The app re-runs a page on every interaction, which is a bad fit for continuous polling. One thread per device at its own interval, rescanning the devices table every 10 seconds so a machine added on the admin page starts polling without a restart. A device that fails does not take the rest down.
- New admin page for finding, registering, test-connecting and mapping equipment. Trying a pattern against real serial output before committing is the difference between an afternoon and a week.

The floor fixes that day:

- An operator's logged bottle counts were not updating their run's progress.
- The progress bar was not filling as production came in. The numbers were right, the bar just was not reflecting them.
- Manually adjusting a run's progress could silently revert on the next refresh.
- The live shift-status indicator sometimes showed a shift as active for hours after it ended.
- An admin testing the app as an operator could accidentally downgrade their own permissions.
- Fixed auto-scroll on the operator logging page, and cleaned up the shift-progress card so it only renders when it is relevant.
- Reworked station assignment so several operators can log against the same reactor and run without a manager creating a duplicate assignment each. Which run shows on your screen follows the pump station you selected rather than the run's assigned operator.
- New Log Management page so managers can find and delete bad or test entries, downtime rows and completed work orders. The bulk cleanup stays disabled until you literally type DELETE into a box.

---


## 3.6 — Saturday, August 29, 2026
**Migrations, real password hashing, and joining up the records**
*Three releases this day.*

- **Replaced the way the database structure changes.** The startup routine had grown a hand-maintained list of thirty-odd raw schema commands, wrapped in one silent catch-all that could not tell "this column already exists" from a real failure. A change that broke looked exactly like one already applied. It is a proper migration history now.
- Hit a crash the moment a database password contained an encoded character. A `%21` for a `!` was read as a placeholder. It would have stopped the app dead on any machine with a password like that.
- **Moved PINs to proper hashing.** They were unsalted SHA-256. Fast to compute, so fast to attack in bulk. Salted bcrypt now, across creation, changes and login. Older accounts get a clear "needs an IT admin reset" message instead of a confusing failed login.
- Account lockouts. Five consecutive failed PIN attempts locks the account for fifteen minutes. An unknown username returns the identical "invalid credentials" message as a wrong PIN now. Before, the two differed, which quietly told anyone probing the login screen which usernames were real. The staff table shows locked status with an Unlock button, so a lockout clears without also resetting the PIN and interrupting a shift.
- **Renaming an operator split their history in two.** Every log stored the operator as plain text, so the moment a name changed, all their old logs were orphaned from their new ones and Analytics showed them as two people. The root fix was adding real links between records. Operator, pump station, resin spec, sender, current resin, assigned pump, across production logs, downtime, runs, checklists, cleanliness audits, floor messages and reactors. All optional and cleared rather than blocking, so deleting a user or pump cannot break historical rows.
- A backfill fills those links in on data already in the database, and the eight functions that create rows store the link at the moment of writing. New links are worthless if only new data has them.
- The Historical page had the same bug from the other side. The operator filter and the output chart disagreed after a rename, because the chart grouped by identity while the filter still matched raw text, so picking someone from the dropdown showed less than the chart claimed.
- **Backups could have been pointed at the wrong database.** The backup and restore functions had the host, user and database name written in, plus a Windows-only tool path, and ignored the configured address entirely. Point the app anywhere else and the backup silently backs up something else. They take all of that from the real connection address now. I also deleted a stale duplicate copy of both functions that had been shadowing the real ones. That is the kind of thing where you fix a function and nothing changes because the app was never calling it.
- Added actual error logging (`app_logger.py`), then wired it into the error handlers that had been swallowing failures silently. The backfill, resin spec creation, suggestions, reactor creation, and above all backup and restore, which now logs what the backup tool actually said instead of failing with no trail.
- **Profile pictures never rendered.** The filename had been saved on every upload since the feature shipped, and nothing ever read it back. Sign-in, session lookup and the auth check all left it out, and every sidebar drew a hardcoded emoji instead. Fixed across all sixteen pages with one shared helper. Chat threads had it from the other direction, drawing a fixed icon per role, so every manager looked like the same person.
- Fixed the login screen's theme flicker. The saved theme lives in a browser cookie and the read lags the first render, so the screen painted in the default theme and then jumped. The previous workaround was a blocking pause.
- Swept every blocking pause out of the request path. They let a message be read before a page refresh, but the app serves on a shared thread, so each one froze the server for everyone else on the floor too.
- Broke up `database.py`, which was past a thousand lines holding the connection, every table definition, every query and the file helpers. Split into `db_core.py`, `models.py`, `crud.py` and `utils.py`. `database.py` stayed as a thin pass-through, so not one page had to change.
- Wrote `create_admin.py`, a standalone script that force-creates a properly hashed superuser. It exists for exactly one situation, total lockout or a wiped database, and in that situation having no way in would be the end of the app on that machine.

---


## 3.5 — Friday, August 28, 2026
**The zombie-cookie logout bug, and the app going into version control**

- **Put the whole project under git.** Up to this point the only history was folder copies. This is also the evening the settings file with the live credentials went in with it. See the 31st, where I found it and got it out.
- **Fixed the phantom auto-login loop.** Signing out left a valid cookie behind, so the next page load signed you straight back in. You could not get out of the app, and neither could anyone else on that terminal. Fixed with an explicit signed-out flag that survives the session wipe. The theme preference is kept out of that wipe on purpose, because getting the default theme back every time you log out is a small daily annoyance nobody should have to explain.
- Added a theme picker to the login screen itself, before you are signed in, so the screen you stare at while typing your PIN is already in your theme rather than snapping into it a second later. Small, but the login screen is the one screen every person sees every day.
- Standardised the shell across every page. The navigation, sidebar profile block, preferences popover and release-notes reader had all drifted, because pages were added on different days and each carried its own copy. This is the duplication I deleted on the 31st, and the direct cause of a crash.
- Gave IT Administrators the same equipment rights as plant managers in Live Reactors, so they are not blocked from fixing floor equipment by a check that only anticipated managers.

---


## 3.4 — Thursday, August 27, 2026
**IT Admin console, role-aware navigation, sessions that survive a refresh**
*Two releases this day.*

- **Built a full IT Admin console** for creating and managing accounts, editing settings and recovering from problems, so nothing routine requires somebody opening the database directly. Once you are the only person who understands the database, every small fix becomes your problem forever.
- **Rebuilt navigation to branch on role instead of hiding links.** Admin gets a six-link top bar including the IT console, manager five, an operator a stripped-down set. Before, one navigation served everyone and just hid what did not apply, which leaked what other roles could do and made the operator screen busier than it needed to be.
- **Made sessions survive a hard browser refresh.** The session check happens on initial page load now rather than partway through, so a refresh no longer has a window where the app decides you are not signed in and throws you out mid-shift. This was the single most common complaint about using the thing.
- Added a superuser debug mode so an admin can view the app as another role. It is the only practical way to check what an operator's screen actually looks like without keeping a second account.
- Consolidated account settings into one place. Theme, profile, avatar and the feedback tool had each grown their own home on whichever page they were added to. They live in one preferences popover now.
- Extended the user record to store profile pictures, kept in a controlled folder on the server rather than as arbitrary paths. They did not actually render until the 29th. The write side shipped here and the read side was never wired up.
- Added an app-wide feedback tool routing to an admin inbox, so someone on the floor who hits a problem at 2am has somewhere to put it that is not a text message to me.
- Restored the Google Sheets sync into the management console, with control over which figures are included and a manual "send now" instead of only firing on a schedule.
- Added Master Equipment management to the IT console. Reactors, pump stations and downtime reason codes, all editable in the interface. Downtime codes especially, since those are the vocabulary the whole downtime analysis is built on, and they were previously only changeable in the source code.
- Fixed sign-out properly. Session revocation is guarded so an already-dead session cannot crash the logout, and every module routes back to the login screen rather than leaving you on a page you are no longer allowed to see.
- Overhauled the Analytics screen's styling. Sidebar restored, KPI cards rewritten to use the theme's own colours, and the charts converted to see-through layouts so they read correctly in every theme.
- Hardened the station admin screen against older rows using legacy column names, fixed the collapsed-sidebar controls which were nearly invisible against several themes, and added responsive type sizing so navigation labels stop wrapping when the sidebar expands.
- Added the in-app changelog viewer, this file, visible to anyone using the app rather than only to me.

---


## 3.3 — Wednesday, August 26, 2026
**Access control, confidentiality, and making it usable on a tablet**
*Two releases this day.*

- **Put a real permission check at the top of every page.** Before this the navigation hid links that did not apply to your role, which is not security. Anyone who typed or bookmarked the URL got the page. Now each page checks who is asking and stops if the answer is wrong. This is the change I would point at first if someone asked whether the app is safe to put on the floor network.
- Made login persist properly across pages, so moving between screens stops being a series of small opportunities to get logged out.
- **Moved the resin recipes out of the source code.** Spec weights, tolerances and multipliers were written into a Python file, which is the wrong place for confidential formulation data. It cannot be changed without editing code, and it travels anywhere the code travels. They are in their own table now, and I built the Resin Canvas page so a manager can edit them directly.
- Moved the database address, webhook URLs and mail credentials into a settings file, so nothing sensitive sits somewhere it could be shared or committed by accident. That was most of the way there. It needed one more step, which it did not get until the 31st.
- **The Google Sheets sync had been exporting the raw table**, so internal-only columns went out with it. It builds its own payload and strips those columns first now, and routes to several destinations so summary figures and the raw audit stream stay separate.
- Made the app usable on a tablet. Account settings and menus were built at desk width and were unusable on the floor. Rebuilt as a sliding drawer, with the interface tabs converted into scrollable pills sized for a thumb rather than a mouse pointer.
- Pulled the shared layout styling into one core stylesheet every theme builds on, so a layout fix lands in all of them at once.
- Fixed a startup ordering bug where the session was read before it was set up, throwing errors on the first render, and scrubbed leftover developer controls out of the production views.

---


## 3.2 — Tuesday, August 25, 2026
**Compliance gates, tank reconciliation, and being able to restore the data**

- **The mandatory pre-shift safety and compliance checklist.** The operator page stops rendering entirely until every item is checked. Not a warning, not a banner you can scroll past. If it can be skipped, sooner or later it gets skipped.
- **Real tank reconciliation.** Previously a reactor's level was a number somebody overwrote. Now a manager or operator enters a visual fill percentage, and the app compares it to what has actually been logged against that resin, adjusts inventory, and records the reconciliation as its own event. The difference between the two figures is information, and overwriting the number threw it away every time.
- The mid-shift role and station transfer tool, so a manager can move someone to a different pump or change their role during a shift and have the screen update immediately, rather than the person logging out and back in. Shift changes on the floor happen constantly, and the app was treating them as an exception.
- Managers can correct records after the fact, with work-order totals recalculating down the chain rather than a fixed total drifting away from the logs it summarises.
- One-click database backups, a real dump to a dedicated folder, plus the restore path. This was the point where the app held data that only existed there, so being able to get it back stopped being optional. The backup target had a bug that was not found until the 29th.

---


## 3.1 — Monday, August 24, 2026
**Analytics, theming, and a way to talk to the floor**

- **The Analytics Hub.** Downtime causes ranked so the top few are obvious rather than buried in a list, rolling performance windows, output trendlines, and a per-operator heatmap. The plant already had all this information. It just lived in whoever happened to remember it.
- **The live pace engine** on top of that. Current rate against target, projected end-of-shift output, and the gap between them, recalculated as logs come in. Knowing at hour three that you are going to miss by 200 is worth a lot more than knowing at hour eight that you did.
- The theming system, a multi-theme design layer with responsive layout rather than one fixed set of colours. Part of that is that a screen in a bright pouring area and a screen at a desk want different things. Part of it is that people use software more willingly when it does not feel imposed on them.
- Automatic shift handover reports, a generated PDF emailed to a list at the end of a shift with nobody having to remember. Handover was being done verbally and inconsistently, so what the next shift knew depended entirely on who was standing there. Removed on September 4th, see 3.12.
- Floor comms, direct messaging between plant leadership and floor staff inside the app. The alternative was walking across the plant or hoping someone saw a text. Renamed and honestly labelled on September 7th, see 3.15.

---


## 3.0 — Sunday, August 23, 2026
**The foundation**

- **Moved the core data out of ad hoc files and into a real Postgres database.** Everything else rests on this one. File-based storage falls apart the moment two people log at the same time, and on a floor with multiple pumps that is the normal case rather than the edge case.
- **Laid out the core tables** the whole app has been built on since. Production logs, downtime, assigned runs, reactors, resin specs, pump stations, cleanliness audits and users. I spent the time getting their shape right before building screens over them, because tables are the part that is painful to change later. That mostly held up. Everything added since has been additive.
- Seeded the baseline reference data so a fresh install boots into something usable rather than a set of empty dropdowns.
- Set up the three surfaces the app still has, the operator workstation, the management side and the live display views, and the routing between them.
- Added server-side photo storage for cleanliness checks and incident reports, saved with the record they belong to instead of living as email attachments and photos on people's phones. A photo nobody can find later does not prove anything.
