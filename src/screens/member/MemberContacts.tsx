/**
 * Member Contacts Screen
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {Feather as Icon} from '@expo/vector-icons';
import {Button, Card} from '../../components/common';
import {colors, typography, spacing} from '../../theme';

const contacts = [
  {id: '1', name: 'Jennifer', email: 'jennifer@example.com', status: 'active'},
  {id: '2', name: 'Michael', email: 'michael@example.com', status: 'active'},
];

const MemberContacts: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Contacts</Text>
      </View>
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <Card style={styles.card}>
            <View style={styles.contactInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.status}>Active</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Icon name="mail" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
      <View style={styles.footer}>
        <Button
          title="+ Invite Another Contact"
          variant="outline"
          size="medium"
          onPress={() => {}}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  header: {padding: spacing.lg},
  title: {...typography.h2},
  list: {padding: spacing.lg, gap: spacing.md},
  card: {flexDirection: 'row', alignItems: 'center'},
  contactInfo: {flex: 1},
  name: {...typography.body, fontWeight: '600'},
  email: {...typography.bodySmall, color: colors.textSecondary},
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: spacing.xs,
  },
  status: {...typography.caption, color: colors.textSecondary},
  actions: {flexDirection: 'row', gap: spacing.sm},
  actionBtn: {padding: spacing.sm},
  footer: {padding: spacing.lg},
});

export default MemberContacts;
