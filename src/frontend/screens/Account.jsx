import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import auth, { firebase } from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';

import Button from '../components/button';
import colors from '../contants/colors';

const Account = () => {
  const navigation = useNavigation();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const user = auth().currentUser;
        if (user) {
          setEmail(user.email || '');
          const snapshot = await database()
            .ref(`/users/${user.uid}/username`)
            .once('value');
          setUsername(snapshot.val() || 'User');
        }
      } catch (error) {
        console.error('Failed to fetch username:', error);
        setUsername('User');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const validatePassword = password => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  };

  const handleSave = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (oldPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from old password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New and Confirm passwords do not match.');
      return;
    }

    if (!validatePassword(newPassword)) {
      Alert.alert(
        'Weak Password',
        'Password must contain:\n- At least 8 characters\n- One uppercase letter\n- One lowercase letter\n- One special character',
      );
      return;
    }

    const user = auth().currentUser;

    if (!user || !user.email) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    try {
      const credential = firebase.auth.EmailAuthProvider.credential(
        user.email,
        oldPassword,
      );

      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);

      Alert.alert('Success', 'Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.log('Password update error:', error);
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        Alert.alert('The old password is incorrect.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('The new password is too weak.');
      } else if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Session Expired',
          'Please log out and log back in before updating your password.',
        );
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const user = auth().currentUser;
            if (!user) return;

            try {
              await database().ref(`/users/${user.uid}`).remove();
              await firestore()
                .collection('UserHomeProfile')
                .doc(user.uid)
                .delete();
              await user.delete();

              Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted.',
              );
              navigation.replace('Signup');
            } catch (error) {
              console.error('Delete error:', error);
              if (error.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Error',
                  'Please log out and log in again to delete your account.',
                );
              } else {
                Alert.alert('Error', error.message);
              }
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.heading}>Account</Text>
        </View>
        <View style={styles.loaderContent}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading your account..</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.heading}>Account</Text>
      </View>
      <View style={styles.profileCard}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri: 'https://cdn-icons-png.flaticon.com/128/160/160363.png',
            }}
            style={styles.avatar}
          />
        </View>
        <View style={styles.profileText}>
          <Text style={styles.username}>{username}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Change Password</Text>
      <View style={styles.detailsCard}>
        {/* Old Password */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="account-outline"
            size={20}
            color={colors.text}
          />
          <TextInput
            placeholder="Old Password"
            placeholderTextColor={colors.text}
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry={!showOld}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowOld(!showOld)}>
            <MaterialCommunityIcons
              name={showOld ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <MaterialCommunityIcons name="lock" size={20} color={colors.text} />
          <TextInput
            placeholder="New Password"
            placeholderTextColor={colors.text}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <MaterialCommunityIcons
              name={showNew ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputRow}>
          <MaterialCommunityIcons
            name="lock-check-outline"
            size={20}
            color={colors.text}
          />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor={colors.text}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            style={styles.input}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <MaterialCommunityIcons
              name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.saveButton}>
          <Button text="    Save    " onPress={handleSave} />
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  loaderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 10,
  },
  profileCard: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileText: {
    marginTop: 10,
    alignItems: 'center',
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.link,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: colors.text,
  },
  detailsCard: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.text,
  },
  saveButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  deleteBtn: {
    marginTop: 30,
    alignSelf: 'center',
    backgroundColor: '#FF0000',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
