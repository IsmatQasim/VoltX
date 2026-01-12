import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomBar from '../components/bottomBar';
import colors from '../contants/colors';
import NotificationBell from '../components/notificationBell';
const VoiceControl = () => {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [bellActive, setBellActive] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
  <View style={styles.headingRow}>
    <Text style={styles.heading}>Voice Integration</Text>
    <NotificationBell
      isActive={bellActive}
      onToggle={() => setBellActive(!bellActive)}
    />
  </View>
  <Text style={styles.subheading}>
    Enables hands-free control for smarter homes.
  </Text>
</View>


        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Voice Assistant Mode</Text>
          <Switch
            value={isVoiceMode}
            onValueChange={setIsVoiceMode}
            thumbColor={isVoiceMode ? colors.accent : 'white'}
            trackColor={{ false: '#d3d3d3', true: colors.primary }}
          />
        </View>
        {isVoiceMode && (
          <View style={styles.speakContainer}>
            <MaterialCommunityIcons
              name="microphone"
              size={60}
              color={colors.text}
            />
            <TouchableOpacity style={styles.speakButton}>
              <Text style={styles.speakText}>Speak Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <BottomBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  topSection: {
    marginTop: 10,
  },
  headingRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
  heading: {
    fontSize: 25,
    fontWeight: 700,
    color: colors.text,
  },
  subheading: {
    fontSize: 18,
    color: colors.link,
    marginTop: 4,
  },
  switchContainer: {
    backgroundColor: colors.secondary,
    padding: 15,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  speakContainer: {
    alignItems: 'center',
    marginTop: 180,
  },
  speakButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.text,
  },
  speakText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default VoiceControl;
