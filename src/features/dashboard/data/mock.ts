import type { Achievement, Analytics, Character, Quest, ScheduleItem } from '../types';

export const MOCK_CHARACTER: Character = {
  name: 'Aria Solveig',
  title: 'Shadow Weaver',
  level: 24,
  rank: 'A',
  class: 'Mage',
  streak: 7,
  xp: 3400,
  xpNext: 5000,
  coins: 320,
  gems: 15,
  stats: [
    { key: 'INT', value: 82, color: '#c4b5fd' },
    { key: 'FOC', value: 74, color: '#7dd3fc' },
    { key: 'WIL', value: 68, color: '#6ee7b7' },
    { key: 'VIT', value: 55, color: '#f87171' },
  ],
};

export const MOCK_QUESTS: Quest[] = [
  { id: 1, title: 'Morning Deep Work', desc: 'Focus session before distractions hit', type: 'focus', difficulty: 'A', xp: 120, coins: 30, done: false, tags: ['focus'] },
  { id: 2, title: 'Daily Exercise', desc: '30 min workout or walk', type: 'health', difficulty: 'B', xp: 90, coins: 25, done: false, tags: ['health'] },
  { id: 3, title: 'Read 30 Pages', desc: 'Non-fiction reading block', type: 'reflect', difficulty: 'C', xp: 60, coins: 15, done: true, tags: ['reflect'] },
  { id: 4, title: 'Clear Inbox', desc: 'Process all emails to zero', type: 'admin', difficulty: 'C', xp: 60, coins: 15, done: false, tags: ['admin'] },
];

export const MOCK_SCHEDULE: ScheduleItem[] = [
  { time: '06:00', label: 'Wake & Meditate', type: 'reflect', done: true },
  { time: '07:00', label: 'Morning Workout', type: 'health', done: true },
  { time: '08:30', label: 'Deep Work Block', type: 'focus', done: false },
  { time: '12:00', label: 'Lunch Break', type: 'break', done: false },
  { time: '13:00', label: 'Creative Session', type: 'create', done: false },
  { time: '15:30', label: 'Admin & Emails', type: 'admin', done: false },
  { time: '18:00', label: 'Evening Habits', type: 'habit', done: false },
  { time: '21:00', label: 'Reflect & Journal', type: 'reflect', done: false },
];

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'firstS', title: 'S-Rank', desc: 'Complete an S-Rank quest', icon: '⭐', earned: false },
  { id: 'streak7', title: '7-Day Streak', desc: 'Maintain a 7-day streak', icon: '🔥', earned: true },
  { id: 'perfect', title: 'Perfect Day', desc: 'Complete all daily quests', icon: '✦', earned: false },
  { id: 'focus10', title: 'Focus Master', desc: 'Log 10 focus sessions', icon: '🎯', earned: true },
  { id: 'guild', title: 'Guild Member', desc: 'Join a guild', icon: '🏰', earned: true },
  { id: 'level20', title: 'Level 20', desc: 'Reach level 20', icon: '🧙', earned: true },
];

export const MOCK_ANALYTICS: Analytics = {
  weeklyXP: [420, 650, 380, 710, 520, 480, 600],
  focusHours: [2.5, 4.0, 1.5, 3.5, 2.0, 3.0, 2.8],
  tasksDone: [4, 6, 3, 7, 5, 4, 5],
  weekLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};
