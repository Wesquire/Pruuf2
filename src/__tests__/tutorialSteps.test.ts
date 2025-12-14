/**
 * Tutorial Steps Tests
 */

import {tutorialSteps} from '../constants/tutorialSteps';

describe('tutorialSteps', () => {
  it('should have at least one step', () => {
    expect(tutorialSteps.length).toBeGreaterThan(0);
  });

  it('should have all required fields for each step', () => {
    tutorialSteps.forEach(step => {
      expect(step).toHaveProperty('id');
      expect(step).toHaveProperty('title');
      expect(step).toHaveProperty('description');
      expect(step).toHaveProperty('icon');
      expect(step.id).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.icon).toBeTruthy();
    });
  });

  it('should have unique step IDs', () => {
    const ids = tutorialSteps.map(step => step.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have welcome step first', () => {
    expect(tutorialSteps[0].id).toBe('welcome');
  });

  it('should have ready step last', () => {
    expect(tutorialSteps[tutorialSteps.length - 1].id).toBe('ready');
  });

  it('should have check-in, contacts, and notifications steps', () => {
    const stepIds = tutorialSteps.map(s => s.id);
    expect(stepIds).toContain('check-in');
    expect(stepIds).toContain('contacts');
    expect(stepIds).toContain('notifications');
  });
});
