import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import BottomBar from '../components/bottomBar';
import colors from '../contants/colors';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';

const SettingItem = ({ iconName, label, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <View style={styles.itemContent}>
      <MaterialCommunityIcons
        name={iconName}
        size={22}
        color="#333"
        style={styles.icon}
      />
      <Text style={styles.label}>{label}</Text>
    </View>
    <MaterialCommunityIcons
      name="chevron-right"
      size={22}
      color={colors.text}
    />
  </TouchableOpacity>
);

const Settings = () => {
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: false },
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.heading}>Settings</Text>

        <SettingItem
          iconName="account-outline"
          label="Account"
          onPress={() => navigation.navigate('Account')}
        />
        <SettingItem
          iconName="home-outline"
          label="Home Profile"
          onPress={() => navigation.navigate('HomeProfile')}
        />
        <SettingItem
          iconName="file-document-outline"
          label="Terms & Conditions"
          onPress={() => navigation.navigate('Terms')}
        />
        <SettingItem
          iconName="lock-outline"
          label="Privacy Policy"
          onPress={() => navigation.navigate('Privacy')}
        />
        <SettingItem
          iconName="information-outline"
          label="About"
          onPress={() => navigation.navigate('About')}
        />
        <SettingItem iconName="logout" label="Logout" onPress={handleLogout} />
      </ScrollView>

      <BottomBar />
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  heading: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 14,
  },
  label: {
    fontSize: 24,
    color: colors.text,
  },
});
