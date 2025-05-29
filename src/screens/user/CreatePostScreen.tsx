import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  Pressable
} from 'react-native';
import { colors } from '../../utils/colors';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createPost } from '../../services/postServices';
import { uploadMediaToCloudinary } from '../../services/mediaServices';
import { getAllCategories } from '../../services/categoriesServices';
import RecipePost from '../../components/user/RecipePost';
import ReviewPost from '../../components/user/ReviewPost';
import useAuth from '../../hooks/useAuth';
import AuthRequired from '../../components/auth/AuthRequired';

// Enum cho các loại bài đăng
enum PostType {
  GENERAL = 'general',
  RECIPE = 'recipe',
  REVIEW = 'review'
}

// Interface cho Category
interface Category {
  categoryId: string;
  name: string;
  description?: string;
  type: string;
}

// Interface cho props của Tab loại bài đăng
interface PostTypeTabProps {
  title: string;
  active: boolean;
  onPress: () => void;
  icon: string;
}

const PostTypeTab: React.FC<PostTypeTabProps> = ({ title, active, onPress, icon }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.activeTab]}
    onPress={onPress}
  >
    <Icon name={icon} size={20} color={active ? colors.primary : colors.darkGray} />
    <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
  </TouchableOpacity>
);

// Componente de cabeçalho da prévia
const PreviewHeader: React.FC<{ postType: PostType }> = ({ postType }) => {
  let typeText = 'Bài viết thông thường';
  let typeIcon = 'photo';
  let typeColor = '#3498db';

  if (postType === PostType.RECIPE) {
    typeText = 'Công thức nấu ăn';
    typeIcon = 'cutlery';
    typeColor = '#e67e22';
  } else if (postType === PostType.REVIEW) {
    typeText = 'Đánh giá món ăn';
    typeIcon = 'star';
    typeColor = '#f39c12';
  }

  return (
    <View style={styles.reviewHeader}>
      <View style={[styles.previewType, { backgroundColor: typeColor }]}>
        <Icon name={typeIcon} size={14} color="#fff" style={{ marginRight: 4 }} />
        <Text style={styles.previewType}>{typeText}</Text>
      </View>
      <Text style={styles.previewType}>Xem trước bài đăng của bạn</Text>
    </View>
  );
};


interface CreatePostScreenProps {
  navigation: any;
}

