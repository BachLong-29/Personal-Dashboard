import type { Goal, Trophy } from '../types';

const ms = (...labels: [string, boolean][]): Goal['milestones'] =>
  labels.map(([label, done], i) => ({ id: `ms-${i + 1}`, label, done }));

export const MOCK_GOALS: Goal[] = [
  {
    id: 'g01', title: 'Ship Aetheria v2', cat: 'career', rank: 'S', priority: 'high',
    status: 'in-progress', progress: 0.62, xp: 880, coins: 240,
    targetDate: '2026-07-15', targetLabel: 'Jul 15', createdAt: 'Feb 02', daysLeft: 31,
    desc: 'Lead the full redesign and public launch of the Aetheria platform — design system, onboarding, and the gamified core loop.',
    note: 'The capstone saga of the year. Completing this unlocks the \'Realm Architect\' trophy and a 2.0× XP surge.',
    linkedTrophy: 'Realm Architect',
    milestones: ms(
      ['Define the v2 design language', true],
      ['Rebuild the component library', true],
      ['Ship onboarding flow', true],
      ['Migrate the dashboard', false],
      ['Public beta launch', false],
      ['1.0 release & retrospective', false],
    ),
  },
  {
    id: 'g02', title: 'Run a Half Marathon', cat: 'health', rank: 'A', priority: 'high',
    status: 'in-progress', progress: 0.45, xp: 520, coins: 140,
    targetDate: '2026-09-20', targetLabel: 'Sep 20', createdAt: 'Mar 10', daysLeft: 98,
    desc: 'Train from a 5K base to a sub-2-hour half marathon. Build the long-run habit and respect the taper.',
    note: 'Week 7 of 18. Longest run so far: 16 km. Keep the cadence honest.',
    linkedTrophy: 'Iron Lungs',
    milestones: ms(
      ['Build a 5K base', true],
      ['Reach 10K continuous', true],
      ['Complete a 15K long run', false],
      ['Run a sub-2h half', false],
    ),
  },
  {
    id: 'g03', title: 'Learn Japanese — N4', cat: 'learning', rank: 'B', priority: 'medium',
    status: 'in-progress', progress: 0.38, xp: 460, coins: 120,
    targetDate: '2026-12-05', targetLabel: 'Dec 05', createdAt: 'Jan 15', daysLeft: 174,
    desc: 'Reach JLPT N4 proficiency — ~300 kanji, core grammar, and conversational footing.',
    note: 'Anki streak holding at 41 days. Grammar is the bottleneck; double the reading reps.',
    milestones: ms(
      ['Master hiragana & katakana', true],
      ['Learn 100 core kanji', true],
      ['Complete N5 grammar', true],
      ['Reach 300 kanji', false],
      ['Pass an N4 mock test', false],
    ),
  },
  {
    id: 'g04', title: 'Build a 6-Month Runway', cat: 'finance', rank: 'A', priority: 'high',
    status: 'in-progress', progress: 0.74, xp: 600, coins: 160,
    targetDate: '2026-08-01', targetLabel: 'Aug 01', createdAt: 'Nov 20', daysLeft: 48,
    desc: 'Save six months of expenses into a liquid emergency fund. Automate transfers, cut three subscriptions.',
    note: 'On pace — 4.4 of 6 months banked. Automation removed all the willpower from the equation.',
    linkedTrophy: 'Vault Keeper',
    milestones: ms(
      ['Automate monthly transfers', true],
      ['Cancel unused subscriptions', true],
      ['Reach 3 months saved', true],
      ['Reach 6 months saved', false],
    ),
  },
  {
    id: 'g05', title: 'Write a Novella', cat: 'personal', rank: 'A', priority: 'medium',
    status: 'in-progress', progress: 0.30, xp: 540, coins: 150,
    targetDate: '2026-11-01', targetLabel: 'Nov 01', createdAt: 'Apr 01', daysLeft: 140,
    desc: 'Draft a 30,000-word fantasy novella. 500 words a day, no editing until the first draft is done.',
    note: '9,200 words in. The middle is always the swamp — keep the daily pact.',
    milestones: ms(
      ['Outline the three acts', true],
      ['Write Act I', true],
      ['Write Act II', false],
      ['Write Act III', false],
      ['Complete first draft', false],
    ),
  },
  {
    id: 'g06', title: 'Launch a Side Project', cat: 'career', rank: 'B', priority: 'medium',
    status: 'not-started', progress: 0, xp: 420, coins: 110,
    targetDate: '2026-10-10', targetLabel: 'Oct 10', createdAt: 'Jun 01', daysLeft: 118,
    desc: 'Take a weekend tool from idea to 100 users. Validate first, build second, ship publicly.',
    note: 'Queued behind v2. Validation interviews can start in parallel.',
    milestones: ms(
      ['Run 10 problem interviews', false],
      ['Build an MVP', false],
      ['Launch on a community', false],
      ['Reach 100 users', false],
    ),
  },
  {
    id: 'g07', title: 'Meditate 100 Days', cat: 'personal', rank: 'C', priority: 'low',
    status: 'in-progress', progress: 0.67, xp: 300, coins: 80,
    targetDate: '2026-07-28', targetLabel: 'Jul 28', createdAt: 'Apr 19', daysLeft: 44,
    desc: 'A 100-day unbroken meditation streak. Ten minutes every morning before the world wakes.',
    note: 'Day 67. Two near-misses survived by meditating at 11:55pm — the streak is sacred.',
    linkedTrophy: 'Still Mind',
    milestones: ms(
      ['Reach a 21-day streak', true],
      ['Reach a 50-day streak', true],
      ['Reach a 75-day streak', false],
      ['Reach 100 days', false],
    ),
  },
  {
    id: 'g08', title: 'Read 24 Books', cat: 'learning', rank: 'C', priority: 'low',
    status: 'in-progress', progress: 0.58, xp: 360, coins: 90,
    targetDate: '2026-12-31', targetLabel: 'Dec 31', createdAt: 'Jan 01', daysLeft: 200,
    desc: 'Two books a month across fiction and craft. Keep a one-page note for each.',
    note: '14 of 24 read. Ahead of pace — reward yourself with a long fiction binge.',
    milestones: ms(
      ['Read 6 books', true],
      ['Read 12 books', true],
      ['Read 18 books', false],
      ['Read 24 books', false],
    ),
  },
  {
    id: 'g09', title: 'Master the Design System', cat: 'career', rank: 'S', priority: 'high',
    status: 'completed', progress: 1, xp: 720, coins: 200,
    targetDate: '2026-05-01', targetLabel: 'May 01', createdAt: 'Dec 01', daysLeft: 0, completedDate: 'Apr 28',
    desc: 'Author the complete Aetheria UI kit — 72 components, full token system, documented and shipped.',
    note: 'Completed 3 days early. Unlocked the \'System Sage\' trophy and a 1.5× combo.',
    linkedTrophy: 'System Sage',
    milestones: ms(
      ['Define all design tokens', true],
      ['Build core components', true],
      ['Build the game layer', true],
      ['Document & publish', true],
    ),
  },
  {
    id: 'g10', title: 'Quit Sugar for 30 Days', cat: 'health', rank: 'B', priority: 'medium',
    status: 'completed', progress: 1, xp: 320, coins: 90,
    targetDate: '2026-04-10', targetLabel: 'Apr 10', createdAt: 'Mar 11', daysLeft: 0, completedDate: 'Apr 10',
    desc: 'Thirty days with no added sugar. Reset the palate, break the afternoon crash loop.',
    note: 'Day 31 felt easier than day 3. Energy is steadier; the craving lost its grip.',
    linkedTrophy: 'Clean Slate',
    milestones: ms(
      ['Clear the pantry', true],
      ['Survive week one', true],
      ['Reach day 30', true],
    ),
  },
  {
    id: 'g11', title: 'Give a Conference Talk', cat: 'career', rank: 'A', priority: 'medium',
    status: 'completed', progress: 1, xp: 480, coins: 130,
    targetDate: '2026-03-22', targetLabel: 'Mar 22', createdAt: 'Jan 05', daysLeft: 0, completedDate: 'Mar 22',
    desc: 'Deliver a 25-minute talk on gamified productivity to a live audience of 200.',
    note: 'Nerves and all — landed the demo. Three people asked to collaborate afterward.',
    linkedTrophy: 'Stage Lit',
    milestones: ms(
      ['Submit a proposal', true],
      ['Get accepted', true],
      ['Rehearse five times', true],
      ['Deliver the talk', true],
    ),
  },
  {
    id: 'g12', title: 'Learn the Violin', cat: 'personal', rank: 'C', priority: 'low',
    status: 'archived', progress: 0.15, xp: 280, coins: 70,
    targetDate: '2026-06-01', targetLabel: 'Jun 01', createdAt: 'Jan 20', daysLeft: 0,
    desc: 'Pick up the violin from scratch. Aim for one simple folk tune by summer.',
    note: 'Archived — clashed with the marathon training block. Parked, not abandoned.',
    milestones: ms(
      ['Rent an instrument', true],
      ['Learn to hold the bow', false],
      ['Play an open-string tune', false],
    ),
  },
];

