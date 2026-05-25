import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LandingScreen } from '../screens/Auth/LandingScreen';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { RegisterScreen } from '../screens/Auth/RegisterScreen';
import { ChatRoomScreen } from '../screens/Chat/ChatRoomScreen';
import { GroupHeatmapScreen } from '../screens/Calendar/GroupHeatmapScreen';
import { BottomTabNavigator } from './BottomTabNavigator';
import { FriendsScreen } from '../screens/Profile/FriendsScreen';

// ─── Types ────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Landing: undefined;
  Auth: undefined;
  Register: undefined;
  Main: undefined;
  ChatRoom: { roomId: string; roomName: string };
  GroupHeatmap: { roomId: string; roomName: string };
  Friends: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

// ─── Stacks ────────────────────────────────────────────────────────────
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

export const AppNavigator = () => (
  <NavigationContainer>
    <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Landing">
      <RootStack.Screen name="Landing" component={LandingScreen} />
      <RootStack.Screen name="Auth" component={AuthNavigator} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
      <RootStack.Screen name="Main" component={BottomTabNavigator} />
      <RootStack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <RootStack.Screen name="GroupHeatmap" component={GroupHeatmapScreen} />
      <RootStack.Screen name="Friends" component={FriendsScreen} />
    </RootStack.Navigator>
  </NavigationContainer>
);
