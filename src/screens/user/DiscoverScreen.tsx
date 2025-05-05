import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/stackparamlist';
import RecipePost from '../../components/user/RecipePost';

type DiscoverScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FiltersState {
  priceRange: [number, number];
  rating: number;
  dietaryRestrictions: string[];
}

// Kích thước màn hình
const { width } = Dimensions.get('window');

// Dữ liệu mẫu cho danh mục
const categories = [
  { id: '1', name: 'Món Việt', icon: 'restaurant-outline' },
  { id: '2', name: 'Đồ uống', icon: 'cafe-outline' },
  { id: '3', name: 'Bánh ngọt', icon: 'ice-cream-outline' },
  { id: '4', name: 'Ăn vặt', icon: 'fast-food-outline' },
  { id: '5', name: 'Món Á', icon: 'nutrition-outline' },
  { id: '6', name: 'Món Âu', icon: 'pizza-outline' },
];

// Dữ liệu mẫu cho món ăn gần đây
const nearbyFoods = [
  { 
    id: '1', 
    name: 'Quán phở Hà Nội', 
    image: 'https://via.placeholder.com/300x150?text=Phở+Hà+Nội',
    distance: '1.2 km',
    rating: 4.7
  },
  { 
    id: '2', 
    name: 'Bún chả Hương Liên', 
    image: 'https://via.placeholder.com/300x150?text=Bún+Chả',
    distance: '2.5 km',
    rating: 4.9
  },
  { 
    id: '3', 
    name: 'Bánh mì Phượng', 
    image: 'https://via.placeholder.com/300x150?text=Bánh+Mì',
    distance: '3.1 km',
    rating: 4.6
  },
];

// Dữ liệu mẫu cho món ăn xu hướng
const trendingFoods = [
  { 
    id: '1', 
    name: 'Bánh mì Việt Nam', 
    image: 'https://via.placeholder.com/300x200?text=Bánh+Mì',
    likes: 352,
    author: 'Đầu bếp Hà'
  },
  { 
    id: '2', 
    name: 'Bún chả Hà Nội', 
    image: 'https://via.placeholder.com/300x200?text=Bún+Chả',
    likes: 289,
    author: 'Vua đầu bếp'
  },
  { 
    id: '3', 
    name: 'Cà phê trứng', 
    image: 'https://via.placeholder.com/300x200?text=Cà+phê+trứng',
    likes: 201,
    author: 'Quán Cafe'
  },
];

// Dữ liệu mẫu cho đề xuất
const suggestions = [
  { 
    id: '1', 
    name: 'Bún đậu mắm tôm', 
    image: 'https://via.placeholder.com/150x150?text=Bún+đậu',
    likes: 156
  },
  { 
    id: '2', 
    name: 'Gỏi cuốn tôm thịt', 
    image: 'https://via.placeholder.com/150x150?text=Gỏi+cuốn',
    likes: 124
  },
  { 
    id: '3', 
    name: 'Bánh xèo miền Trung', 
    image: 'https://via.placeholder.com/150x150?text=Bánh+xèo',
    likes: 98
  },
  { 
    id: '4', 
    name: 'Cơm tấm Sài Gòn', 
    image: 'https://via.placeholder.com/150x150?text=Cơm+tấm',
    likes: 187
  },
];

// Dữ liệu mẫu cho đầu bếp nổi bật
const popularChefs = [
  {
    id: '1',
    name: 'Chef Mai',
    avatar: 'https://via.placeholder.com/100x100?text=Chef+Mai',
    followers: 25600,
    following: false
  },
  {
    id: '2',
    name: 'Chef Tuấn',
    avatar: 'https://via.placeholder.com/100x100?text=Chef+Tuấn',
    followers: 18900,
    following: true
  },
  {
    id: '3',
    name: 'Chef Linh',
    avatar: 'https://via.placeholder.com/100x100?text=Chef+Linh',
    followers: 12400,
    following: false
  }
];

const DiscoverScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('trending');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    priceRange: [10, 200],
    rating: 0,
    dietaryRestrictions: []
  });

  const navigation = useNavigation<DiscoverScreenNavigationProp>();

  // Giả lập tải dữ liệu
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [activeTab]);

  // Hàm refresh khi kéo xuống
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Mô phỏng tải lại dữ liệu
    setTimeout(() => {
      // Tải lại dữ liệu tại đây
      setRefreshing(false);
    }, 1500);
  }, []);

  // Render item cho địa điểm gần đây
  const renderNearbyItem = ({ item }: { item: typeof nearbyFoods[0] }) => (
    <TouchableOpacity 
      style={styles.nearbyItem}
      onPress={() => navigation.navigate('RecipePost', { id: item.id })}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image }} style={styles.nearbyImage} />
      <View style={styles.nearbyContent}>
        <Text style={styles.nearbyName}>{item.name}</Text>
        <View style={styles.nearbyInfo}>
          <View style={styles.nearbyDistance}>
            <Icon name="location-outline" size={14} color="#666" />
            <Text style={styles.nearbyText}>{item.distance}</Text>
          </View>
          <View style={styles.nearbyRating}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.nearbyText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render item cho danh mục
  const renderCategory = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={styles.categoryIconContainer}>
        <Icon name={item.icon} size={24} color="#FF6B00" />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render item cho món ăn xu hướng
  const renderTrendingItem = ({ item }: { item: typeof trendingFoods[0] }) => (
    <TouchableOpacity style={styles.trendingItem}>
      <Image source={{ uri: item.image }} style={styles.trendingImage} />
      <View style={styles.trendingOverlay}>
        <Text style={styles.trendingName}>{item.name}</Text>
        <View style={styles.trendingInfo}>
          <Text style={styles.trendingAuthor}>{item.author}</Text>
          <View style={styles.likesContainer}>
            <Icon name="heart" size={16} color="#FF6B00" />
            <Text style={styles.likesText}>{item.likes}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.saveButton}>
        <Icon name="bookmark-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render item cho đề xuất
  const renderSuggestionItem = ({ item }: { item: typeof suggestions[0] }) => (
    <TouchableOpacity style={styles.suggestionItem}>
      <Image source={{ uri: item.image }} style={styles.suggestionImage} />
      <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
      <View style={styles.likesContainer}>
        <Icon name="heart" size={14} color="#FF6B00" />
        <Text style={styles.smallLikesText}>{item.likes}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render item cho đầu bếp nổi bật
  const renderChefItem = ({ item }: { item: typeof popularChefs[0] }) => (
    <View style={styles.chefItem}>
      <Image source={{ uri: item.avatar }} style={styles.chefAvatar} />
      <Text style={styles.chefName}>{item.name}</Text>
      <Text style={styles.followerCount}>{(item.followers / 1000).toFixed(1)}K</Text>
      <TouchableOpacity 
        style={[
          styles.followButton, 
          item.following ? styles.followingButton : {}
        ]}
      >
        <Text style={[
          styles.followButtonText,
          item.following ? styles.followingButtonText : {}
        ]}>
          {item.following ? 'Đang theo dõi' : 'Theo dõi'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header và thanh tìm kiếm */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khám phá</Text>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm món ăn, công thức..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Icon name="options-outline" size={20} color="#FF6B00" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab lựa chọn */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
            onPress={() => setActiveTab('trending')}
          >
            <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
              Xu hướng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
            onPress={() => setActiveTab('popular')}
          >
            <Text style={[styles.tabText, activeTab === 'popular' && styles.activeTabText]}>
              Phổ biến nhất
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
            onPress={() => setActiveTab('recent')}
          >
            <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
              Gần đây
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'following' && styles.activeTab]}
            onPress={() => setActiveTab('following')}
          >
            <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
              Đang theo dõi
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Chuyển đổi chế độ xem */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity 
          style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]} 
          onPress={() => setViewMode('grid')}
        >
          <Icon name="grid-outline" size={20} color={viewMode === 'grid' ? "#FF6B00" : "#999"} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]} 
          onPress={() => setViewMode('list')}
        >
          <Icon name="list-outline" size={20} color={viewMode === 'list' ? "#FF6B00" : "#999"} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={["#FF6B00"]} 
            />
          }
        >
          {/* Danh mục */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* Xu hướng hôm nay */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Xu hướng hôm nay</Text>
            <FlatList
              data={trendingFoods}
              renderItem={renderTrendingItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* Quanh đây */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quanh đây</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={nearbyFoods}
              renderItem={renderNearbyItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>

          {/* Gợi ý cho bạn */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={suggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={styles.suggestionsRow}
              scrollEnabled={false}
            />
          </View>

          {/* Đầu bếp nổi bật */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Đầu bếp nổi bật</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={popularChefs}
              renderItem={renderChefItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
          
          {/* Khoảng trống dưới cùng */}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Modal bộ lọc */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Bộ lọc</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Icon name="close-outline" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.filterSectionTitle}>Khoảng giá</Text>
            <View style={styles.priceRangeContainer}>
              <Text>{filters.priceRange[0]}K</Text>
              <Text style={{ marginLeft: 'auto' }}>{filters.priceRange[1]}K</Text>
            </View>
            <View style={styles.sliderTrack}>
              <View style={styles.sliderFill} />
              <TouchableOpacity style={[styles.sliderHandle, { left: '10%' }]} />
              <TouchableOpacity style={[styles.sliderHandle, { right: '20%' }]} />
            </View>
            
            <Text style={styles.filterSectionTitle}>Đánh giá tối thiểu</Text>
            <View style={styles.ratingOptions}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity 
                  key={star} 
                  style={[styles.starOption, filters.rating >= star && styles.activeStar]}
                  onPress={() => setFilters({...filters, rating: star})}
                >
                  <Icon 
                    name={filters.rating >= star ? "star" : "star-outline"} 
                    size={24} 
                    color={filters.rating >= star ? "#FFD700" : "#999"} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Chế độ ăn</Text>
            <View style={styles.dietOptions}>
              {['Chay', 'Chay tịnh', 'Ít calo', 'Không đường', 'Không gluten'].map(diet => (
                <TouchableOpacity 
                  key={diet}
                  style={[
                    styles.dietTag, 
                    (filters.dietaryRestrictions as string[]).includes(diet) && styles.activeDietTag
                  ]}
                  onPress={() => {
                    let newDiet = [...filters.dietaryRestrictions as string[]];
                    if (newDiet.includes(diet)) {
                      newDiet = newDiet.filter(item => item !== diet);
                    } else {
                      newDiet.push(diet);
                    }
                    setFilters({...filters, dietaryRestrictions: newDiet});
                  }}
                >
                  <Text style={[
                    styles.dietTagText,
                    (filters.dietaryRestrictions as string[]).includes(diet) && styles.activeDietTagText
                  ]}>
                    {diet}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => setFilters({ priceRange: [10, 200], rating: 0, dietaryRestrictions: [] })}
              >
                <Text style={styles.resetButtonText}>Đặt lại</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => {
                  // Áp dụng bộ lọc
                  setFilterModalVisible(false);
                  // Tải lại dữ liệu với bộ lọc mới
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 1000);
                }}
              >
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  filterButton: {
    marginLeft: 10,
    padding: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B00',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B00',
    fontWeight: '500',
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    textAlign: 'center',
    color: '#333',
  },
  trendingItem: {
    width: width * 0.75,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
  },
  trendingName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendingAuthor: {
    color: 'white',
    fontSize: 12,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  smallLikesText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 2,
  },
  saveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  suggestionsRow: {
    justifyContent: 'space-between',
  },
  suggestionItemContainer: {
    width: '48%',
    marginBottom: 16,
  },
  suggestionItem: {
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  suggestionImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    padding: 8,
    paddingBottom: 4,
  },
  chefItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 100,
  },
  chefAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  chefName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  followerCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  followButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    width: 90,
    alignItems: 'center',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  followingButtonText: {
    color: '#FF6B00',
  },
  viewModeContainer: {
    flexDirection: 'row',
    position: 'absolute',
    right: 16,
    top: 20,
    zIndex: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 6,
  },
  activeViewMode: {
    backgroundColor: '#FFF0E6',
  },
  nearbyItem: {
    width: width * 0.7,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  nearbyImage: {
    width: '40%',
    height: '100%',
  },
  nearbyContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  nearbyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nearbyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nearbyDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  filterModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 16,
  },
  sliderFill: {
    height: 4,
    backgroundColor: '#FF6B00',
    borderRadius: 2,
    position: 'absolute',
    left: '10%',
    right: '20%',
  },
  sliderHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B00',
    position: 'absolute',
    top: -8,
  },
  ratingOptions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  starOption: {
    marginRight: 8,
    padding: 6,
  },
  activeStar: {
    backgroundColor: '#FFF0E6',
    borderRadius: 8,
  },
  dietOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dietTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  activeDietTag: {
    backgroundColor: '#FF6B00',
  },
  dietTagText: {
    fontSize: 12,
    color: '#333',
  },
  activeDietTagText: {
    color: '#fff',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  resetButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B00',
    width: '48%',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B00',
    width: '48%',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DiscoverScreen;