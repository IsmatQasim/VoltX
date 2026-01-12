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
import AlertSystemScreen from '../screens/AlertSystem';
import AiRecommendations from '../screens/AiRecommendations'
import AIBudgetPlanner from '../screens/AiBudget';
import Forecast from '../screens/Forecast';


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
        <Stack.Screen name='AlertSystem' component={AlertSystemScreen} />
        <Stack.Screen name='AiRecommendations' component={AiRecommendations}/>
        <Stack.Screen name='AiBudget' component={AIBudgetPlanner}/>
        <Stack.Screen name='Forecast' component={Forecast}/>


      </Stack.Navigator>
    </DeviceProvider>
  );
}