export const MOCK_TROPHIES: Trophy[] = [
  {
    id: 't01', name: 'System Sage', tier: 'gold', icon: '⚜', unlocked: true, date: 'Apr 28', reward: '+720 XP',
    desc: 'Authored a complete design system, end to end.', linkedGoal: 'Master the Design System', recent: true,
  },
  {
    id: 't02', name: 'Stage Lit', tier: 'silver', icon: '✦', unlocked: true, date: 'Mar 22', reward: '+480 XP',
    desc: 'Delivered a talk to a live audience of 200.', linkedGoal: 'Give a Conference Talk', recent: true,
  },
  {
    id: 't03', name: 'Clean Slate', tier: 'bronze', icon: '❀', unlocked: true, date: 'Apr 10', reward: '+320 XP',
    desc: 'Completed a 30-day no-sugar challenge.', linkedGoal: 'Quit Sugar for 30 Days', recent: true,
  },
  {
    id: 't04', name: 'First Light', tier: 'bronze', icon: '◐', unlocked: true, date: 'Jan 09', reward: '+100 XP',
    desc: 'Completed your very first ambition.', linkedGoal: 'Morning Routine',
  },
  {
    id: 't05', name: 'Streak Warden', tier: 'silver', icon: '✷', unlocked: true, date: 'Feb 14', reward: '+260 XP',
    desc: 'Held a 30-day completion streak.', linkedGoal: 'Daily Discipline',
  },
  {
    id: 't06', name: 'Polymath', tier: 'silver', icon: '◈', unlocked: true, date: 'Mar 01', reward: '+300 XP',
    desc: 'Made progress across five categories in one week.', linkedGoal: 'Balanced Quarter',
  },
  {
    id: 't07', name: 'Realm Architect', tier: 'legendary', icon: '♛', unlocked: false, progress: 0.62,
    desc: 'Ship Aetheria v2 to the public.', linkedGoal: 'Ship Aetheria v2',
  },
  {
    id: 't08', name: 'Iron Lungs', tier: 'gold', icon: '❂', unlocked: false, progress: 0.45,
    desc: 'Finish a half marathon under two hours.', linkedGoal: 'Run a Half Marathon',
  },
  {
    id: 't09', name: 'Vault Keeper', tier: 'gold', icon: '◆', unlocked: false, progress: 0.74,
    desc: 'Bank a full six-month financial runway.', linkedGoal: 'Build a 6-Month Runway',
  },
  {
    id: 't10', name: 'Still Mind', tier: 'silver', icon: '✧', unlocked: false, progress: 0.67,
    desc: 'Meditate for 100 unbroken days.', linkedGoal: 'Meditate 100 Days',
  },
  {
    id: 't11', name: 'Centurion', tier: 'legendary', icon: '★', unlocked: false, progress: 0.41,
    desc: 'Complete 100 ambitions all-time.', linkedGoal: '41 / 100 complete',
  },
  {
    id: 't12', name: 'Bibliophile', tier: 'bronze', icon: '▦', unlocked: false, progress: 0.58,
    desc: 'Read 24 books in a single year.', linkedGoal: 'Read 24 Books',
  },
];
