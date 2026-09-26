import type { TabKey } from '../ManagerShell'
import type { TourStep } from './TourOverlay'

type OperatorTabKey = 'pouring' | 'packing' | 'downtime' | 'audit' | 'summary'

export interface OperatorTourControls {
  setTab: (t: OperatorTabKey) => void
  /** Show what's behind the startup checklist while the tour runs - a new
   *  operator's first sign-in has the checklist in front of everything, and
   *  without this every step after it had nothing to point at and was
   *  silently skipped. The overlay covers the screen, so nothing behind it
   *  can actually be tapped. */
  setPreview: (on: boolean) => void
  setAccountOpen: (open: boolean) => void
}

/** Everything an operator or packer needs to get through one shift, in the
 *  order they'd actually hit it: sign in, clear the checklist, log an hour,
 *  handle a stop, keep up with photo checks, check their own numbers, sign
 *  out. Points at the exact same [data-tour] elements the real screens use,
 *  so nothing here can drift out of sync with a relabelled button the way a
 *  written guide can.
 *
 *  Steps marked explainAnyway still show (as a centred card) when their
 *  target isn't on screen yet - the lot check card, say, only appears once
 *  a pump and resin are picked, and a new operator needs to hear about it
 *  regardless. Everything else is skipped when it doesn't apply. */
/** Gives every step in a chapter the chapter's own setup (which tab, whether
 *  the checklist is being looked behind) ahead of its own - so Back into the
 *  middle of a chapter from a later one lands on the right screen, rather
 *  than only the chapter's first step knowing where it belongs. */
function inScreen(steps: TourStep[], enter: () => void): TourStep[] {
  return steps.map((s) => {
    const own = s.before
    return { ...s, before: () => { enter(); own?.() } }
  })
}

