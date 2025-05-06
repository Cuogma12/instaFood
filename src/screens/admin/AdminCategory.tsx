import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl, Alert, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors } from '../../utils/colors';
import { getAllCategories, createCategory, updateCategory, deleteCategory, Category } from '../../services/categoriesServices';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadMediaToCloudinary } from '../../services/mediaServices';
import Icon from 'react-native-vector-icons/FontAwesome';

const CATEGORY_TYPES = [
  { label: 'Bình thường', value: 'normal' },
  { label: 'Công thức nấu ăn', value: 'recipe' },
  { label: 'Đánh giá nhà hàng', value: 'review' }
];

export default function AdminCategory() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [type, setType] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [creating, setCreating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    const data = await getAllCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets || !result.assets[0]?.uri) return;
    setUploadingImage(true);
    const uploadRes = await uploadMediaToCloudinary(result.assets[0].uri, 'image');
    setUploadingImage(false);
    if (uploadRes.success && uploadRes.url) {
      setImageUrl(uploadRes.url);
    } else {
      Alert.alert('Lỗi', uploadRes.error || 'Không thể upload ảnh');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setParentId(undefined);
    setImageUrl(undefined);
    setType('');
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên danh mục không được để trống');
      return;
    }

    if (!type) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại danh mục');
      return;
    }

    try {
      setCreating(true);
      let result;

      if (editingCategory) {
        result = await updateCategory(editingCategory.categoryId, {
          name: name.trim(),
          description: description.trim(),
          imageUrl,
          type
        });
      } else {
        result = await createCategory({
          name: name.trim(),
          description: description.trim(),
          parentId: parentId || undefined,
          imageUrl,
          type
        });
      }

      setCreating(false);

      if (result.success) {
        setModalVisible(false);
        resetForm();
        await fetchCategories(); // Refresh the list immediately
        Alert.alert(
          'Thành công', 
          editingCategory ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục mới'
        );
      } else {
        Alert.alert(
          'Lỗi',
          editingCategory 
            ? 'Không thể cập nhật danh mục. Vui lòng thử lại.'
            : 'Không thể tạo danh mục. Vui lòng thử lại.'
        );
      }
    } catch (error) {
      setCreating(false);
      Alert.alert(
        'Lỗi',
        'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.'
      );
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setDescription(category.description);
    setType(category.type);
    setImageUrl(category.imageUrl);
    setParentId(category.parentId);
    setModalVisible(true);
  };

  const handleDelete = async (category: Category) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa danh mục này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteCategory(category.categoryId);
            if (result.success) {
              fetchCategories();
              Alert.alert('Thành công', 'Đã xóa danh mục');
            } else {
              Alert.alert('Lỗi', 'Không thể xóa danh mục');
            }
          }
        }
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <View style={styles.categoryItem}>
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.categoryImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        {item.description ? <Text style={styles.categoryDesc}>{item.description}</Text> : null}
        <Text style={styles.categoryType}>
          Loại: {CATEGORY_TYPES.find(t => t.value === item.type)?.label || item.type}
        </Text>
        {item.parentId && (
          <Text style={styles.categoryParent}>
            ➔ Thuộc danh mục: {categories.find(c => c.categoryId === item.parentId)?.name || 'Không rõ'}
          </Text>
        )}
      </View>
      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item)}
        >
          <Icon name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
        >
          <Icon name="trash" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item.categoryId}
          renderItem={renderCategoryItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Tên danh mục"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Mô tả (tuỳ chọn)"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Loại danh mục:</Text>
              <Picker
                selectedValue={type}
                onValueChange={(itemValue) => setType(itemValue)}
                style={styles.picker}
              >
                {CATEGORY_TYPES.map(typeOption => (
                  <Picker.Item 
                    key={typeOption.value} 
                    label={typeOption.label} 
                    value={typeOption.value}
                  />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              style={[styles.input, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' }]}
              onPress={handlePickImage}
            >
              <Text style={{ color: colors.text }}>
                {imageUrl ? 'Chọn lại ảnh' : 'Chọn ảnh danh mục'}
              </Text>
            </TouchableOpacity>
            {uploadingImage && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 8 }} />
            )}
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={{ width: 160, height: 160, borderRadius: 12, marginVertical: 12 }}
                resizeMode="cover"
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSubmit}
                disabled={creating}
              >
                <Text style={styles.saveText}>
                  {creating ? '...Đang lưu' : 'Lưu'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  categoryDesc: {
    color: colors.darkGray,
    fontSize: 13,
  },
  categoryParent: {
    color: colors.secondary,
    fontSize: 13,
    marginTop: 4,
  },
  categoryType: {
    color: colors.secondary,
    fontSize: 13,
    marginTop: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: '100%',
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  pickerContainer: {
    marginBottom: 10,
    width: '100%',
  },
  pickerLabel: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 4,
  },
  picker: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  cancelBtn: {
    marginRight: 16,
  },
  cancelText: {
    color: colors.darkGray,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
