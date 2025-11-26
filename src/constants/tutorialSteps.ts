/**
 * Tutorial Steps
 * Item 30: Add In-App Tutorial (LOW)
 *
 * Defines the steps for the in-app tutorial
 */

import { TutorialStep } from '../components/Tutorial';
import { colors } from '../theme';

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Pruuf',
    description:
      'Pruuf helps you and your loved ones stay connected through daily check-ins. Let us show you how it works.',
    icon: 'heart',
    iconColor: colors.primaryLight,
  },
  {
    id: 'check-in',
    title: 'Daily Check-Ins',
    description:
      'Set a time each day to check in. Simply tap "I\'m OK" to let your contacts know you\'re safe.',
    icon: 'check-circle',
    iconColor: colors.successLight,
  },
  {
    id: 'contacts',
    title: 'Add Contacts',
    description:
      'Invite family members or friends to be your contacts. They\'ll be notified if you miss a check-in.',
    icon: 'users',
    iconColor: colors.accentLight,
  },
  {
    id: 'notifications',
    title: 'Stay Notified',
    description:
      'Receive reminders before your check-in time and notifications about your contacts\' check-ins.',
    icon: 'bell',
    iconColor: colors.warningLight,
  },
  {
    id: 'ready',
    title: 'You\'re All Set!',
    description:
      'You\'re ready to start using Pruuf. Tap "Get Started" to begin your journey to peace of mind.',
    icon: 'smile',
    iconColor: colors.primaryLight,
  },
];
