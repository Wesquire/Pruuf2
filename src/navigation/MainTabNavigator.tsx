/**
 * Main Tab Navigator
 * Bottom tab navigation for the main app
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import {useAppSelector} from '../store';
import {colors, touchTargets} from '../theme';

// Member Screens
import MemberDashboard from '../screens/member/MemberDashboard';
import MemberContacts from '../screens/member/MemberContacts';
import MemberSettings from '../screens/member/MemberSettings';

// Contact Screens
import ContactDashboard from '../screens/contact/ContactDashboard';
import ContactSettings from '../screens/contact/ContactSettings';

const Tab = createBottomTabNavigator();

export const MainTabNavigator: React.FC = () => {
  const user = useAppSelector(state => state.auth.user);

  // Determine if user is primarily a Member or Contact
  const isMember = user?.is_member ?? false;

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: touchTargets.standard + 20,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'MemberDashboard':
            case 'ContactDashboard':
              iconName = 'home';
              break;
            case 'MemberContacts':
              iconName = 'users';
              break;
            case 'MemberSettings':
            case 'ContactSettings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}>
      {isMember ? (
        // Member tabs
        <>
          <Tab.Screen
            name="MemberDashboard"
            component={MemberDashboard}
            options={{tabBarLabel: 'Dashboard'}}
          />
          <Tab.Screen
            name="MemberContacts"
            component={MemberContacts}
            options={{tabBarLabel: 'Contacts'}}
          />
          <Tab.Screen
            name="MemberSettings"
            component={MemberSettings}
            options={{tabBarLabel: 'Settings'}}
          />
        </>
      ) : (
        // Contact tabs
        <>
          <Tab.Screen
            name="ContactDashboard"
            component={ContactDashboard}
            options={{tabBarLabel: 'Members'}}
          />
          <Tab.Screen
            name="ContactSettings"
            component={ContactSettings}
            options={{tabBarLabel: 'Settings'}}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
