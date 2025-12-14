import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';

interface FAQItem {
  question: string;
  answer: string;
}

const HelpScreen: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const fontSize = user?.font_size_preference || 'standard';

  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    if (expandedItems.includes(index)) {
      setExpandedItems(expandedItems.filter(i => i !== index));
    } else {
      setExpandedItems([...expandedItems, index]);
    }
  };

  const faqItems: FAQItem[] = [
    {
      question: 'What is Pruuf?',
      answer:
        'Pruuf is a daily check-in safety app that helps families stay connected. Members (elderly adults) check in daily, and their Contacts (family members) are notified if they miss a check-in.',
    },
    {
      question: 'Who pays for Pruuf?',
      answer:
        'Contacts pay $3.99/month after a 30-day free trial. Members never pay. If you are ever monitored as a Member, you get free access forever, even if your Contacts later remove you.',
    },
    {
      question: 'What is the grandfathered free access?',
      answer:
        'Once you become a Member (someone monitoring you), you automatically get free access to Pruuf forever. Even if all your Contacts remove you later, you never have to pay.',
    },
    {
      question: 'How do I invite someone to be a Member?',
      answer:
        'As a Contact, tap "Add Member" on the home screen. Enter their name and phone number. They\'ll receive an SMS with an invite code to download the app and accept your invitation.',
    },
    {
      question: 'How do I accept an invitation to be a Member?',
      answer:
        'Download the Pruuf app and create an account using the phone number where you received the invitation. During onboarding, tap "I have an invite code" and enter the 6-character code from the SMS.',
    },
    {
      question: 'What happens if a Member misses their check-in?',
      answer:
        'All of the Member\'s Contacts receive an SMS and push notification alerting them to the missed check-in. Contacts should reach out to ensure the Member is safe.',
    },
    {
      question: 'Can I change my check-in time?',
      answer:
        'Yes. Members can change their check-in time in Settings. All Contacts will be notified of the change via SMS and push notification.',
    },
    {
      question: 'How do reminders work?',
      answer:
        'Members can enable check-in reminders in Notification Settings. You can choose to be reminded 15 minutes, 30 minutes, or 1 hour before your check-in time.',
    },
    {
      question: 'What happens if I don\'t pay my subscription?',
      answer:
        'If a payment fails, you have 7 days to update your payment method. During this time, your account is in "past_due" status but still works. After 7 days, your account is frozen and you lose access until payment is updated.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer:
        'Go to Settings > Subscription > Cancel Subscription. Your subscription will remain active until the end of your current billing period, then automatically cancel.',
    },
    {
      question: 'Can I remove a Member or Contact?',
      answer:
        'Yes. Tap on the Member or Contact, then tap "Remove Relationship". Both parties will be notified via SMS. The relationship can be re-established later if needed.',
    },
    {
      question: 'What are the different font sizes?',
      answer:
        'Pruuf offers three font sizes: Standard, Large, and Extra Large. You can change your preference in Settings > Font Size.',
    },
    {
      question: 'Is my data secure?',
      answer:
        'Yes. All data is encrypted in transit and at rest. We use industry-standard security practices including PIN hashing with bcrypt and JWT authentication.',
    },
    {
      question: 'What timezone is used for check-ins?',
      answer:
        'Each Member can set their own timezone. Check-in times and alerts are calculated based on the Member\'s local timezone, even if Contacts are in different timezones.',
    },
    {
      question: 'How do I reset my PIN?',
      answer:
        'On the login screen, tap "Forgot PIN?". Enter your phone number to receive a verification code. After verifying, you can set a new 4-digit PIN.',
    },
  ];

  const supportEmail = 'support@pruuf.com';
  const supportPhone = '+1-800-PRUUF-00';

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${supportEmail}?subject=Pruuf Support Request`);
  };

  const handleCallSupport = () => {
    Linking.openURL(`tel:${supportPhone}`);
  };

  const baseFontSize = FONT_SIZES[fontSize];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: baseFontSize * 1.8 }]}>
            Help & Support
          </Text>
          <Text style={[styles.subtitle, { fontSize: baseFontSize * 1.1 }]}>
            Find answers to common questions
          </Text>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { fontSize: baseFontSize * 1.4 }]}
          >
            Frequently Asked Questions
          </Text>

          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <TouchableOpacity
                onPress={() => toggleItem(index)}
                style={styles.faqQuestionContainer}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.faqQuestion,
                    { fontSize: baseFontSize * 1.1 },
                  ]}
                >
                  {item.question}
                </Text>
                <Text
                  style={[styles.faqIcon, { fontSize: baseFontSize * 1.5 }]}
                >
                  {expandedItems.includes(index) ? '−' : '+'}
                </Text>
              </TouchableOpacity>

              {expandedItems.includes(index) && (
                <View style={styles.faqAnswerContainer}>
                  <Text
                    style={[
                      styles.faqAnswer,
                      { fontSize: baseFontSize * 1.0 },
                    ]}
                  >
                    {item.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Support Section */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { fontSize: baseFontSize * 1.4 }]}
          >
            Contact Support
          </Text>

          <Text style={[styles.supportText, { fontSize: baseFontSize * 1.0 }]}>
            Can't find what you're looking for? Our support team is here to
            help.
          </Text>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleEmailSupport}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.supportButtonText,
                { fontSize: baseFontSize * 1.1 },
              ]}
            >
              Email Support
            </Text>
            <Text
              style={[
                styles.supportButtonSubtext,
                { fontSize: baseFontSize * 0.9 },
              ]}
            >
              {supportEmail}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={handleCallSupport}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.supportButtonText,
                { fontSize: baseFontSize * 1.1 },
              ]}
            >
              Call Support
            </Text>
            <Text
              style={[
                styles.supportButtonSubtext,
                { fontSize: baseFontSize * 0.9 },
              ]}
            >
              {supportPhone}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { fontSize: baseFontSize * 0.9 }]}>
            Pruuf Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  title: {
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.white,
    opacity: 0.9,
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  faqItem: {
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  faqQuestion: {
    flex: 1,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  faqIcon: {
    color: COLORS.primary,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
  },
  faqAnswerContainer: {
    padding: SPACING.md,
    paddingTop: 0,
    backgroundColor: COLORS.lightGray,
  },
  faqAnswer: {
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  supportText: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  supportButton: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  supportButtonText: {
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  supportButtonSubtext: {
    color: COLORS.textSecondary,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  versionText: {
    color: COLORS.textSecondary,
  },
});

export default HelpScreen;
