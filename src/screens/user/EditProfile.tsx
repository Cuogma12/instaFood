import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils/colors';
import { useNavigation } from '@react-navigation/native';


export default function EditProfileScreen(){

    const navigation = useNavigation();
    const [displayName, setDisplayName] = useState('Mai Cỏ');
    const [username, setUsername] = useState('Cuongdzai');
    const [bio, setBio] = useState('No bio');
    const [avatar, setAvatar] = useState(''); // Thay bằng link avatar thực tế
  
return (
    <View style={styles.container}>


      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Image source={avatar ? { uri: avatar } : require('../../assets/images/defaultuser.png')} style={styles.avatar} />
        <TouchableOpacity>
          <Text style={styles.editAvatarText}>Chỉnh sửa avatar</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.formRow}>
        <Text style={styles.label}>Tên</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
        />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.label}>Tên người dùng</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />
      </View>
      <View style={styles.formRow}>
        <Text style={styles.label}>Tiểu sử</Text>
        <TextInput
          style={[styles.input, { minHeight: 40 }]}
          value={bio}
          onChangeText={setBio}
          multiline
        />
      </View>

      {/* Nút lưu */}
      <TouchableOpacity style={{
        backgroundColor: colors.primary,
        margin: 24,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
      }}
        onPress={() => {/* Xử lý lưu thông tin ở đây */}}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Lưu thay đổi</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    height: 50,
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  editAvatarText: {
    color: colors.primary,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  label: {
    width: 110,
    fontSize: 15,
    color: '#222',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingVertical: 0,
  },
});