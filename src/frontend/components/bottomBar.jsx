// src/components/BottomBar.js
import React from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../contants/colors.js';

const bottomBar = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.bottomBar}>
      <TouchableOpacity style={styles.bottomItem} onPress={() => navigation.navigate('Dashboard')}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/128/1946/1946488.png' }} style={styles.bottomIcon} />
        <Text style={styles.bottomText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bottomItem} onPress={() => navigation.navigate('AIStats')}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/128/478/478544.png' }} style={styles.bottomIcon} />
        <Text style={styles.bottomText}>AI Stats</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bottomItem} onPress={() => navigation.navigate('Notifications')}>
        <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/128/2645/2645897.png' }} style={styles.bottomIcon} />
        <Text style={styles.bottomText}>Notification</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.bottomItem} onPress={() => navigation.navigate('Settings')}>
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
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: colors.secondary,
    backgroundColor:colors.accent,
  },
  bottomItem: { alignItems: 'center' },
  bottomText: { fontSize: 11, marginTop: 4 },
  bottomIcon: { width: 24, height: 24 },
});