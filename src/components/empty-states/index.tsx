/**
 * Empty State Components Export
 * Item 33: Add Empty States (LOW)
 */

export {EmptyState} from './EmptyState';
export type {EmptyStateProps} from './EmptyState';

// Pre-configured empty states for common scenarios
import React from 'react';
import {EmptyState, EmptyStateProps} from './EmptyState';

export const NoCheckInsEmptyState: React.FC<
  Partial<EmptyStateProps>
> = props => (
  <EmptyState
    icon="calendar"
    title="No Check-ins Yet"
    message="Your check-in history will appear here once you start checking in daily."
    {...props}
  />
);

export const NoContactsEmptyState: React.FC<
  Partial<EmptyStateProps>
> = props => (
  <EmptyState
    icon="users"
    title="No Contacts Yet"
    message="Add contacts who will be notified if you miss your daily check-in."
    {...props}
  />
);

export const NoMembersEmptyState: React.FC<
  Partial<EmptyStateProps>
> = props => (
  <EmptyState
    icon="user-plus"
    title="No Members Yet"
    message="Add family members or loved ones to monitor their daily check-ins."
    {...props}
  />
);

export const NoNotificationsEmptyState: React.FC<
  Partial<EmptyStateProps>
> = props => (
  <EmptyState
    icon="bell-off"
    title="No Notifications"
    message="You're all caught up! Notifications will appear here."
    {...props}
  />
);

export const SearchEmptyState: React.FC<Partial<EmptyStateProps>> = props => (
  <EmptyState
    icon="search"
    title="No Results Found"
    message="Try adjusting your search terms or filters."
    {...props}
  />
);

export const ErrorEmptyState: React.FC<Partial<EmptyStateProps>> = props => (
  <EmptyState
    icon="alert-circle"
    title="Something Went Wrong"
    message="We couldn't load this content. Please try again."
    actionText="Try Again"
    {...props}
  />
);

export const OfflineEmptyState: React.FC<Partial<EmptyStateProps>> = props => (
  <EmptyState
    icon="wifi-off"
    title="No Internet Connection"
    message="Check your connection and try again."
    actionText="Retry"
    {...props}
  />
);
