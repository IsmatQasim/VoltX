import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import SignUp from '../screens/SignUp';
import Cover from '../screens/Cover';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Cover" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Cover" component={Cover} /> 
    </Stack.Navigator>
  );
}