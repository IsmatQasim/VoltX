import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/button';
import colors from '../contants/colors.js';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async user => {
      if (user) {
        await user.reload();
        if (user.emailVerified && navigation.isReady()) {
          // Check HomeProfile data here too
          try {
            const doc = await firestore()
              .collection('UserHomeProfile')
              .doc(user.uid)
              .get({ source: 'server' });

            const hasValidData =
              doc.exists && doc.data() && Object.keys(doc.data()).length > 0;

            if (hasValidData) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
              });
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'HomeProfile' }],
              });
            }
          } catch (error) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'HomeProfile' }],
            });
          }
        }
      }
    });

    return unsubscribe;
  }, [navigation]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter both email and password.',
      );
      return;
    }

    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      const user = auth().currentUser;
      await user.reload();

      if (user && user.emailVerified) {
        database().ref(`/users/${user.uid}`).update({ emailVerified: true });

        try {
          const doc = await firestore()
            .collection('UserHomeProfile')
            .doc(user.uid)
            .get({ source: 'server' });

          const hasValidData =
            doc.exists && doc.data() && Object.keys(doc.data()).length > 0;

          if (hasValidData) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Dashboard' }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'HomeProfile' }],
            });
          }
        } catch (firestoreError) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'HomeProfile' }],
          });
        }
      } else {
        Alert.alert(
          'Email Not Verified',
          'Please check your email inbox and verify your email before logging in.',
        );
        await auth().signOut();
      }
    } catch (error) {
      let message = '';
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          message = 'The password you entered is incorrect.';
          break;
        case 'auth/invalid-email':
          message = 'The email address is invalid.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        case 'auth/invalid-credential':
          message =
            'Invalid credentials. Please check your email and password or User does not exist';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later.';
          break;
        default:
          message = 'Login failed. Please try again.';
      }

      Alert.alert('Login Error', message);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Forgot Password', 'Please enter your email address first.');
      return;
    }

    auth()
      .sendPasswordResetEmail(email)
      .then(() => {
        Alert.alert(
          'Password Reset',
          'A password reset link has been sent to your email. Please check your inbox and spam folder.',
        );
      })
      .catch(error => {
        let message = '';
        switch (error.code) {
          case 'auth/user-not-found':
            message = 'No account found with this email address.';
            break;
          case 'auth/invalid-email':
            message = 'The email address is invalid.';
            break;
          default:
            message = error.message;
        }
        Alert.alert('Error', message);
      });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backArrow}
      >
        <Image
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/128/507/507257.png',
          }}
          style={styles.backIconImage}
        />
      </TouchableOpacity>

      <View style={styles.headingRow}>
        <Image
          source={require('../assets/Login.png')}
          style={styles.loginIcon}
        />
        <Text style={styles.heading}>Login</Text>
      </View>

      {/* Email */}
      <View style={styles.inputContainer}>
        <Image
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/128/3178/3178165.png',
          }}
          style={styles.iconImage}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#000"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Password + Eye Icon */}
      <View style={styles.inputContainer}>
        <Image
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/128/9512/9512572.png',
          }}
          style={styles.iconImage}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#000"
          secureTextEntry={secureText}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <MaterialIcons
            name={secureText ? 'visibility-off' : 'visibility'}
            size={22}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password */}
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      <Button text="Login" onPress={handleLogin} buttonStyle={{ width: 200 }} />

      {/* Signup Link */}
      <Text style={styles.linkText}>
        Don't have an account?{' '}
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>Sign Up</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, padding: 20 },
  backArrow: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    marginBottom: 30,
  },
  loginIcon: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 10,
  },
  heading: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    marginRight: 60,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  iconImage: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  forgot: {
    color: '#555',
    textAlign: 'right',
    marginBottom: 30,
    fontWeight: '700',
  },
  linkText: {
    textAlign: 'center',
    color: colors.link,
    fontSize: 16,
  },
  link: {
    fontWeight: '700',
    color: colors.text,
  },
  backIconImage: {
    width: 24,
    height: 24,
    tintColor: colors.text,
  },
});
