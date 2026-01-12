// src/screens/Dashboard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BottomBar from '../components/bottomBar';
import LogoImage from '../assets/Logo.png';
import colors from '../contants/colors.js';

const features = [
  {
    title: 'Real-time Energy Monitoring',
    icon: require('../assets/monitor.png'),
    screen: 'RealTimeMonitoring',
  },
  { title: 'Remote Control Access', icon: require('../assets/remote.png') ,screen: 'RemoteControl',},
  { title: 'Voice Control Integration', icon: require('../assets/mic.png') },
  

  {
    title: 'Sleep Mode',
    icon: require('../assets/sleep.png'),
    screen: 'SleepMode',
  },
  {
    title: 'Automated Alert System',
    icon: require('../assets/alert.png'),
    screen: 'AlertSystem',
  },
  {
    title: 'Smart AI Energy Recommendation',
    icon: require('../assets/bulb.png'),
    screen: 'AiRecommendations',
  },
  { title: 'Energy Saving Forecast',
     icon: require('../assets/save.png'),
    screen: 'Forecast',
   },
  {
    title: 'AI Based Energy Budget Planner',
    icon: require('../assets/budget.png'),
    screen: 'AiBudget',
  },
];

const accessHub = {
  title: 'Access Hub',
  icon: require('../assets/profile.png'),
};

export default function Dashboard() {
  const navigation = useNavigation();

  const handleFeaturePress = item => {
    if (item.screen) {
      navigation.navigate(item.screen);
    } else {
      console.log(`${item.title} tapped`);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={LogoImage} style={styles.logo} />

      <View style={styles.gridWrapper}>
        {features.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.featureBox}
            onPress={() => handleFeaturePress(item)}
          >
            <Image source={item.icon} style={styles.icon} />
            <Text style={styles.featureText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.featureBox, styles.centeredItem]}
        onPress={() => handleFeaturePress(accessHub)}
      >
        <Image source={accessHub.icon} style={styles.icon} />
        <Text style={styles.featureText}>{accessHub.title}</Text>
      </TouchableOpacity>
  
      <View style={styles.bottomBarContainer}>
        <BottomBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  logo: {
    marginTop: -20,
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 9,
    borderRadius: 12,
    width: '48.5%',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#000',
  },
  centeredItem: {
    alignSelf: 'center',
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
    flexShrink: 1,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
