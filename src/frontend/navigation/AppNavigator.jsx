import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Signup from '../screens/Signup';
import Cover from '../screens/Cover';
import Login from '../screens/Login';
import Dashboard from '../screens/Dashboard';
import HomeProfile from '../screens/HomeProfile';
import Confirmation from '../screens/Confirmation';
import Settings from '../screens/Settings';
import Account from '../screens/Account';
import EditHomeProfile from '../screens/EditHomeProfile';
import RemoteControl from '../screens/RemoteControl';
import { ScheduleOn, ScheduleOff } from '../screens/Schedule';
import { DeviceProvider } from '../context/DeviceContext';
import RealTimeMonitoring from '../screens/RealTimeMonitoring'; 
import SleepMode from '../screens/SleepMode'; 

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <DeviceProvider>
      <Stack.Navigator
        initialRouteName="Cover"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Cover" component={Cover} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="HomeProfile" component={HomeProfile} />
        <Stack.Screen name="Confirmation" component={Confirmation} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Account" component={Account} />
        <Stack.Screen name="EditHomeProfile" component={EditHomeProfile} />
        <Stack.Screen name="RemoteControl" component={RemoteControl} />
        <Stack.Screen name="ScheduleOn" component={ScheduleOn} />
        <Stack.Screen name="ScheduleOff" component={ScheduleOff} />
        <Stack.Screen name="RealTimeMonitoring" component={RealTimeMonitoring} />
        <Stack.Screen name="SleepMode" component={SleepMode} />


      </Stack.Navigator>
    </DeviceProvider>
  );
}
