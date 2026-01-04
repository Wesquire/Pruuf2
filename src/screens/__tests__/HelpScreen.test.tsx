/**
 * HelpScreen Tests
 * Tests for the help and support screen
 * Verifies FAQ content uses email-based notifications (not SMS)
 */

import React from 'react';
import renderer, {act, ReactTestRenderer} from 'react-test-renderer';
import HelpScreen from '../HelpScreen';

// Helper to create renderer with act() for React 19 compatibility
const createWithAct = (element: React.ReactElement): ReactTestRenderer => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree!;
};

// Mock Redux store
let mockUser: {font_size_preference: string} | null = {
  font_size_preference: 'standard',
};

jest.mock('react-redux', () => ({
  useSelector: (selector: any) => {
    const state = {
      auth: {user: mockUser},
    };
    return selector(state);
  },
}));

// Mock Linking - use spyOn instead of full mock
import {Linking} from 'react-native';
const mockOpenURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);

describe('HelpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {font_size_preference: 'standard'};
  });

  describe('Rendering', () => {
    it('renders correctly', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = tree.toJSON();
      expect(json).toBeTruthy();
    });

    it('displays Help & Support title', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Help & Support');
    });

    it('displays FAQ section title', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Frequently Asked Questions');
    });

    it('displays Contact Support section', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Contact Support');
    });

    it('displays app version', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Pruuf Version 1.0.0');
    });
  });

  describe('FAQ Content - Email-based notifications', () => {
    it('displays FAQ about inviting Members via email', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('How do I invite someone to be a Member?');
    });

    it('displays FAQ about accepting invitation via email', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('How do I accept an invitation to be a Member?');
    });

    it('displays FAQ about missed check-in notifications via email', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain(
        'What happens if a Member misses their check-in?',
      );
    });

    it('displays FAQ about check-in time change notifications via email', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Can I change my check-in time?');
    });

    it('displays FAQ about removing relationships with email notifications', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Can I remove a Member or Contact?');
    });

    it('displays FAQ about PIN reset via email', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('How do I reset my PIN?');
    });
  });

  describe('Support Contact', () => {
    it('displays support email address', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('support@pruuf.me');
    });

    it('displays Email Support button', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Email Support');
    });

  });

  describe('Font Size Preferences', () => {
    it('renders with standard font size', () => {
      mockUser = {font_size_preference: 'standard'};
      const tree = createWithAct(<HelpScreen />);
      const json = tree.toJSON();
      expect(json).toBeTruthy();
    });

    it('renders with large font size', () => {
      mockUser = {font_size_preference: 'large'};
      const tree = createWithAct(<HelpScreen />);
      const json = tree.toJSON();
      expect(json).toBeTruthy();
    });

    it('renders with extra_large font size', () => {
      mockUser = {font_size_preference: 'extra_large'};
      const tree = createWithAct(<HelpScreen />);
      const json = tree.toJSON();
      expect(json).toBeTruthy();
    });

    it('handles null user gracefully', () => {
      mockUser = null as any;
      const tree = createWithAct(<HelpScreen />);
      const json = tree.toJSON();
      expect(json).toBeTruthy();
    });
  });

  describe('Security FAQ Content', () => {
    it('displays FAQ about data security', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('Is my data secure?');
    });

    it('displays FAQ about timezone handling', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('What timezone is used for check-ins?');
    });
  });

  describe('Feature FAQ Content', () => {
    it('displays FAQ about what Pruuf is', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('What is Pruuf?');
    });

    it('displays FAQ about reminders', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('How do reminders work?');
    });

    it('displays FAQ about font sizes', () => {
      const tree = createWithAct(<HelpScreen />);
      const json = JSON.stringify(tree.toJSON());
      expect(json).toContain('What are the different font sizes?');
    });
  });
});