export default function CreatePostScreen({ navigation }: CreatePostScreenProps) {
  // Authentication state
  const { isAuthenticated, authChecked, user } = useAuth();

  // State variables
  const [postType, setPostType] = useState(PostType.RECIPE);
  const [caption, setCaption] = useState('');
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  // Modal for category selection
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // For hashtag input
  const [hashtagInput, setHashtagInput] = useState('');

  // Recipe specific states
  const [recipeTitle, setRecipeTitle] = useState('');
  const [prepTime, setPrepTime] = useState(''); // Thời gian chuẩn bị
  const [servings, setServings] = useState(''); // 
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [instructions, setInstructions] = useState<string[]>([]);
  const [instructionInput, setInstructionInput] = useState('');

  // Review specific states
  const [foodName, setFoodName] = useState('');
  const [rating, setRating] = useState(5);
  const [price, setPrice] = useState('');
  const [pros, setPros] = useState<string[]>([]);
  const [proInput, setProInput] = useState('');
  const [cons, setCons] = useState<string[]>([]);
  const [conInput, setConInput] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');

  // User info

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getAllCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };
  const userProfile = {
    photoURL: '',
    displayName: 'User'
  };

  // Hàm đăng bài
  const handleCreatePost = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 ảnh');
      return;
    }
    if (!caption.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập mô tả bài đăng');
      return;
    }
    try {
      setLoading(true);
      // Upload tất cả ảnh lên Cloudinary
      const uploadResults = await Promise.all(
        selectedImages.map(img => uploadMediaToCloudinary(img.uri, 'image'))
      );
      // Lấy ra các URL thành công
      const mediaUrls = uploadResults
        .filter(res => res.success && res.url)
        .map(res => res.url as string);
      if (mediaUrls.length === 0) {
        setLoading(false);
        Alert.alert('Lỗi', 'Tải ảnh lên thất bại, vui lòng thử lại!');
        return;
      }
      // Chuẩn bị dữ liệu post
      const postData: any = {
        caption,
        mediaUrls,
        mediaType: 'image',
        hashtags,
        categoryIds: selectedCategories.map(cat => cat.categoryId),
        postType,
        location: restaurantAddress ? { name: restaurantName, address: restaurantAddress } : undefined,
        createdAt: new Date().toISOString(),
      };
      // Thêm dữ liệu chi tiết tùy theo loại bài đăng
      switch (postType) {
        case PostType.RECIPE:
          postData.recipeDetails = {
            title: recipeTitle,
            prepTime,
            servings,
            ingredients,
            instructions,
          };
          break;
        case PostType.REVIEW:
          postData.reviewDetails = {
            name: foodName,
            rating,
            price,
            pros,
            cons,
            restaurantInfo: {
              name: restaurantName,
              address: restaurantAddress,
            },
          };
          break;
        default:
          break;
      }
      // Gọi API tạo bài viết
      const result = await createPost(postData);
      setLoading(false);
      if (result.success) {
        Alert.alert('Thành công', 'Bài đăng đã được tạo!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo bài đăng');
      }
      // Reset form nếu muốn
      setCaption('');
      setSelectedImages([]);
      setHashtags([]);
      setSelectedCategories([]);
      setRecipeTitle('');
      setPrepTime('');
      setServings('');
      setIngredients([]);
      setInstructions([]);
      setFoodName('');
      setRating(5);
      setPrice('');
      setPros([]);
      setCons([]);
      setRestaurantName('');
      setRestaurantAddress('');
    } catch (error) {
      setLoading(false);
      console.error('CreatePost error:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi tạo bài đăng');
    }
  };

  // Hàm chọn ảnh từ thư viện
  const selectImages = () => {
    launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 5,
      quality: 0.8,
    }, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Lỗi', response.errorMessage || 'Không thể chọn ảnh');
        return;
      }

      if (response.assets) {
        setSelectedImages([...selectedImages, ...response.assets]);
      }
    });
  };

  const isFormValid = () => {
    switch (postType) {
      case PostType.RECIPE:
        return !!(recipeTitle && ingredients.length > 0 && instructions.length > 0);
      case PostType.REVIEW:
        return !!(foodName && rating && pros.length > 0);
      case PostType.GENERAL:
        return !!(caption && selectedImages.length > 0);
      default:
        return true;
    }
  };

  const renderRecipeSection = () => {
    return (
      <View style={styles.recipeSection}>
        {/* Recipe Title */}
        <View style={styles.recipeHeader}>
             <Text style={styles.sectionTitle}>Nội dung bài viết</Text>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Nhập nội dung ..."
            multiline
          />
          <TextInput
            style={styles.recipeTitleInput}
            value={recipeTitle}
            onChangeText={setRecipeTitle}
            placeholder="Tên món ăn..."
          />
       
          {/* Time and Servings */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="clock-o" size={16} color={colors.darkGray} />
              <TextInput
                style={styles.metaInput}
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="0"
                keyboardType="numeric"
              />
              <Text style={styles.metaLabel}>phút</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="users" size={16} color={colors.darkGray} />
              <TextInput
                style={styles.metaInput}
                value={servings}
                onChangeText={setServings}
                placeholder="0"
                keyboardType="numeric"
              />
              <Text style={styles.metaLabel}>người</Text>
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>🧂 Nguyên liệu</Text>
          <View style={styles.ingredientInputRow}>
            <TextInput
              style={styles.ingredientInput}
              value={ingredientInput}
              onChangeText={setIngredientInput}
              placeholder="Thêm nguyên liệu..."
              onSubmitEditing={() => {
                if (ingredientInput.trim()) {
                  setIngredients([...ingredients, ingredientInput.trim()]);
                  setIngredientInput('');
                }
              }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (ingredientInput.trim()) {
                  setIngredients([...ingredients, ingredientInput.trim()]);
                  setIngredientInput('');
                }
              }}
            >
              <Icon name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>


          </View>
          {ingredients.map((item, index) => (
            <View key={`ingredient-${index}`} style={styles.listItem}>
              <Icon name="circle" size={8} color={colors.primary} style={{ marginTop: 8 }} />
              <Text style={styles.listItemText}>{item}</Text>
              <TouchableOpacity
                onPress={() => {
                  const newIngredients = [...ingredients];
                  newIngredients.splice(index, 1);
                  setIngredients(newIngredients);
                }}
              >
                <Icon name="times" size={20} color={colors.darkGray} />
              </TouchableOpacity>

            </View>
          ))}


        </View>

        {/* Instructions */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>🥘 Cách làm</Text>
          <View style={styles.instructionInputRow}>
            <TextInput
              style={styles.instructionInput}
              value={instructionInput}
              onChangeText={setInstructionInput}
              placeholder="Thêm bước thực hiện..."
              multiline
              onSubmitEditing={() => {
                if (instructionInput.trim()) {
                  setInstructions([...instructions, instructionInput.trim()]);
                  setInstructionInput('');
                }
              }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (instructionInput.trim()) {
                  setInstructions([...instructions, instructionInput.trim()]);
                  setInstructionInput('');
                }
              }}
            >
              <Icon name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {instructions.map((item, index) => (
            <View key={`instruction-${index}`} style={styles.listItem}>
              <Text style={styles.stepNumber}>{index + 1}.</Text>
              <Text style={styles.listItemText}>{item}</Text>
              <TouchableOpacity
                onPress={() => {
                  const newInstructions = [...instructions];
                  newInstructions.splice(index, 1);
                  setInstructions(newInstructions);
                }}
              >
                <Icon name="times" size={20} color={colors.darkGray} />
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Hashtag</Text>
          <View style={styles.ingredientInputRow}>
            <TextInput
              style={styles.ingredientInput}
              value={hashtagInput}
              onChangeText={setHashtagInput}
              placeholder="Nhập hashtag cho bài viết..."
              onSubmitEditing={() => {
                if (hashtagInput.trim()) {
                  // Remove # if user added it, and clean up the input
                  const tag = hashtagInput.trim().replace(/^#/, '');
                  if (tag && !hashtags.includes(tag)) {
                    setHashtags([...hashtags, tag]);
                    setHashtagInput('');
                  }
                }
              }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (hashtagInput.trim()) {
                  // Remove # if user added it, and clean up the input
                  const tag = hashtagInput.trim().replace(/^#/, '');
                  if (tag && !hashtags.includes(tag)) {
                    setHashtags([...hashtags, tag]);
                    setHashtagInput('');
                  }
                }
              }}
            >
              <Icon name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {hashtags.length > 0 && (
            <View style={styles.hashtagsContainer}>
              {hashtags.map((tag, index) => (
                <View key={`hashtag-${index}`} style={styles.hashtagItem}>
                  <Text style={styles.hashtagText}>#{tag}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newHashtags = [...hashtags];
                      newHashtags.splice(index, 1);
                      setHashtags(newHashtags);
                    }}
                    style={styles.removeHashtagButton}
                  >
                    <Icon name="times" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderReviewSection = () => {
    return (

      <View style={styles.reviewSection}>
           <Text style={styles.sectionTitle}>Nội dung bài viết</Text>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Nhập nội dung ..."
            multiline
          />
        {/* Food Name & Rating */}
        <View style={styles.reviewHeader}>
          <TextInput
            style={styles.reviewTitleInput}
            value={foodName}
            onChangeText={setFoodName}
            placeholder="Tên món ăn..."
          />

       

          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Đánh giá:</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={`star-${star}`}
                  onPress={() => setRating(star)}
                >
                  <Icon
                    name={star <= rating ? 'star' : 'star-o'}
                    size={30}
                    color={star <= rating ? '#FFD700' : '#ccc'}
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Price Input */}
        <View style={styles.priceContainer}>
          <Icon name="money" size={16} color={colors.darkGray} />
          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={setPrice}
            placeholder="Giá món ăn..."
            keyboardType="numeric"
          />
          <Text style={styles.priceLabel}>đ</Text>
        </View>

        {/* Pros Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>✨ Điểm tốt</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.reviewInput}
              value={proInput}
              onChangeText={setProInput}
              placeholder="Thêm điểm tốt..."
              onSubmitEditing={() => {
                if (proInput.trim()) {
                  setPros([...pros, proInput.trim()]);
                  setProInput('');
                }
              }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (proInput.trim()) {
                  setPros([...pros, proInput.trim()]);
                  setProInput('');
                }
              }}
            >
              <Icon name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {pros.map((item, index) => (
            <View key={`pro-${index}`} style={styles.listItem}>
              <Icon name="plus-circle" size={16} color={colors.primary} style={{ marginTop: 4 }} />
              <Text style={styles.listItemText}>{item}</Text>
              <TouchableOpacity
                onPress={() => {
                  const newPros = [...pros];
                  newPros.splice(index, 1);
                  setPros(newPros);
                }}
              >
                <Icon name="times" size={20} color={colors.darkGray} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Cons Section */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>⚠️ Điểm chưa tốt</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.reviewInput}
              value={conInput}
              onChangeText={setConInput}
              placeholder="Thêm điểm chưa tốt..."
              onSubmitEditing={() => {
                if (conInput.trim()) {
                  setCons([...cons, conInput.trim()]);
                  setConInput('');
                }
              }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                if (conInput.trim()) {
                  setCons([...cons, conInput.trim()]);
                  setConInput('');
                }
              }}
            >
              <Icon name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {cons.map((item, index) => (
            <View key={`con-${index}`} style={styles.listItem}>
              <Icon name="minus-circle" size={16} color="#FF4C61" style={{ marginTop: 4 }} />
              <Text style={styles.listItemText}>{item}</Text>
              <TouchableOpacity
                onPress={() => {
                  const newCons = [...cons];
                  newCons.splice(index, 1);
                  setCons(newCons);
                }}
              >
                <Icon name="times" size={20} color={colors.darkGray} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Restaurant Information */}
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>🏪 Thông tin nhà hàng</Text>
          <TextInput
            style={styles.restaurantInput}
            value={restaurantName}
            onChangeText={setRestaurantName}
            placeholder="Tên nhà hàng..."
          />
          <TextInput
            style={[styles.restaurantInput, { marginTop: 8 }]}
            value={restaurantAddress}
            onChangeText={setRestaurantAddress}
            placeholder="Địa chỉ..."
          />
          
          <Text style={styles.sectionTitle}>Hashtag</Text>
          <View style={styles.ingredientInputRow}>
            <TextInput
              style={styles.ingredientInput}
              value={hashtags.join(' ')}
              onChangeText={text => setHashtags(text.split(/\s+/).filter(Boolean))}
              placeholder="Nhập hashtag cho bài viết..."
              onSubmitEditing={() => {
                // Already handled by onChangeText
              }}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                // Can be used to add a specific tag
              }}
            >
              <Icon name="plus" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {hashtags.length > 0 && (
            <View style={styles.hashtagsContainer}>
              {hashtags.map((tag, index) => (
                <View key={`hashtag-${index}`} style={styles.hashtagItem}>
                  <Text style={styles.hashtagText}>#{tag}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newHashtags = [...hashtags];
                      newHashtags.splice(index, 1);
                      setHashtags(newHashtags);
                    }}
                    style={styles.removeHashtagButton}
                  >
                    <Icon name="times" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  // Hàm renderPreview để hiển thị xem trước bài đăng
  const renderPreview = () => {
    switch (postType) {
      case PostType.RECIPE:
        // Logic render RecipePost ở đây
        return null;

      case PostType.REVIEW:
        return (
          <ReviewPost
            reviewDetails={{
              name: foodName,
              rating: rating,
              price: price ? parseFloat(price) : undefined,
              pros: pros,
              cons: cons,
              restaurantInfo: {
                name: restaurantName,
                address: restaurantAddress
              }
            }}
            caption={caption}
            hashtags={hashtags}
            category={selectedCategories.length > 0 ? selectedCategories[0] : undefined}
            location={restaurantAddress ? {
              name: restaurantName,
              address: restaurantAddress
            } : undefined}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AuthRequired authChecked={authChecked} isAuthenticated={isAuthenticated} message="Vui lòng đăng nhập để đăng bài">
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.postContainer}>
            {/* Post Header with User Info */}
            <View style={styles.postHeader}>
              <Image
                source={
                  userProfile.photoURL
                    ? { uri: userProfile.photoURL }
                    : require('../../assets/images/defaultuser.png')
                }
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{userProfile.displayName || 'User'}</Text>
                <View style={styles.postMetaRow}>
                  <Text style={styles.postTime}>Đang tạo bài viết</Text>
                  <Icon name="globe" size={12} color={colors.darkGray} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>

            {/* Post Type Selection */}
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[styles.typeButton, postType === PostType.GENERAL && styles.activeTypeButton]}
                onPress={() => setPostType(PostType.GENERAL)}
              >
                <Icon name="file-text-o" size={16} color={postType === PostType.GENERAL ? '#fff' : colors.primary} />
                <Text style={[styles.typeText, postType === PostType.GENERAL && styles.activeTypeText]}>
                  Bài viết thường
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, postType === PostType.RECIPE && styles.activeTypeButton]}
                onPress={() => setPostType(PostType.RECIPE)}
              >
                <Icon name="cutlery" size={16} color={postType === PostType.RECIPE ? '#fff' : colors.primary} />
                <Text style={[styles.typeText, postType === PostType.RECIPE && styles.activeTypeText]}>
                  Công thức
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, postType === PostType.REVIEW && styles.activeTypeButton]}
                onPress={() => setPostType(PostType.REVIEW)}
              >
                <Icon name="star" size={16} color={postType === PostType.REVIEW ? '#fff' : colors.primary} />
                <Text style={[styles.typeText, postType === PostType.REVIEW && styles.activeTypeText]}>
                  Đánh giá
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* Media Section */}
              <View style={styles.mediaSection}>
                {selectedImages.length > 0 ? (
                  <View style={styles.mediaContainer}>
                    <Image source={{ uri: selectedImages[0].uri }} style={styles.mediaPreview} />
                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <TouchableOpacity style={styles.mediaChangeButton} onPress={selectImages}>
                        <Icon name="image" size={20} color="#fff" />
                        <Text style={styles.mediaChangeText}>Chọn từ thư viện</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.mediaChangeButton, { marginLeft: 8 }]} onPress={() => {
                        launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
                          if (response.didCancel) return;
                          if (response.errorCode) {
                            Alert.alert('Lỗi', response.errorMessage || 'Không thể chụp ảnh');
                            return;
                          }
                          if (response.assets) {
                            setSelectedImages([...selectedImages, ...response.assets]);
                          }
                        });
                      }}>
                        <Icon name="camera" size={20} color="#fff" />
                        <Text style={styles.mediaChangeText}>Chụp ảnh</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={styles.mediaAddButton} onPress={selectImages}>
                      <Icon name="image" size={32} color={colors.primary} />
                      <Text style={styles.mediaAddText}>Thêm ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.mediaAddButton, { marginLeft: 12 }]} onPress={() => {
                      launchCamera({ mediaType: 'photo', quality: 0.8 }, (response) => {
                        if (response.didCancel) return;
                        if (response.errorCode) {
                          Alert.alert('Lỗi', response.errorMessage || 'Không thể chụp ảnh');
                          return;
                        }
                        if (response.assets) {
                          setSelectedImages([...selectedImages, ...response.assets]);
                        }
                      });
                    }}>
                      <Icon name="camera" size={32} color={colors.primary} />
                      <Text style={styles.mediaAddText}>Chụp ảnh</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Image Preview Section */}
              {selectedImages.length > 0 && (
                <ScrollView horizontal style={styles.imagePreviewContainer}>
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.deleteImageButton}
                        onPress={() => {
                          const updatedImages = [...selectedImages];
                          updatedImages.splice(index, 1);
                          setSelectedImages(updatedImages);
                        }}
                      >
                        <Icon name="times-circle" size={24} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Post Type Specific Content */}
              {postType === PostType.RECIPE && renderRecipeSection()}
              {postType === PostType.REVIEW && renderReviewSection()}
              {postType === PostType.GENERAL && (
                <View style={styles.inputSection}>
                  <Text style={styles.sectionTitle}>Cảm nghĩ của bạn..</Text>
                  <TextInput
                    style={styles.captionInput}
                    value={caption}
                    onChangeText={setCaption}
                    placeholder="Nhập nội dung ..."
                    multiline
                  />
                  <Text style={styles.sectionTitle}>Hashtag</Text>
                  <View style={styles.ingredientInputRow}>
                    <TextInput
                      style={styles.ingredientInput}
                      value={hashtagInput}
                      onChangeText={setHashtagInput}
                      placeholder="Nhập hashtag cho bài viết..."
                      onSubmitEditing={() => {
                        if (hashtagInput.trim()) {
                          // Remove # if user added it, and clean up the input
                          const tag = hashtagInput.trim().replace(/^#/, '');
                          if (tag && !hashtags.includes(tag)) {
                            setHashtags([...hashtags, tag]);
                            setHashtagInput('');
                          }
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => {
                        if (hashtagInput.trim()) {
                          // Remove # if user added it, and clean up the input
                          const tag = hashtagInput.trim().replace(/^#/, '');
                          if (tag && !hashtags.includes(tag)) {
                            setHashtags([...hashtags, tag]);
                            setHashtagInput('');
                          }
                        }
                      }}
                    >
                      <Icon name="plus" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  {hashtags.length > 0 && (
                    <View style={styles.hashtagsContainer}>
                      {hashtags.map((tag, index) => (
                        <View key={`hashtag-${index}`} style={styles.hashtagItem}>
                          <Text style={styles.hashtagText}>#{tag}</Text>
                          <TouchableOpacity
                            onPress={() => {
                              const newHashtags = [...hashtags];
                              newHashtags.splice(index, 1);
                              setHashtags(newHashtags);
                            }}
                            style={styles.removeHashtagButton}
                          >
                            <Icon name="times" size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Category Select Button - chỉ xuất hiện 1 lần ở ngoài cùng */}
              <Text style={styles.sectionTitle}>Danh mục</Text>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  { flexDirection: 'row', alignItems: 'center', minWidth: 120, marginBottom: 8 },
                  selectedCategories.length > 0 && styles.filterBtnActive
                ]}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={[
                  styles.filterText,
                  { flex: 1 },
                  selectedCategories.length > 0 && { color: '#fff', fontWeight: 'bold' }
                ]}>
                  {selectedCategories.length > 0
                    ? selectedCategories.map(c => c.name).join(', ')
                    : 'Chọn danh mục'}
                </Text>
                <Icon
                  name="chevron-down"
                  size={14}
                  color={selectedCategories.length > 0 ? '#fff' : '#888'}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
              <Modal
                visible={categoryModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCategoryModalVisible(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setCategoryModalVisible(false)}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Chọn danh mục</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                      {categories
                        .filter(item => item.type === postType)
                        .map((item: Category) => {
                          const isSelected = selectedCategories.some(c => c.categoryId === item.categoryId);
                          return (
                            <TouchableOpacity
                              key={item.categoryId}
                              style={[
                                styles.modalOption,
                                isSelected && styles.modalOptionActive
                              ]}
                              onPress={() => {
                                if (isSelected) {
                                  setSelectedCategories(selectedCategories.filter(c => c.categoryId !== item.categoryId));
                                } else {
                                  setSelectedCategories([...selectedCategories, item]);
                                }
                              }}
                            >
                              <Text style={[
                                styles.modalOptionText,
                                isSelected && styles.modalOptionTextActive
                              ]}>
                                {item.name}
                              </Text>
                              {isSelected && <Icon name="check" size={18} color="#fff" style={{ position: 'absolute', right: 16, top: 12 }} />}
                            </TouchableOpacity>
                          );
                        })}
                    </ScrollView>
                    <TouchableOpacity
                      style={{ marginTop: 16, backgroundColor: colors.primary, borderRadius: 8, padding: 12, alignItems: 'center' }}
                      onPress={() => setCategoryModalVisible(false)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Xong</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Modal>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, !isFormValid() && styles.submitButtonDisabled]}
                onPress={handleCreatePost}
                disabled={!isFormValid() || loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Đang đăng...' : 'Đăng bài'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </AuthRequired>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 4,
  },
  previewType: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    marginLeft: 8,
    fontSize: 15,
    color: colors.primary,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTime: {
    fontSize: 13,
    color: colors.darkGray,
  },
  typeContainer: {
    flexDirection: 'row',
    padding: 12,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  activeTypeButton: {
    backgroundColor: colors.primary,
  },
  typeText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
  },
  activeTypeText: {
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    color: colors.text,
    paddingTop: 0,
    paddingBottom: 12,
    minHeight: 80,
  },
  mediaSection: {
    marginVertical: 12,
  },
  mediaContainer: {
    position: 'relative',
  },
  mediaPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  mediaChangeButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  mediaChangeText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  mediaAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    borderStyle: 'dashed',
  },
  mediaAddText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  // Recipe section styles
  recipeSection: {
    marginTop: 16,
  },
  recipeHeader: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  recipeTitleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  metaInput: {
    fontSize: 16,
    color: colors.text,
    width: 40,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: colors.darkGray,
  },
  inputSection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  ingredientInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  instructionInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  instructionInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    marginRight: 12,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    width: 30,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reviewSection: {
    marginTop: 16,
  },
  reviewHeader: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  reviewTitleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    color: colors.text,
    marginRight: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginHorizontal: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  priceInput: {
    flex: 1,
    fontSize: 18,
    color: colors.text,
    marginLeft: 12,
    marginRight: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: colors.darkGray,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  restaurantInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  deleteImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  categorySelectorText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',

  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',

  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',

  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemText: {
    fontSize: 16,
    color: colors.text,
  },
  emptyList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: colors.darkGray,
  },
  filterBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colors.lightGray,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
    height: 50,
  },
  filterBtnActive: {
    backgroundColor: colors.primary || '#FF4C61',
  },
  filterText: {
    color: '#333',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 260,
    elevation: 5,
    alignItems: 'stretch',
  },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalOptionActive: {
    backgroundColor: colors.primary || '#FF4C61',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  categoryScrollContainer: {
    flex: 1,
  },
  categoryScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  hashtagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  hashtagText: {
    color: '#fff',
    marginRight: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  removeHashtagButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});