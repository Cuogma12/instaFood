import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getFirestore, doc, updateDoc } from '@react-native-firebase/firestore';
import { RootStackParamList } from '../../types/stackparamlist';
import { Post } from '../../types/post';
import { colors } from '../../utils/colors';
import TagInput from '../../components/post/TagInput';

type EditPostRouteProp = RouteProp<{ EditPost: { post: Post } }, 'EditPost'>;
type EditPostNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function EditPost() {
  const navigation = useNavigation<EditPostNavigationProp>();
  const route = useRoute<EditPostRouteProp>();
  const { post } = route.params;
  
  const [caption, setCaption] = useState(post.caption || '');
  const [hashtags, setHashtags] = useState<string[]>(post.hashtags || []);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const db = getFirestore();

  // Đối với bài viết đánh giá (review)
  const [reviewTitle, setReviewTitle] = useState(post.reviewDetails?.title || '');
  const [reviewRating, setReviewRating] = useState((post.reviewDetails?.rating || 0).toString());
  const [reviewContent, setReviewContent] = useState(post.reviewDetails?.content || '');
  const [location, setLocation] = useState(post.location || '');

  // Đối với bài viết công thức (recipe)
  const [recipeTitle, setRecipeTitle] = useState(post.recipeDetails?.title || '');
  const [ingredients, setIngredients] = useState<string[]>(post.recipeDetails?.ingredients || []);
  const [instructions, setInstructions] = useState<string[]>(post.recipeDetails?.instructions || []);
  const [newIngredient, setNewIngredient] = useState('');
  const [newInstruction, setNewInstruction] = useState('');

  const isReviewPost = post.postType === 'review';
  const isRecipePost = post.postType === 'recipe';

  // Hàm lưu bài viết đã chỉnh sửa
  const handleSavePost = async () => {
    if (!caption.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung bài viết');
      return;
    }

    try {
      setLoading(true);
      const postRef = doc(db, 'Posts', post.id);
      
      let updateData: any = {
        caption: caption.trim(),
        hashtags: hashtags.filter(tag => tag.trim() !== ''),
        updatedAt: new Date()
      };

      // Cập nhật dữ liệu theo loại bài viết
      if (isReviewPost) {
        if (!reviewTitle.trim()) {
          Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề đánh giá');
          setLoading(false);
          return;
        }

        const rating = parseFloat(reviewRating);
        if (isNaN(rating) || rating < 0 || rating > 5) {
          Alert.alert('Lỗi', 'Đánh giá phải là số từ 0 đến 5');
          setLoading(false);
          return;
        }

        updateData.reviewDetails = {
          ...post.reviewDetails,
          title: reviewTitle.trim(),
          rating: rating,
          content: reviewContent.trim()
        };
        updateData.location = location.trim();
      } 
      else if (isRecipePost) {
        if (!recipeTitle.trim()) {
          Alert.alert('Lỗi', 'Vui lòng nhập tên công thức');
          setLoading(false);
          return;
        }

        if (ingredients.length === 0) {
          Alert.alert('Lỗi', 'Vui lòng thêm ít nhất một nguyên liệu');
          setLoading(false);
          return;
        }

        if (instructions.length === 0) {
          Alert.alert('Lỗi', 'Vui lòng thêm ít nhất một bước hướng dẫn');
          setLoading(false);
          return;
        }

        updateData.recipeDetails = {
          ...post.recipeDetails,
          title: recipeTitle.trim(),
          ingredients: ingredients.filter(item => item.trim() !== ''),
          instructions: instructions.filter(item => item.trim() !== '')
        };
      }

      await updateDoc(postRef, updateData);
      
      setLoading(false);
      Alert.alert(
        'Thành công',
        'Đã cập nhật bài viết',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating post:', error);
      setLoading(false);
      Alert.alert('Lỗi', 'Không thể cập nhật bài viết. Vui lòng thử lại sau.');
    }
  };

  // Xử lý thêm/xóa nguyên liệu cho công thức
  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  // Xử lý thêm/xóa bước làm cho công thức
  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      setInstructions([...instructions, newInstruction.trim()]);
      setNewInstruction('');
    }
  };

  const handleRemoveInstruction = (index: number) => {
    const newInstructions = [...instructions];
    newInstructions.splice(index, 1);
    setInstructions(newInstructions);
  };

  // Xử lý thêm/xóa hashtag
  const handleTagChange = (tags: string[]) => {
    setHashtags(tags);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa bài viết</Text>
        <TouchableOpacity onPress={handleSavePost} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Ảnh bài viết */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <View style={styles.imageContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const contentOffset = e.nativeEvent.contentOffset;
                  const viewSize = e.nativeEvent.layoutMeasurement;
                  const pageNum = Math.floor(contentOffset.x / viewSize.width);
                  setCurrentImageIndex(pageNum);
                }}
              >
                {post.mediaUrls.map((url, index) => (
                  <Image
                    key={`image-${index}`}
                    source={{ uri: url }}
                    style={styles.postImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              
              {/* Chỉ số ảnh hiện tại */}
              {post.mediaUrls.length > 1 && (
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageCountText}>
                    {currentImageIndex + 1}/{post.mediaUrls.length}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Form chỉnh sửa bài viết theo loại */}
          <View style={styles.formContainer}>
            {/* Nội dung chung */}
            <View style={styles.captionContainer}>
              <Text style={styles.label}>Nội dung bài viết</Text>
              <TextInput
                style={styles.captionInput}
                placeholder="Viết nội dung bài viết ở đây..."
                multiline
                value={caption}
                onChangeText={setCaption}
              />
            </View>

            {/* Form đánh giá */}
            {isReviewPost && (
              <View style={styles.reviewContainer}>
                <Text style={styles.sectionTitle}>Thông tin đánh giá</Text>
                
                <Text style={styles.label}>Tiêu đề đánh giá</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tiêu đề đánh giá"
                  value={reviewTitle}
                  onChangeText={setReviewTitle}
                />
                
                <Text style={styles.label}>Đánh giá (0-5)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập điểm đánh giá từ 0-5"
                  keyboardType="numeric"
                  value={reviewRating}
                  onChangeText={(text) => {
                    // Chỉ cho phép nhập số và dấu chấm
                    const formatted = text.replace(/[^0-9.]/g, '');
                    setReviewRating(formatted);
                  }}
                />
                
                <Text style={styles.label}>Nội dung đánh giá</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Nhập nội dung đánh giá chi tiết"
                  multiline
                  value={reviewContent}
                  onChangeText={setReviewContent}
                />
                
                <Text style={styles.label}>Địa điểm</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập địa điểm (nếu có)"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            )}

            {/* Form công thức */}
            {isRecipePost && (
              <View style={styles.recipeContainer}>
                <Text style={styles.sectionTitle}>Thông tin công thức</Text>
                
                <Text style={styles.label}>Tên món ăn</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên món ăn"
                  value={recipeTitle}
                  onChangeText={setRecipeTitle}
                />
                
                {/* Danh sách nguyên liệu */}
                <Text style={styles.label}>Nguyên liệu</Text>
                <View style={styles.ingredientsList}>
                  {ingredients.map((item, index) => (
                    <View key={`ingredient-${index}`} style={styles.listItem}>
                      <Text style={styles.listItemText}>{item}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveIngredient(index)}
                        style={styles.removeButton}
                      >
                        <Icon name="times" size={16} color={colors.error || 'red'} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                {/* Thêm nguyên liệu mới */}
                <View style={styles.addItemContainer}>
                  <TextInput
                    style={styles.addItemInput}
                    placeholder="Thêm nguyên liệu..."
                    value={newIngredient}
                    onChangeText={setNewIngredient}
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddIngredient}
                  >
                    <Icon name="plus" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
                
                {/* Danh sách hướng dẫn */}
                <Text style={[styles.label, {marginTop: 20}]}>Các bước thực hiện</Text>
                <View style={styles.instructionsList}>
                  {instructions.map((item, index) => (
                    <View key={`instruction-${index}`} style={styles.listItem}>
                      <Text style={styles.listItemNumber}>{index + 1}.</Text>
                      <Text style={[styles.listItemText, {flex: 1}]}>{item}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveInstruction(index)}
                        style={styles.removeButton}
                      >
                        <Icon name="times" size={16} color={colors.error || 'red'} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                {/* Thêm bước mới */}
                <View style={styles.addItemContainer}>
                  <TextInput
                    style={styles.addItemInput}
                    placeholder="Thêm bước thực hiện..."
                    value={newInstruction}
                    onChangeText={setNewInstruction}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddInstruction}
                  >
                    <Icon name="plus" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Hashtags */}
            <View style={styles.hashtagsContainer}>
              <Text style={styles.label}>Hashtags</Text>
              <TagInput
                tags={hashtags}
                onTagsChange={handleTagChange}
                placeholder="Thêm hashtag..."
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text || '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary || '#2296F3',
  },
  imageContainer: {
    width: '100%',
    height: width,
    position: 'relative',
  },
  postImage: {
    width: width,
    height: width,
  },
  imageIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: colors.white || '#fff',
    fontSize: 12,
  },
  formContainer: {
    padding: 15,
  },
  captionContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text || '#000',
  },
  captionInput: {
    borderWidth: 1,
    borderColor: colors.border || '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border || '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hashtagsContainer: {
    marginTop: 20,
  },
  reviewContainer: {
    marginBottom: 20,
  },
  recipeContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: colors.primary || '#2296F3',
  },
  ingredientsList: {
    marginBottom: 15,
  },
  instructionsList: {
    marginBottom: 15,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border || '#eee',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text || '#000',
  },
  listItemNumber: {
    width: 25,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary || '#2296F3',
  },
  removeButton: {
    padding: 5,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border || '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: colors.primary || '#2296F3',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});