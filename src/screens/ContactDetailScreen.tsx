import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootState } from '../store';
import { COLORS, SPACING, FONT_SIZES } from '../utils/constants';
import api from '../services/api';
import moment from 'moment-timezone';

interface ContactDetails {
  id: string;
  user_id: string;
  phone: string;
  relationship_status: 'pending' | 'active' | 'removed';
  invited_at: string;
  connected_at: string | null;
  last_invite_sent_at: string | null;
}

type RouteParams = {
  ContactDetail: {
    contactId: string;
  };
};

const ContactDetailScreen: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const fontSize = user?.font_size_preference || 'standard';
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'ContactDetail'>>();

  const { contactId } = route.params;

  const [loading, setLoading] = useState(true);
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(
    null
  );
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    loadContactDetails();
  }, [contactId]);

  const loadContactDetails = async () => {
    try {
      setLoading(true);
      // This would be a new API endpoint to get contact details
      const response = await api.get(`/api/members/contacts/${contactId}`);
      setContactDetails(response.data.contact);
    } catch (error: any) {
      console.error('Error loading contact details:', error);
      Alert.alert('Error', 'Failed to load contact details');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRelationship = () => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove this contact? Both of you will be notified via SMS.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: confirmRemoveRelationship,
        },
      ]
    );
  };

  const confirmRemoveRelationship = async () => {
    try {
      setRemoving(true);
      await api.delete('/api/contacts/remove-relationship', {
        data: { member_id: user?.id },
      });
      Alert.alert('Success', 'Contact removed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to remove contact'
      );
    } finally {
      setRemoving(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format +1XXXXXXXXXX to +1 (XXX) XXX-XXXX
    if (phone.startsWith('+1') && phone.length === 12) {
      return `+1 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

  const baseFontSize = FONT_SIZES[fontSize];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!contactDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { fontSize: baseFontSize * 1.1 }]}>
            Contact not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.contactName, { fontSize: baseFontSize * 2.0 }]}>
            {formatPhoneNumber(contactDetails.phone)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  contactDetails.relationship_status === 'active'
                    ? COLORS.success + '20'
                    : COLORS.warning + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  fontSize: baseFontSize * 1.0,
                  color:
                    contactDetails.relationship_status === 'active'
                      ? COLORS.success
                      : COLORS.warning,
                },
              ]}
            >
              {contactDetails.relationship_status === 'active'
                ? 'Active'
                : 'Pending'}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: baseFontSize * 1.4 }]}>
            Details
          </Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: baseFontSize * 1.0 }]}>
              Status
            </Text>
            <Text style={[styles.detailValue, { fontSize: baseFontSize * 1.0 }]}>
              {contactDetails.relationship_status === 'active'
                ? 'Monitoring You'
                : 'Invitation Pending'}
            </Text>
          </View>

          {contactDetails.relationship_status === 'active' &&
            contactDetails.connected_at && (
              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { fontSize: baseFontSize * 1.0 }]}
                >
                  Connected Since
                </Text>
                <Text
                  style={[styles.detailValue, { fontSize: baseFontSize * 1.0 }]}
                >
                  {moment(contactDetails.connected_at).format('MMM D, YYYY')}
                </Text>
              </View>
            )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { fontSize: baseFontSize * 1.0 }]}>
              Invited On
            </Text>
            <Text style={[styles.detailValue, { fontSize: baseFontSize * 1.0 }]}>
              {moment(contactDetails.invited_at).format('MMM D, YYYY')}
            </Text>
          </View>

          {contactDetails.last_invite_sent_at &&
            contactDetails.relationship_status === 'pending' && (
              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { fontSize: baseFontSize * 1.0 }]}
                >
                  Last Invite Sent
                </Text>
                <Text
                  style={[styles.detailValue, { fontSize: baseFontSize * 1.0 }]}
                >
                  {moment(contactDetails.last_invite_sent_at).format(
                    'MMM D, YYYY h:mm A'
                  )}
                </Text>
              </View>
            )}
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: baseFontSize * 1.4 }]}>
            About Contacts
          </Text>

          <Text style={[styles.infoText, { fontSize: baseFontSize * 1.0 }]}>
            Your Contacts receive notifications when you miss your daily
            check-in. They can see your check-in history and status to ensure
            you're safe.
          </Text>

          {contactDetails.relationship_status === 'pending' && (
            <View style={styles.warningBox}>
              <Text
                style={[styles.warningText, { fontSize: baseFontSize * 1.0 }]}
              >
                This Contact hasn't accepted your invitation yet. They will
                start monitoring you once they accept.
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={handleRemoveRelationship}
            disabled={removing}
            activeOpacity={0.8}
          >
            {removing ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text
                style={[
                  styles.actionButtonText,
                  { fontSize: baseFontSize * 1.1 },
                ]}
              >
                Remove Contact
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.actionNote, { fontSize: baseFontSize * 0.9 }]}>
            Removing this Contact will stop them from receiving notifications
            about your check-ins. Both of you will be notified via SMS.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.textSecondary,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contactName: {
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontWeight: '600',
  },
  section: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    color: COLORS.textSecondary,
  },
  detailValue: {
    color: COLORS.text,
    fontWeight: '600',
  },
  infoText: {
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  warningBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
  },
  warningText: {
    color: COLORS.warning,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  removeButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  actionNote: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ContactDetailScreen;
