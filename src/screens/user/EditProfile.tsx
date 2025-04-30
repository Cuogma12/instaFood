import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Modal, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { colors } from '../../utils/colors';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from '@react-native-firebase/auth';
import { getUserProfile, updateUserProfile, isUsernameAvailableForUpdate } from '../../services/authServices';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera, ImagePickerResponse, Asset, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';
import { uploadMediaToCloudinary } from '../../services/mediaServices';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<'displayName' | 'username' | 'bio' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPickerModalVisible, setAvatarPickerModalVisible] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Lấy thông tin người dùng khi màn hình được load
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setDisplayName(profile.displayName || '');
          setUsername(profile.username || '');
          setBio(profile.bio || '');
          setAvatar(profile.photoURL || '');
        }
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Mở modal chỉnh sửa
  const openEditModal = (field: 'displayName' | 'username' | 'bio', value: string) => {
    setEditingField(field);
    setTempValue(value);
    setModalVisible(true);
  };

  // Lưu giá trị từ modal
  const saveEdit = () => {
    switch (editingField) {
      case 'displayName':
        setDisplayName(tempValue);
        break;
      case 'username':
        setUsername(tempValue);
        break;
      case 'bio':
        setBio(tempValue);
        break;
    }
    setModalVisible(false);
  };


  // Xử lý chọn ảnh từ thư viện
  const handleChooseFromLibrary = async () => {
    setAvatarPickerModalVisible(false);

    const options: ImageLibraryOptions = {
      mediaType: 'photo' as const,
      quality: 0.8,
      includeBase64: false,
      maxWidth: 100,
      maxHeight: 100,
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Lỗi', 'Có lỗi khi chọn ảnh: ' + result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        await handleUploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại!');
    }
  };

  // Xử lý chụp ảnh từ camera
  const handleTakePhoto = async () => {
    setAvatarPickerModalVisible(false);

    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: true,
      maxWidth: 100,
      maxHeight: 100,
    };

    try {
      const result = await launchCamera(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Lỗi', 'Có lỗi khi chụp ảnh: ' + result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        await handleUploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại!');
    }
  };

  // Xử lý tải ảnh lên Cloudinary
  const handleUploadAvatar = async (asset: Asset) => {
    if (!asset.uri) {
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. URI không hợp lệ!');
      return;
    }

    try {
      setUploadingAvatar(true);

      const mediaType = asset.type?.startsWith('image') ? 'image' : 'video';
      const uploadResult = await uploadMediaToCloudinary(asset.uri, mediaType);


      if (uploadResult && uploadResult.url) {
        setAvatar(uploadResult.url);
      } else {
        Alert.alert('Lỗi', 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại!');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại!');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Lưu thông tin người dùng xuống Firestore
  const handleSaveProfile = async () => {
    if (!currentUser) return;

    // Kiểm tra username mới có hợp lệ không
    if (username) {
      // Kiểm tra username chỉ chứa chữ cái, số và dấu gạch dưới
      if (!username.match(/^[a-zA-Z0-9_]+$/)) {
        Alert.alert('Lỗi', 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới');
        return;
      }

      // Kiểm tra username mới có trùng không
      const isAvailable = await isUsernameAvailableForUpdate(username, currentUser.uid);
      if (!isAvailable) {
        Alert.alert('Lỗi', 'Tên đăng nhập đã được sử dụng');
        return;
      }
    }

    setSaving(true);
    const result = await updateUserProfile(currentUser.uid, {
      displayName,
      username,
      bio,
      photoURL: avatar
    });

    setSaving(false);
    Alert.alert(
      result.success ? 'Thành công' : 'Lỗi',
      result.message
    );

    if (result.success) {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView showsVerticalScrollIndicator={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.contentContainer}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            {uploadingAvatar ? (
              <View style={[styles.avatar, styles.avatarLoading]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <Image source={avatar ? { uri: avatar } : require('../../assets/images/defaultuser.png')} style={styles.avatar} />
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={() => setAvatarPickerModalVisible(true)}
              disabled={uploadingAvatar}
            >
              <Text style={styles.editAvatarText}>Chỉnh sửa avatar</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <TouchableOpacity style={styles.formRow} onPress={() => openEditModal('displayName', displayName)}>
              <Text style={styles.label}>Tên</Text>
              <Text style={styles.input}>{displayName || 'Chưa có tên hiển thị'}</Text>
              <Icon name="pencil" size={16} color={colors.darkGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.formRow} onPress={() => openEditModal('username', username)}>
              <Text style={styles.label}>Tên người dùng</Text>
              <Text style={styles.input}>{username || 'Chưa có tên người dùng'}</Text>
              <Icon name="pencil" size={16} color={colors.darkGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.formRow} onPress={() => openEditModal('bio', bio)}>
              <Text style={styles.label}>Tiểu sử</Text>
              <Text style={styles.input} numberOfLines={2}>{bio || 'Thêm tiểu sử...'}</Text>
              <Icon name="pencil" size={16} color={colors.darkGray} />
            </TouchableOpacity>
          </View>

          {/* Nút lưu */}
          <TouchableOpacity
            style={[styles.saveButton, (saving || uploadingAvatar) && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving || uploadingAvatar}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Modal chỉnh sửa */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="arrow-left" size={22} color="#222" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingField === 'displayName' && 'Tên'}
                {editingField === 'username' && 'Tên người dùng'}
                {editingField === 'bio' && 'Tiểu sử'}
              </Text>
              <TouchableOpacity onPress={saveEdit}>
                <Text style={styles.modalSaveText}>Xong</Text>
              </TouchableOpacity>
            </View>

            {/* Nội dung nhập */}
            <View style={styles.modalInputContainer}>
              <TextInput
                style={[
                  styles.modalInput,
                  editingField === 'bio' && styles.modalInputMultiline
                ]}
                value={tempValue}
                onChangeText={setTempValue}
                autoFocus
                multiline={editingField === 'bio'}
                maxLength={
                  editingField === 'bio'
                    ? 150
                    : editingField === 'username'
                      ? 30
                      : 50
                }
                placeholderTextColor="#888"
              />
              {/* Số ký tự còn lại */}
              <Text style={styles.charCounter}>
                {tempValue.length}/
                {editingField === 'bio'
                  ? 150
                  : editingField === 'username'
                    ? 30
                    : 50}
              </Text>

              {/* Mô tả nhỏ */}
              {editingField === 'bio' && (
                <Text style={styles.modalHelpText}>
                  Tiểu sử của bạn hiển thị với mọi người trên ứng dụng và cả những nơi khác.
                </Text>
              )}
              {editingField === 'username' && (
                <Text style={styles.modalHelpText}>
                  Tên người dùng chỉ được phép chứa chữ cái, số và dấu gạch dưới.
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal chọn ảnh */}
      <Modal
        visible={avatarPickerModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarPickerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.avatarPickerModal}>
            <Text style={styles.avatarPickerTitle}>Thay đổi ảnh đại diện</Text>

            <TouchableOpacity
              style={styles.avatarPickerOption}
              onPress={handleTakePhoto}
            >
              <Icon name="camera" size={22} color={colors.primary} />
              <Text style={styles.avatarPickerText}>Chụp ảnh mới</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarPickerOption}
              onPress={handleChooseFromLibrary}
            >
              <Icon name="image" size={22} color={colors.primary} />
              <Text style={styles.avatarPickerText}>Chọn từ thư viện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.avatarPickerOption, styles.avatarPickerCancel]}
              onPress={() => setAvatarPickerModalVisible(false)}
            >
              <Text style={styles.avatarPickerCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  contentContainer: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'space-between',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  editAvatarButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  editAvatarText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  formContainer: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: {
    width: 120,
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#555',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 32,
    marginBottom: 16,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    minHeight: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalSaveText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalInput: {
    color: '#222',
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    minHeight: 40,
  },
  modalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCounter: {
    color: '#888',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 8,
  },
  modalHelpText: {
    color: '#888',
    fontSize: 13,
    marginTop: 16,
    lineHeight: 18,
  },
  avatarPickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  avatarPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarPickerText: {
    fontSize: 16,
    marginLeft: 15,
  },
  avatarPickerCancel: {
    marginTop: 10,
    borderBottomWidth: 0,
    justifyContent: 'center',
  },
  avatarPickerCancelText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    fontWeight: '500',
  },
});