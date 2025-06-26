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

export default function Login() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
  const unsubscribe = auth().onAuthStateChanged(async (user) => {
    if (user) {
      await user.reload();
      if (user.emailVerified && navigation.isReady()) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeProfile' }],
        });
      }
    }
  });

  return unsubscribe;
}, [navigation]);


  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please enter both email and password.');
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
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeProfile' }],
        });
      } else {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email before logging in.',
        );
        await auth().signOut();
      }
    } catch (error) {
      if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password'
      ) {
        Alert.alert('Login Failed', 'Incorrect email or password.');
      } else {
        Alert.alert('Login Error', error.message);
      }
    }
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
        />
      </View>

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
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity>
        <Text style={styles.forgot}>Forgot Password?</Text>
      </TouchableOpacity>

      <Button text="Login" onPress={handleLogin} buttonStyle={{ width: 200 }} />
      <Text style={styles.linkText}>
        Don’t have an account?{' '}
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
