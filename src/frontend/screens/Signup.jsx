import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/button';
import colors from '../contants/colors.js';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

export default function Signup() {
  const navigation = useNavigation();
  const [userType, setUserType] = useState('user');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

 const handleSignup = async () => {
  if (!username || !email || !password) {
    alert('Please fill in all the fields');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    alert(
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
    );
    return;
  }

  try {
    const snapshot = await database()
      .ref('/users')
      .orderByChild('username')
      .equalTo(username)
      .once('value');

    if (snapshot.exists()) {
      alert('Username already taken. Please choose another one.');
      return;
    }
    
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await user.sendEmailVerification();


    await database().ref(`/users/${user.uid}`).set({
      username,
      email,
      type: userType,
      emailVerified: false,
    });

    alert(
      'A verification email has been sent to your inbox(Spam). Please verify to continue.'
    );
    
    await auth().signOut();
   
    navigation.navigate('Login');
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 'auth/email-already-in-use') {
      alert('This email is already registered. Please log in or use another.');
    } else if (error.code === 'auth/invalid-email') {
      alert('The email address is badly formatted.');
    } else if (error.code === 'auth/weak-password') {
      alert('The password is too weak. Try a stronger one.');
    } else {
      alert('Signup failed: ' + error.message);
    }
  }
};


  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/128/507/507257.png' }}
          style={styles.backIconImage}
        />
      </TouchableOpacity>

      <View style={styles.headingRow}>
        <Image
          source={require('../assets/Signup.png')}
          style={styles.signupIcon}
        />
        <Text style={styles.heading}>Signup</Text>
      </View>

      <View style={styles.inputContainer}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/128/1144/1144760.png' }}
          style={styles.iconImage}
        />
        <TextInput
          placeholder="Username"
          placeholderTextColor={colors.text}
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />
      </View>

      <View style={styles.inputContainer}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/128/3178/3178165.png' }}
          style={styles.iconImage}
        />
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.text}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Image
          source={{ uri: 'https://cdn-icons-png.flaticon.com/128/9512/9512572.png' }}
          style={styles.iconImage}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.text}
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={styles.userAccess}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              userType === 'user' && styles.toggleSelected,
            ]}
            onPress={() => setUserType('user')}
          >
            <View style={styles.toggleContent}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/128/681/681443.png' }}
                style={styles.iconImage}
              />
              <Text
                style={[
                  styles.toggleText,
                  userType === 'user' && styles.toggleTextSelected,
                ]}
              >
                User
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              userType === 'admin' && styles.toggleSelected,
            ]}
            onPress={() => setUserType('admin')}
          >
            <View style={styles.toggleContent}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/128/9964/9964201.png' }}
                style={styles.iconImage}
              />
              <Text
                style={[
                  styles.toggleText,
                  userType === 'admin' && styles.toggleTextSelected,
                ]}
              >
                Admin
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Button text="Signup" buttonStyle={{ width: 200 }} onPress={handleSignup} />

      <Text style={styles.linkText}>
        Already have an account?{' '}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Login</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 20,
  },
  backArrow: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  backIconImage: {
    width: 24,
    height: 24,
    tintColor: colors.text,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 100,
    marginBottom: 30,
  },
  heading: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
    marginRight: 80,
  },
  signupIcon: {
    width: 55,
    height: 60,
    resizeMode: 'contain',
    marginLeft: 80,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  userAccess: {
    flexDirection: 'row',
    alignItems: 'center',
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
  linkText: {
    textAlign: 'center',
    color: colors.link,
    fontSize: 16,
  },
  link: {
    fontWeight: '700',
    color: colors.text,
  },
  toggleContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  toggleButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
  },
  toggleSelected: {
    backgroundColor: colors.secondary,
  },
  toggleText: {
    color: colors.text,
    fontSize: 16,
  },
  toggleTextSelected: {
    fontWeight: 'bold',
    color: colors.link,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