export function operatorTourSteps(isPacker: boolean, c: OperatorTourControls): TourStep[] {
  const mainTab: OperatorTabKey = isPacker ? 'packing' : 'pouring'
  const behind = (tab: OperatorTabKey) => () => { c.setPreview(true); c.setTab(tab) }
  const work = isPacker ? 'Packing' : 'Logging an hour'

  const welcome: TourStep[] = [
    {
      chapter: 'Welcome',
      selector: null,
      before: () => { c.setPreview(false); c.setAccountOpen(false) },
      title: isPacker ? 'Welcome to the Packing Log' : 'Welcome to the Pouring Log',
      body: "A walk through everything you'll touch in a shift - about three minutes.\n\nNothing you see during the tour is saved or sent anywhere; the screen behind it is only being shown to you. Use Next and Back (or the arrow keys), or Skip tour any time.",
    },
    {
      chapter: 'Welcome',
      selector: '[data-tour="identity"]',
      title: 'This is you',
      body: "Your name and the shift you're on. Everything you log is recorded under this name. If it's wrong, sign out and back in, or ask a manager to check your account.",
    },
    {
      chapter: 'Welcome',
      selector: '[data-tour="operator-guide-link"]',
      title: 'The written guide',
      body: 'Opens the Operator Guide PDF in a new tab: the full instructions for every screen, and what to do when something isn\'t right. Handy mid-shift.',
    },
  ]

  const checklist: TourStep[] = [
    {
      chapter: 'Before you start',
      selector: '[data-tour="checklist-pump"]',
      before: () => c.setPreview(false),
      explainAnyway: true,
      title: 'The startup checklist',
      body: isPacker
        ? 'Every shift starts here. Until it\'s done, the rest of the app stays closed.'
        : 'Every shift starts here, with the pump you\'re starting at. Until the checklist is done, the rest of the app stays closed.\n\nMoving to another pump later doesn\'t need this again - the Pouring tab has its own pump picker.',
    },
    {
      chapter: 'Before you start',
      selector: '[data-tour="checklist-step-1"]',
      before: () => c.setPreview(false),
      explainAnyway: true,
      title: 'Start-of-shift photo',
      body: 'A quick photo showing the station is clean and ready. Tap the big photo box to take one with the camera, or tick "Station is clean" if a photo isn\'t needed, then Save.\n\nThis is the same Start photo the Audit tab asks for - doing it here covers both.',
    },
    {
      chapter: 'Before you start',
      selector: '[data-tour="checklist-step-2"]',
      before: () => c.setPreview(false),
      explainAnyway: true,
      title: 'Final check',
      body: isPacker
        ? 'Tick that the QR checksheet is done and your labels, boxes and materials are staged, then Start my shift. The padlock opens and you\'re in.'
        : 'Tick that the daily QR checksheet is done and your bins and carts are staged, then Start my shift. The padlock opens and you\'re in.',
    },
    {
      chapter: 'Before you start',
      selector: '[data-tour="checklist-already"]',
      before: () => c.setPreview(false),
      title: 'Somebody already did it?',
      body: "If another operator already did this pump's checklist today, open this, pick their name, and you're unlocked without redoing it. It's recorded as theirs.",
    },
    {
      chapter: 'Before you start',
      selector: null,
      before: () => { c.setPreview(true); c.setTab(mainTab) },
      title: "Now, what's behind it",
      body: "For the rest of the tour you'll see the screens that open once the checklist is done. On a phone, the tabs are along the bottom; on a bigger screen, across the top.",
    },
  ]

  const pouring: TourStep[] = [
    {
      chapter: work,
      selector: '[data-tour="tab-pouring"]',
      before: () => { c.setPreview(true); c.setTab('pouring') },
      title: 'The Pouring tab',
      body: "Where most of your shift goes: one entry per hour you pour. Three numbered cards, top to bottom - each turns into a green tick once it's filled in.",
    },
    {
      chapter: work,
      selector: '[data-tour="shift-ring"]',
      title: 'Your shift so far',
      body: 'How many units you\'ve logged today, with a ring filling toward the next hundred. Tap it to see every log behind the number. It appears once you\'ve logged something.',
    },
    {
      chapter: work,
      selector: '[data-tour="same-as-last"]',
      title: 'Same as last hour',
      body: 'Fills in the pump, container and resin from your last entry in one tap. It never copies the lot number - that always gets read off the container in front of you.',
    },
    {
      chapter: work,
      selector: '[data-tour="pouring-step-1"]',
      title: '1 · Station & material',
      body: "Your pump, the container you're filling and the resin. It remembers your usual picks so you're not choosing the same three things every hour.",
    },
    {
      chapter: work,
      selector: '[data-tour="pouring-step-2"]',
      explainAnyway: true,
      title: '2 · The lot check',
      body: 'Type the lot number printed on the container actually in front of you - never from memory or from the last one. A mismatch shakes and turns red, and is what catches a wrong cartridge before it\'s poured.',
    },
    {
      chapter: work,
      selector: '[data-tour="pouring-step-3"]',
      explainAnyway: true,
      title: '3 · What you poured',
      body: 'The good units you filled this hour. Type it in the big box, or use −10 and +10 to adjust. It\'s never carried over from last hour - always the real count.',
    },
    {
      chapter: work,
      selector: '[data-tour="more-details"]',
      explainAnyway: true,
      title: 'More details',
      body: "Scrap (empty and filled), a check weight, and notes, folded away so they don't get in the way. The line on the right says what's in there without opening it. Weigh one filled cartridge now and then - the gauge shows how close your fills are landing to target.",
    },
    {
      chapter: work,
      selector: '[data-tour="submit-bar"]',
      explainAnyway: true,
      title: 'Submit',
      body: "Stays at the bottom of the screen as you scroll. If something's still missing, tapping it shakes and tells you what.\n\nOnce it's logged you'll see a green tick. Typed something wrong? Undo last is there for two minutes.",
    },
  ]

  const packing: TourStep[] = [
    {
      chapter: work,
      selector: '[data-tour="tab-packing"]',
      before: () => { c.setPreview(true); c.setTab('packing') },
      title: 'The Packing tab',
      body: 'Where most of your shift goes: one entry per batch you pack. Each numbered card turns into a green tick once it\'s filled in.',
    },
    {
      chapter: work,
      selector: '[data-tour="packing-step-1"]',
      explainAnyway: true,
      title: '1 · Packing details',
      body: 'The container format, the resin, and the batch lot number being packed - read off the product, not from memory.',
    },
    {
      chapter: work,
      selector: '[data-tour="packing-step-2"]',
      explainAnyway: true,
      title: '2 · Units packed',
      body: 'The total good units packed, plus any notes about boxes or partial skids. Then submit - a green confirmation shows the moment it saves.',
    },
  ]

  const downtime: TourStep[] = [
    {
      chapter: 'When a pump stops',
      selector: '[data-tour="tab-downtime"]',
      before: () => { c.setPreview(true); c.setTab('downtime') },
      title: 'Downtime',
      body: "Any time a pump stops, log it here - even five minutes. It's the only way a pattern gets noticed and fixed.",
    },
    {
      chapter: 'When a pump stops',
      selector: '[data-tour="downtime-step-1"]',
      explainAnyway: true,
      title: '1 · Station & reason',
      body: 'Which pump stopped, and why - pick the closest reason from the list.',
    },
    {
      chapter: 'When a pump stops',
      selector: '[data-tour="downtime-step-2"]',
      explainAnyway: true,
      title: '2 · How long, and what fixed it',
      body: 'Tap Start timing when it stops and Stop when it\'s running again, or just type the minutes. Then a line on what fixed it ("cleaned the valve nozzle"). Nothing is recorded until you submit.',
    },
  ]

  const audit: TourStep[] = [
    {
      chapter: 'Photo checks',
      selector: '[data-tour="tab-audit"]',
      before: () => { c.setPreview(true); c.setTab('audit') },
      title: 'Photo checks',
      body: 'Quick photos of your station at a few points in the shift. The number on this tab is how many are still owed.',
    },
    {
      chapter: 'Photo checks',
      selector: '[data-tour="audit-checks"]',
      explainAnyway: true,
      title: 'Start, Transfer, End',
      body: 'Start: your first pump each shift (the checklist already covers it).\nTransfer: any later pump you stay at past a quick job - under 100 units needs no photo.\nEnd: whichever pump turns out to be your last.\n\nEach card says whether it\'s done, owed, or not needed yet.',
    },
    {
      chapter: 'Photo checks',
      selector: '[data-tour="end-shift"]',
      explainAnyway: true,
      title: "I'm ending my shift here",
      body: "The app can't know your last pump until you've stopped. When you're done for the day, tap this to log the end-of-shift photo for where you're standing, instead of waiting for it to guess.",
    },
    {
      chapter: 'Photo checks',
      selector: '[data-tour="checks-banner"]',
      title: 'Owed right now',
      body: "When a check is owed, this banner shows on every tab. Tap one to jump straight to logging it.",
    },
  ]

  const summary: TourStep[] = [
    {
      chapter: 'Your numbers',
      selector: '[data-tour="tab-summary"]',
      before: () => { c.setPreview(true); c.setTab('summary') },
      title: 'Your summary',
      body: 'Your own day at a glance, from everything you\'ve logged. Nothing here needs filling in.',
    },
    {
      chapter: 'Your numbers',
      selector: '[data-tour="summary-hero"]',
      explainAnyway: true,
      title: 'Today so far',
      body: 'Units and litres today, with your yield, scrap and best hour underneath. Tap the big number to see every log behind it.',
    },
    {
      chapter: 'Your numbers',
      selector: '[data-tour="summary-hours"]',
      title: 'Hour by hour',
      body: 'How each hour went, with your best one lit up - then splits by resin and by container further down.',
    },
    {
      chapter: 'Your numbers',
      selector: '[data-tour="summary-badges"]',
      title: 'Career badges',
      body: 'Milestones you\'ve earned over time. There\'s a small celebration on screen when you pass one.',
    },
  ]

  const finish: TourStep[] = [
    {
      chapter: 'Settings & help',
      selector: '[data-tour="account-panel"]',
      before: () => c.setAccountOpen(false),
      title: 'Account & Preferences',
      body: 'Your settings, feedback to management, and this tour again.',
    },
    {
      chapter: 'Settings & help',
      selector: '[data-tour="account-tabs"]',
      before: () => c.setAccountOpen(true),
      title: "What's in there",
      body: 'Account: your name, username and PIN.\nLook: the colour theme, how much the app animates (Full, Subtle or Off), and sound.\nFeedback: tell management what\'s not working.\nWhat\'s new: the latest changes.',
    },
    {
      chapter: 'Settings & help',
      selector: null,
      before: () => c.setAccountOpen(false),
      title: 'If the Wi-Fi drops',
      body: "Keep logging. Anything you submit without a connection waits on this device, a banner says how many are queued, and they send by themselves the moment the connection is back. Don't re-enter them.",
    },
    {
      chapter: 'End of shift',
      selector: '[data-tour="sign-out"]',
      title: 'Signing out',
      body: "At the end of your shift, sign out here. You'll get a quick recap of your day first - units, yield and anything you earned.",
    },
    {
      chapter: 'End of shift',
      selector: null,
      before: () => c.setPreview(false),
      title: "That's everything",
      body: 'You can take this tour again any time from Account & Preferences, and the Operator Guide (the ? button) has the full detail.',
    },
  ]

  return [
    ...inScreen(welcome, () => c.setPreview(false)),
    ...checklist,
    ...inScreen(isPacker ? packing : pouring, behind(mainTab)),
    ...inScreen(downtime, behind('downtime')),
    ...inScreen(audit, behind('audit')),
    ...inScreen(summary, behind('summary')),
    // Pointing at the header, which is the same on every tab - staying on
    // Summary just avoids a pointless switch.
    ...inScreen(finish.slice(0, -1), behind('summary')),
    ...finish.slice(-1),
  ]
}

