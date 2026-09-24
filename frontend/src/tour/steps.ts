import type { TabKey } from '../ManagerShell'
import type { TourStep } from './TourOverlay'

type OperatorTabKey = 'pouring' | 'packing' | 'downtime' | 'audit' | 'summary'

/** Everything an operator or packer needs to get through one shift, in the
 *  order they'd actually hit it: sign in, clear the checklist, log an hour,
 *  handle a stop, keep up with photo checks, check their own numbers, sign
 *  out. Points at the exact same [data-tour] elements the real screens use,
 *  so nothing here can drift out of sync with a relabelled button the way a
 *  written guide can. */
export function operatorTourSteps(isPacker: boolean, setTab: (t: OperatorTabKey) => void): TourStep[] {
  const mainTab: OperatorTabKey = isPacker ? 'packing' : 'pouring'
  return [
    {
      selector: null,
      title: 'Welcome to the Pouring Log',
      body: "This is a quick walk through everything you'll touch during a shift - about a minute. Use Next to move through it, or Skip tour any time.",
    },
    {
      selector: '[data-tour="identity"]',
      title: 'This is you',
      body: 'Your name and which shift you\'re on. If this looks wrong, sign out and back in, or ask a manager to check your account.',
    },
    {
      selector: '[data-tour="operator-guide-link"]',
      title: 'The full written guide',
      body: "This opens the Operator Guide PDF in a new tab - the complete instructions for every screen, any time you need them mid-shift.",
    },
    {
      selector: '[data-tour="checklist-step-1"]',
      title: 'Start-of-shift photo',
      body: "First thing every shift: a quick photo (or tick 'station is clean' to skip it) showing the pump is ready to go.",
    },
    {
      selector: '[data-tour="checklist-step-2"]',
      title: 'Final verification',
      body: 'Confirm the QR checksheet and your materials are staged, then submit to unlock the rest of the app.',
    },
    {
      selector: `[data-tour="tab-${mainTab}"]`,
      before: () => setTab(mainTab),
      title: isPacker ? 'The Packing tab' : 'The Pouring tab',
      body: isPacker
        ? "This is where you'll spend most of your shift - one entry per batch you pack."
        : "This is where you'll spend most of your shift - one entry per hour you pour.",
    },
    ...(isPacker
      ? [{
        selector: '[data-tour="packing-step-1"]',
        title: 'Packing details',
        body: 'Container format, resin, and the lot number being packed.',
      } satisfies TourStep]
      : [
        {
          selector: '[data-tour="pouring-step-1"]',
          title: 'Station & material',
          body: "Pick your station, container and resin. It remembers your usual picks so you're not retyping the same three things every hour.",
        } satisfies TourStep,
        {
          selector: '[data-tour="pouring-step-2"]',
          title: 'The lot check',
          body: "Always read the lot number off the actual container in front of you - never type it from memory. This is what catches a wrong cartridge before it's poured.",
        } satisfies TourStep,
        {
          selector: '[data-tour="pouring-step-3"]',
          title: 'What you poured',
          body: "Type the real count - never carried over automatically. Submit, and you'll see a confirmation the moment it saves.",
        } satisfies TourStep,
      ]),
    {
      selector: '[data-tour="tab-downtime"]',
      before: () => setTab('downtime'),
      title: 'Downtime',
      body: "If a pump stops for any reason, log it here - even five minutes. It's the only way a pattern ever gets noticed.",
    },
    {
      selector: '[data-tour="tab-audit"]',
      before: () => setTab('audit'),
      title: 'Your photo checks',
      body: "Start, transfer, and end-of-shift photos - the app tells you exactly what's owed and when. If you're finishing up, use \"I'm ending my shift here\" instead of waiting for the app to guess.",
    },
    {
      selector: '[data-tour="tab-summary"]',
      before: () => setTab('summary'),
      title: 'Your summary',
      body: "Your pace, your accuracy, your badges, and how you're ranking today - all in one place.",
    },
    {
      selector: '[data-tour="account-panel"]',
      title: 'Account & Preferences',
      body: 'Change your theme, turn sound on or off, send feedback to management, or take this tour again from here.',
    },
    {
      selector: '[data-tour="sign-out"]',
      title: "That's everything",
      body: 'Sign out here when your shift ends. Take this tour again any time from Account & Preferences.',
    },
  ]
}

/** The manager/admin walk: the Cockpit's daily-rounds routine, where the
 *  live floor numbers live, and where the written handbook is - deliberately
 *  shorter than the operator tour, since a manager's day starts with "what
 *  needs my attention" rather than a fixed sequence of steps. */
export function managerTourSteps(canAdminister: boolean, go: (key: TabKey) => void): TourStep[] {
  return [
    {
      selector: null,
      title: 'Welcome to the Manager Cockpit',
      body: "A quick walk through where things live: your daily rounds, the live floor dashboard, and the written handbook. Skip tour any time.",
    },
    {
      selector: '[data-tour="nav-cockpit"]',
      before: () => go('cockpit'),
      title: 'Manager Cockpit',
      body: 'Home. Everything below reads what operators have already logged - nothing here needs filling in.',
    },
    {
      selector: '[data-tour="daily-rounds"]',
      title: 'Daily rounds',
      body: "Three things worth a look every day: outstanding checklists and photos, downtime and scrap, and anything the floor has flagged for you.",
    },
    {
      selector: '[data-tour="today-strip"]',
      title: "Today, at a glance",
      body: 'Poured today, pumps running, downtime, and checks outstanding. Click any tile to see the rows behind it.',
    },
    {
      selector: '[data-tour="what-was-poured"]',
      title: 'What was poured',
      body: 'Historical trends, scrap intelligence, lot verification, and batch/QC turnaround - all one click away from here.',
    },
    {
      selector: '[data-tour="nav-scada"]',
      before: () => go('scada'),
      title: 'Live SCADA',
      body: "The live floor dashboard - pace against target, the pouring leaderboard, and today's log stream as it happens.",
    },
    ...(canAdminister
      ? [{
        selector: '[data-tour="nav-admin"]',
        before: () => go('admin'),
        title: 'IT Admin',
        body: 'Accounts, backups, software updates, and plant-wide settings all live here.',
      } satisfies TourStep]
      : []),
    {
      selector: '[data-tour="handbook-link"]',
      title: 'The operations handbook',
      body: "The full written handbook, one click away in the sidebar any time - hand this to anyone new.",
    },
    {
      selector: '[data-tour="account-panel"]',
      title: "That's everything",
      body: 'Your theme, and this tour again any time, live under Account & Preferences.',
    },
  ]
}
