import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, Text, StyleSheet } from 'react-native';

// Import Screens
import { PersonalCalendarScreen } from '../screens/Calendar/PersonalCalendarScreen';
import { EventsDashboardScreen } from '../screens/Events/EventsDashboardScreen';
import { ChatListScreen } from '../screens/Chat/ChatListScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { ChecklistScreen } from '../screens/Checklist/ChecklistScreen';

export type MainTabParamList = {
  Chat: undefined;
  Schedule: undefined;
  Events: undefined;
  Checklist: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Chat"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'chatbubbles';
          let label = '';

          if (route.name === 'Chat') { iconName = focused ? 'chatbubbles' : 'chatbubbles-outline'; label = 'Chat'; }
          else if (route.name === 'Schedule') { iconName = focused ? 'calendar' : 'calendar-outline'; label = 'Lịch'; }
          else if (route.name === 'Events') { iconName = focused ? 'flash' : 'flash-outline'; label = 'Sự kiện'; }
          else if (route.name === 'Checklist') { iconName = focused ? 'list' : 'list-outline'; label = 'Công việc'; }
          else if (route.name === 'Profile') { iconName = focused ? 'person' : 'person-outline'; label = 'Hồ sơ'; }

          return (
            <View style={styles.iconContainer}>
              <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
                <Ionicons name={iconName} size={22} color={focused ? '#3B82F6' : '#94A3B8'} />
              </View>
              <Text style={[styles.iconLabel, focused && styles.iconLabelActive]}>{label}</Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Chat" component={ChatListScreen} />
      <Tab.Screen name="Schedule" component={PersonalCalendarScreen} />
      <Tab.Screen name="Events" component={EventsDashboardScreen} />
      <Tab.Screen name="Checklist" component={ChecklistScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderTopWidth: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    paddingHorizontal: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Platform.OS === 'ios' ? 24 : 24,
  },
  iconBox: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconBoxActive: {
    backgroundColor: '#EFF6FF',
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  iconLabelActive: {
    color: '#3B82F6',
    fontWeight: '700',
  },
});