/** The manager/admin walk: every page in the sidebar, in the order a day
 *  usually goes - the Cockpit's rounds, the live floor, the reactors, the
 *  weekly picture, then setup. Each chapter opens the page it's about, so
 *  what's being described is what's on screen. Pages this account can't see
 *  are left out entirely rather than toured into a 403. */
export function managerTourSteps(
  canAdminister: boolean,
  go: (key: TabKey) => void,
  canSee: (key: TabKey) => boolean = () => true,
): TourStep[] {
  const steps: TourStep[] = [
    {
      chapter: 'Welcome',
      selector: null,
      before: () => go('cockpit'),
      title: 'Welcome to the Manager Cockpit',
      body: "A walk through every page you have access to - about four minutes. Each part opens the page it's describing. Use Next and Back (or the arrow keys), or Skip tour any time.",
    },
    {
      chapter: 'Getting around',
      selector: '[data-tour="nav-cockpit"]',
      title: 'The sidebar',
      body: "Every page lives here. On a phone it's behind the ☰ button at the top. The arrow at its top corner folds it away for more room on a small monitor.",
    },
    {
      chapter: 'Manager Cockpit',
      selector: '[data-tour="daily-rounds"]',
      before: () => go('cockpit'),
      title: 'Daily rounds',
      body: 'Three things worth a look every day, in order: outstanding checklists and photos, downtime and scrap, and anything the floor has flagged for you. Each one says whether it needs you.',
    },
    {
      chapter: 'Manager Cockpit',
      selector: '[data-tour="today-strip"]',
      title: 'Today at a glance',
      body: "Poured today, pumps running, downtime and checks outstanding - updating every minute.\n\nClick any number here (or almost anywhere in the app) to see the exact logs behind it.",
    },
    {
      chapter: 'Manager Cockpit',
      selector: '[data-tour="what-was-poured"]',
      title: 'What was poured',
      body: 'The record: historical trends, scrap and yield, lot verification, batch and QC turnaround, the station photos, and who did their checks on any day.',
    },
    {
      chapter: 'Manager Cockpit',
      selector: '[data-tour="cockpit-floor"]',
      title: 'The floor',
      body: "Who's signed in and on which pump right now, and the wall display (TV mode) for a big screen on the floor.",
    },
    {
      chapter: 'Manager Cockpit',
      selector: '[data-tour="cockpit-setup"]',
      title: 'Setup - optional',
      body: 'Accounts and equipment, resin target weights, and fixing a log somebody entered wrong. None of it is needed to log a pour; set a piece up when you want what it gives you.',
    },
  ]

  if (canSee('scada')) {
    steps.push(
      {
        chapter: 'Live SCADA',
        selector: '[data-tour="nav-scada"]',
        before: () => go('scada'),
        explainAnyway: true,
        title: 'Live SCADA',
        body: 'The floor as it happens: output against pace, each pump, the leaderboard and every log as it lands.',
      },
      {
        chapter: 'Live SCADA',
        selector: '[data-tour="scada-filters"]',
        title: 'Filters',
        body: 'Live shift by default. Open this to look at a week, a month or one specific day, or narrow to a shift.',
      },
      {
        chapter: 'Live SCADA',
        selector: '[data-tour="scada-headline"]',
        title: 'The headline',
        body: "Litres poured this shift, and whether the floor is ahead of or behind pace right now - with the hour-by-hour trend beside it.",
      },
      {
        chapter: 'Live SCADA',
        selector: '[data-tour="scada-pouring"]',
        title: 'Pouring numbers',
        body: 'Volume, resin mass, run speed and yield. A card glows for a moment whenever its number changes.',
      },
      {
        chapter: 'Live SCADA',
        selector: '[data-tour="scada-trajectory"]',
        title: 'Shift trajectory',
        body: 'How far through the shift the floor is, and where it\'s heading if the current pace holds.',
      },
      {
        chapter: 'Live SCADA',
        selector: '[data-tour="scada-leaderboard"]',
        title: 'Leaderboard',
        body: 'Who has poured the most in this view. Places slide when they change hands.',
      },
      {
        chapter: 'Live SCADA',
        selector: '[data-tour="scada-log"]',
        title: 'The log',
        body: 'Every entry in this view, newest first by default - sort it by count to find the big hours. New ones slide in at the top as they arrive.',
      },
    )
  }

  if (canSee('reactors')) {
    steps.push(
      {
        chapter: 'Live Reactors',
        selector: '[data-tour="nav-reactors"]',
        before: () => go('reactors'),
        explainAnyway: true,
        title: 'Live Reactors',
        body: 'Every vessel on the floor, how full it is, and what\'s in it.',
      },
      {
        chapter: 'Live Reactors',
        selector: '[data-tour="reactor-fleet"]',
        title: 'The fleet',
        body: 'One card per reactor: its fill level (drawn down by each pour logged against it), the batch in it, and its QC result. A failed QC turns the card red.',
      },
      {
        chapter: 'Live Reactors',
        selector: '[data-tour="reactor-actions"]',
        title: 'Managing reactors',
        body: 'Add or retire vessels, mark one as freshly filled with a new batch, or log a bulk pour from a drum, tote or pail.',
      },
    )
  }

  if (canSee('analytics')) {
    steps.push(
      {
        chapter: 'Analytics Hub',
        selector: '[data-tour="nav-analytics"]',
        before: () => go('analytics'),
        explainAnyway: true,
        title: 'Analytics Hub',
        body: 'The rolling seven-day picture, for spotting trends a single shift hides.',
      },
      {
        chapter: 'Analytics Hub',
        selector: '[data-tour="analytics-ticker"]',
        title: 'Expectation vs projection',
        body: "Where today should be by now, and where it's projected to finish at the current rate.",
      },
      {
        chapter: 'Analytics Hub',
        selector: '[data-tour="analytics-kpis"]',
        title: 'The week',
        body: 'Units, first-pass yield, scrap and downtime over seven days - then velocity, downtime reasons, fill-weight accuracy and a heat map further down.',
      },
    )
  }

  if (canAdminister) {
    steps.push(
      {
        chapter: 'IT Admin',
        selector: '[data-tour="nav-admin"]',
        before: () => go('admin'),
        explainAnyway: true,
        title: 'IT Admin',
        body: 'Accounts, backups, updates and plant-wide settings.',
      },
      {
        chapter: 'IT Admin',
        selector: '[data-tour="admin-status"]',
        title: 'This PC at a glance',
        body: 'The version this PC is on and whether an update is waiting, when the database was last backed up, and how much is poured but not yet packed.',
      },
      {
        chapter: 'IT Admin',
        selector: '[data-tour="admin-tabs"]',
        title: 'The console',
        body: 'Users & roster (accounts, PINs, roles), suggestions from the floor, crash reports, backups and restore, plant configuration (pumps, shifts, rates), updates, and the release notes. A badge means something is waiting.',
      },
    )
  }

  steps.push(
    {
      chapter: 'Finishing up',
      selector: '[data-tour="nav-operator-form"]',
      before: () => go('cockpit'),
      title: 'The Operator Form',
      body: 'The screen operators use. As a manager you can log on somebody\'s behalf or test it, with Debug Mode choosing whose name it goes under.',
    },
    {
      chapter: 'Finishing up',
      selector: '[data-tour="tv-link"]',
      title: 'TV Mode',
      body: 'Opens the wall display in a new tab - put it full screen on a big monitor on the floor.',
    },
    {
      chapter: 'Finishing up',
      selector: '[data-tour="handbook-link"]',
      title: 'The operations handbook',
      body: 'The full written handbook - hand it to anyone new.',
    },
    {
      chapter: 'Finishing up',
      selector: '[data-tour="account-panel"]',
      title: "That's everything",
      body: 'Your theme, animations and sound, and this tour again any time, live under Account & Preferences.',
    },
  )

  return steps
}
