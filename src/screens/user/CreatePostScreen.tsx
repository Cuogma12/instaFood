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
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  FlatList
} from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { PostType, CreatePostData } from '../../types/post';
import { uploadMedia, createPost } from '../../services/postServices';
import { Category, getAllCategories } from '../../services/categoriesServices';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostTypeTabProps } from '../../types/props/PostProps';
import { serverTimestamp } from '@react-native-firebase/firestore';

const PostTypeTab: React.FC<PostTypeTabProps> = ({ title, active, onPress, icon }) => (
  <TouchableOpacity 
    style={[styles.tab, active && styles.activeTab]} 
    onPress={onPress}
  >
    <Icon name={icon} size={20} color={active ? colors.primary : colors.darkGray} />
    <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
  </TouchableOpacity>
);

export default function CreatePostScreen() {
  const navigation = useNavigation();

  // State kiểm tra đăng nhập
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // States
  const [postType, setPostType] = useState<PostType>(PostType.GENERAL);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Recipe specific states
  const [recipeTitle, setRecipeTitle] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
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

  // Restaurant specific states
  const [restaurantName, setRestaurantName] = useState('');
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [cuisineInput, setCuisineInput] = useState('');
  const [priceRange, setPriceRange] = useState<'low' | 'medium' | 'high'>('medium');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [openingHours, setOpeningHours] = useState('');

  // Location states (common for all types)
  const [locationName, setLocationName] = useState('');

  // Categories states
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Kiểm tra trạng thái đăng nhập khi component được tạo
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
    });
    
    return () => unsubscribe();
  }, []);

  // Load categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      const categoriesList = await getAllCategories();
      setCategories(categoriesList);
      setLoadingCategories(false);
    };
    
    fetchCategories();
  }, []);

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

  // Hàm mở camera
  const openCamera = () => {
    launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    }, (response) => {
      if (response.didCancel) {
        return;
      }
      
      if (response.errorCode) {
        Alert.alert('Lỗi', response.errorMessage || 'Không thể mở camera');
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        setSelectedImages([...selectedImages, response.assets[0]]);
      }
    });
  };

  // Hàm xử lý thêm hashtag
  const addHashtag = () => {
    const tag = hashtagInput.trim();
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  // Hàm xử lý thêm nguyên liệu (cho recipe)
  const addIngredient = () => {
    const ingredient = ingredientInput.trim();
    if (ingredient && !ingredients.includes(ingredient)) {
      setIngredients([...ingredients, ingredient]);
      setIngredientInput('');
    }
  };

  // Hàm xử lý thêm bước hướng dẫn (cho recipe)
  const addInstruction = () => {
    const instruction = instructionInput.trim();
    if (instruction) {
      setInstructions([...instructions, instruction]);
      setInstructionInput('');
    }
  };

  // Xử lý thêm điểm tốt (pros) cho review
  const addPro = () => {
    const pro = proInput.trim();
    if (pro && !pros.includes(pro)) {
      setPros([...pros, pro]);
      setProInput('');
    }
  };

  // Xử lý thêm điểm chưa tốt (cons) cho review
  const addCon = () => {
    const con = conInput.trim();
    if (con && !cons.includes(con)) {
      setCons([...cons, con]);
      setConInput('');
    }
  };

  // Xử lý thêm loại ẩm thực (cho restaurant)
  const addCuisine = () => {
    const cuisine = cuisineInput.trim();
    if (cuisine && !cuisineTypes.includes(cuisine)) {
      setCuisineTypes([...cuisineTypes, cuisine]);
      setCuisineInput('');
    }
  };

  // Hàm xử lý chọn/bỏ chọn category
  const toggleCategorySelection = (category: Category) => {
    const isSelected = selectedCategories.some(cat => cat.categoryId === category.categoryId);
    
    if (isSelected) {
      setSelectedCategories(selectedCategories.filter(cat => cat.categoryId !== category.categoryId));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
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

      // Upload tất cả ảnh
      const mediaUrls = await Promise.all(
        selectedImages.map(img => uploadMedia(img.uri, 'image'))
      );

      // Chuẩn bị dữ liệu cơ bản
      const postData: CreatePostData = {
        caption,
        mediaUrls,
        mediaType: 'image',
        hashtags,
        categoryIds: selectedCategories.map(cat => cat.categoryId),
        postType,
        location: locationName ? { name: locationName } : undefined,
        createdAt: new Date().toISOString(), // Thêm thời gian tạo bài đăng
      };

      // Thêm dữ liệu chi tiết tùy theo loại bài đăng
      switch (postType) {
        case PostType.RECIPE:
          postData.recipeDetails = {
            title: recipeTitle,
            preparationTime: parseInt(prepTime) || 0,
            cookingTime: parseInt(cookTime) || 0,
            servings: parseInt(servings) || 1,
            ingredients,
            instructions,
            difficulty,
          };
          break;

        case PostType.REVIEW:
          postData.reviewDetails = {
            name: foodName,
            rating: rating,
            price: price ? parseFloat(price) : undefined,
            pros,
            cons,
            restaurantInfo: {
              name: restaurantName,
              cuisineType: cuisineTypes,
              priceRange,
              contactInfo: {
                phone: phoneNumber || undefined,
                website: website || undefined,
              },
              openingHours: openingHours || undefined,
            }
          };
          break;

        default:
          break;
      }

      // Tạo bài đăng
      const result = await createPost(postData);

      setLoading(false);

      if (result.success) {
        Alert.alert('Thành công', 'Bài đăng đã được tạo!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Lỗi', result.error || 'Không thể tạo bài đăng');
      }
    } catch (error) {
      setLoading(false);
      console.error('CreatePost error:', error);
      Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi tạo bài đăng');
    }
  };

  // Render các input theo loại bài đăng
  const renderPostTypeInputs = () => {
    switch (postType) {
      case PostType.RECIPE:
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin công thức</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tên món ăn</Text>
              <TextInput
                style={styles.input}
                value={recipeTitle}
                onChangeText={setRecipeTitle}
                placeholder="Ví dụ: Bánh xèo miền Trung"
              />
            </View>
            
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Thời gian chuẩn bị (phút)</Text>
                <TextInput
                  style={styles.input}
                  value={prepTime}
                  onChangeText={setPrepTime}
                  placeholder="15"
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Thời gian nấu (phút)</Text>
                <TextInput
                  style={styles.input}
                  value={cookTime}
                  onChangeText={setCookTime}
                  placeholder="30"
                  keyboardType="number-pad"
                />
              </View>
            </View>
            
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Khẩu phần</Text>
                <TextInput
                  style={styles.input}
                  value={servings}
                  onChangeText={setServings}
                  placeholder="2"
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Độ khó</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      difficulty === 'easy' && styles.activeButton
                    ]}
                    onPress={() => setDifficulty('easy')}
                  >
                    <Text style={[
                      styles.buttonText,
                      difficulty === 'easy' && styles.activeButtonText
                    ]}>Dễ</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.button,
                      difficulty === 'medium' && styles.activeButton
                    ]}
                    onPress={() => setDifficulty('medium')}
                  >
                    <Text style={[
                      styles.buttonText,
                      difficulty === 'medium' && styles.activeButtonText
                    ]}>Vừa</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.button,
                      difficulty === 'hard' && styles.activeButton
                    ]}
                    onPress={() => setDifficulty('hard')}
                  >
                    <Text style={[
                      styles.buttonText,
                      difficulty === 'hard' && styles.activeButtonText
                    ]}>Khó</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nguyên liệu</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={ingredientInput}
                  onChangeText={setIngredientInput}
                  placeholder="Thêm nguyên liệu"
                  onSubmitEditing={addIngredient}
                />
                <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
                  <Icon name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.tagsContainer}>
                {ingredients.map((ingredient, index) => (
                  <View key={`ingredient-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>{ingredient}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newIngredients = [...ingredients];
                        newIngredients.splice(index, 1);
                        setIngredients(newIngredients);
                      }}
                    >
                      <Icon name="times" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Các bước thực hiện</Text>
              <TextInput
                style={[styles.input, { textAlignVertical: 'top' }]}
                value={instructionInput}
                onChangeText={setInstructionInput}
                placeholder="Nhập bước hướng dẫn"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
                <Text style={styles.addButtonText}>Thêm bước</Text>
              </TouchableOpacity>
              
              <View style={styles.instructionsContainer}>
                {instructions.map((instruction, index) => (
                  <View key={`instruction-${index}`} style={styles.instruction}>
                    <Text style={styles.instructionNumber}>{index + 1}</Text>
                    <Text style={styles.instructionText}>{instruction}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newInstructions = [...instructions];
                        newInstructions.splice(index, 1);
                        setInstructions(newInstructions);
                      }}
                    >
                      <Icon name="trash" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );

      case PostType.REVIEW:
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đánh giá món ăn</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tên món ăn</Text>
              <TextInput
                style={styles.input}
                value={foodName}
                onChangeText={setFoodName}
                placeholder="Ví dụ: Phở bò tái nạm"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Đánh giá (1-5 sao)</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity 
                    key={`star-${star}`}
                    onPress={() => setRating(star)}
                  >
                    <Icon
                      name={star <= rating ? 'star' : 'star-o'}
                      size={30}
                      color={star <= rating ? '#FFD700' : '#ccc'}
                      style={{ marginHorizontal: 5 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Giá (nghìn VND)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="Ví dụ: 75"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Thông tin nhà hàng</Text>
              <TextInput
                style={styles.input}
                value={restaurantName}
                onChangeText={setRestaurantName}
                placeholder="Tên nhà hàng"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Loại ẩm thực</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={cuisineInput}
                  onChangeText={setCuisineInput}
                  placeholder="Thêm loại ẩm thực"
                  onSubmitEditing={addCuisine}
                />
                <TouchableOpacity style={styles.addButton} onPress={addCuisine}>
                  <Icon name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {cuisineTypes.map((cuisine, index) => (
                  <View key={`cuisine-${index}`} style={styles.tag}>
                    <Text style={styles.tagText}>{cuisine}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newCuisines = [...cuisineTypes];
                        newCuisines.splice(index, 1);
                        setCuisineTypes(newCuisines);
                      }}
                    >
                      <Icon name="times" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mức giá</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    priceRange === 'low' && styles.activeButton
                  ]}
                  onPress={() => setPriceRange('low')}
                >
                  <Text style={[
                    styles.buttonText,
                    priceRange === 'low' && styles.activeButtonText
                  ]}>Rẻ</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    priceRange === 'medium' && styles.activeButton
                  ]}
                  onPress={() => setPriceRange('medium')}
                >
                  <Text style={[
                    styles.buttonText,
                    priceRange === 'medium' && styles.activeButtonText
                  ]}>Trung bình</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    priceRange === 'high' && styles.activeButton
                  ]}
                  onPress={() => setPriceRange('high')}
                >
                  <Text style={[
                    styles.buttonText,
                    priceRange === 'high' && styles.activeButtonText
                  ]}>Cao</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Số điện thoại (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Ví dụ: 0912345678"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Website (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="Ví dụ: www.phohung.com"
                keyboardType="url"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Giờ mở cửa (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                value={openingHours}
                onChangeText={setOpeningHours}
                placeholder="Ví dụ: 7:00 - 22:00"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Điểm tốt</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={proInput}
                  onChangeText={setProInput}
                  placeholder="Thêm điểm tốt"
                  onSubmitEditing={addPro}
                />
                <TouchableOpacity style={styles.addButton} onPress={addPro}>
                  <Icon name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.tagsContainer}>
                {pros.map((pro, index) => (
                  <View key={`pro-${index}`} style={[styles.tag, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.tagText}>{pro}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newPros = [...pros];
                        newPros.splice(index, 1);
                        setPros(newPros);
                      }}
                    >
                      <Icon name="times" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Điểm chưa tốt</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={conInput}
                  onChangeText={setConInput}
                  placeholder="Thêm điểm chưa tốt"
                  onSubmitEditing={addCon}
                />
                <TouchableOpacity style={styles.addButton} onPress={addCon}>
                  <Icon name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.tagsContainer}>
                {cons.map((con, index) => (
                  <View key={`con-${index}`} style={[styles.tag, { backgroundColor: '#F44336' }]}>
                    <Text style={styles.tagText}>{con}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newCons = [...cons];
                        newCons.splice(index, 1);
                        setCons(newCons);
                      }}
                    >
                      <Icon name="times" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );

      default: // General post
        return null;
    }
  };

  // Hiển thị màn hình yêu cầu đăng nhập nếu chưa xác thực
  if (authChecked && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthContainer}>
          <Icon name="lock" size={60} color={colors.primary} style={styles.lockIcon} />
          <Text style={styles.notAuthTitle}>Bạn chưa đăng nhập</Text>
          <Text style={styles.notAuthMessage}>
            Vui lòng đăng nhập để chia sẻ bài viết của bạn với cộng đồng.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              );
            }}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Hiển thị loading khi đang kiểm tra trạng thái đăng nhập
  if (!authChecked) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo bài viết</Text>
        <TouchableOpacity onPress={handleCreatePost} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Icon name="check" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* Tab chọn loại bài đăng */}
        <View style={styles.tabContainer}>
          <PostTypeTab
            title="Thông thường"
            icon="photo"
            active={postType === PostType.GENERAL}
            onPress={() => setPostType(PostType.GENERAL)}
          />
          <PostTypeTab
            title="Công thức"
            icon="cutlery"
            active={postType === PostType.RECIPE}
            onPress={() => setPostType(PostType.RECIPE)}
          />
          <PostTypeTab
            title="Đánh giá"
            icon="star"
            active={postType === PostType.REVIEW}
            onPress={() => setPostType(PostType.REVIEW)}
          />
        </View>

        {/* Phần chọn ảnh */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh/Video</Text>
          <View style={styles.mediaButtonContainer}>
            <TouchableOpacity style={styles.mediaButton} onPress={selectImages}>
              <Icon name="image" size={20} color={colors.primary} />
              <Text style={styles.mediaButtonText}>Chọn từ thư viện</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.mediaButton} onPress={openCamera}>
              <Icon name="camera" size={20} color={colors.primary} />
              <Text style={styles.mediaButtonText}>Chụp ảnh mới</Text>
            </TouchableOpacity>
          </View>

          {selectedImages.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.imagesContainer}
            >
              {selectedImages.map((image, index) => (
                <View key={`image-${index}`} style={styles.imageContainer}>
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => {
                      const newImages = [...selectedImages];
                      newImages.splice(index, 1);
                      setSelectedImages(newImages);
                    }}
                  >
                    <Icon name="times-circle" size={22} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Phần nội dung bài viết */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nội dung</Text>
          <TextInput
            style={[styles.input, styles.captionInput]}
            multiline
            numberOfLines={4}
            value={caption}
            onChangeText={setCaption}
            placeholder="Mô tả bài viết của bạn..."
          />
        </View>

        {/* Phần hashtags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hashtags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={hashtagInput}
              onChangeText={setHashtagInput}
              placeholder="Thêm hashtag"
              onSubmitEditing={addHashtag}
            />
            <TouchableOpacity style={styles.addButton} onPress={addHashtag}>
              <Icon name="plus" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tagsContainer}>
            {hashtags.map((tag, index) => (
              <View key={`hashtag-${index}`} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
                <TouchableOpacity
                  onPress={() => {
                    const newHashtags = [...hashtags];
                    newHashtags.splice(index, 1);
                    setHashtags(newHashtags);
                  }}
                >
                  <Icon name="times" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Phần Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => setCategoriesModalVisible(true)}
          >
            <Icon name="list" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.categoryButtonText}>
              {selectedCategories.length > 0 
                ? `${selectedCategories.length} danh mục đã chọn` 
                : 'Chọn danh mục'}
            </Text>
            <Icon name="chevron-right" size={14} color="#777" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          {selectedCategories.length > 0 && (
            <View style={styles.tagsContainer}>
              {selectedCategories.map((category, index) => (
                <View key={`category-${category.categoryId}`} style={[styles.tag, { backgroundColor: '#3F51B5' }]}>
                  <Text style={styles.tagText}>{category.name}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newCategories = [...selectedCategories];
                      newCategories.splice(index, 1);
                      setSelectedCategories(newCategories);
                    }}
                  >
                    <Icon name="times" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Phần địa điểm */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa điểm</Text>
          <View style={styles.locationContainer}>
            <Icon name="map-marker" size={20} color={colors.primary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Thêm địa điểm (tùy chọn)"
            />
          </View>
        </View>
        
        {/* Phần input theo loại bài đăng */}
        {renderPostTypeInputs()}
      </ScrollView>

      {/* Modal chọn categories */}
      <Modal
        visible={categoriesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoriesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setCategoriesModalVisible(false)}>
                <Icon name="times" size={22} color="#777" />
              </TouchableOpacity>
            </View>

            {loadingCategories ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
              data={categories.filter(cat => cat.type === postType)}  keyExtractor={(item) => item.categoryId}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.categoryItem}
                    onPress={() => toggleCategorySelection(item)}
                  >
                    <Text style={styles.categoryItemText}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.categoryItemDescription}>{item.description}</Text>
                    )}
                    <View style={styles.categoryCheckbox}>
                      {selectedCategories.some(cat => cat.categoryId === item.categoryId) && (
                        <Icon name="check" size={16} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => setCategoriesModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang đăng bài...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  scrollContainer: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 4,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text,
  },
  mediaButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  mediaButtonText: {
    marginLeft: 8,
    color: colors.text,
    fontSize: 14,
  },
  imagesContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    color: colors.text,
    backgroundColor: '#fff',
  },
  captionInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
  },
  addButton: {
    padding: 10,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 4,
  },
  tagText: {
    color: '#fff',
    marginRight: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.text,
  },
  activeButtonText: {
    color: '#fff',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  instructionsContainer: {
    marginTop: 16,
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  instructionText: {
    flex: 1,
    color: colors.text,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryItemText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  categoryItemDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  categoryCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notAuthContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lockIcon: {
    marginBottom: 20,
  },
  notAuthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  notAuthMessage: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});