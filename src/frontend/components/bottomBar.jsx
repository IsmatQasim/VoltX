import React from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import colors from '../contants/colors.js';

const bottomBar = () => {
  const navigation = useNavigation();
  const route = useRoute(); 

  const getStyle = (screenName) => [
    styles.bottomItem,
    route.name === screenName && styles.activeTab, 
  ];

  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity style={getStyle('Dashboard')} onPress={() => navigation.navigate('Dashboard')}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/128/1946/1946488.png' }} style={styles.bottomIcon} />
        <Text style={styles.bottomText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={getStyle('AIStats')} onPress={() => navigation.navigate('AIStats')}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/128/478/478544.png' }} style={styles.bottomIcon} />
        <Text style={styles.bottomText}>AI Stats</Text>
      </TouchableOpacity>

      <TouchableOpacity style={getStyle('Notifications')} onPress={() => navigation.navigate('Notifications')}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/128/2645/2645897.png' }} style={styles.bottomIcon} />
        <Text style={styles.bottomText}>Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={getStyle('Settings')} onPress={() => navigation.navigate('Settings')}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/128/2040/2040504.png' }} style={styles.bottomIcon} />
        <Text style={styles.bottomText}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

export default bottomBar;

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical:10,
    borderTopWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.secondary,
  },
  bottomItem: {
    alignItems: 'center',
    paddingBottom: 2,
    borderBottomWidth: 4,
    borderBottomColor: 'transparent', 
  },
  activeTab: {
    borderBottomColor: colors.accent, 
    width: 50,
  },
  bottomText: {
    fontSize: 11,
    marginTop: 4,
  },
  bottomIcon: {
    width: 24,
    height: 24,
  },
});
