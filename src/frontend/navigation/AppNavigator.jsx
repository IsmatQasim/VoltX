import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Signup from '../screens/Signup';
import Cover from '../screens/Cover';
import Login from '../screens/Login';
import Dashboard from '../screens/Dashboard';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Cover"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Cover" component={Cover} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="Dashboard" component={Dashboard} />
    </Stack.Navigator>
  );
}
