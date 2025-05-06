import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, collection, doc, getDoc, query, where, orderBy, getDocs } from '@react-native-firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../types/stackparamlist';
import { UserProfile } from '../../types/user';
import { ProfilePost } from '../../types/post';
import useAuth from '../../hooks/useAuth';
import AuthRequired from '../../components/auth/AuthRequired';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;
const ITEM_HEIGHT = 1.5*ITEM_WIDTH;

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;


export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { isAuthenticated, authChecked, user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userDocRef = doc(db, 'Users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();

      if (userData) {
        setUserProfile({
          username: userData.username || '',
          displayName: userData.displayName || '',
          posts: userData.posts || 0,
          followers: userData.followers || 0,
          following: userData.following || 0,
          avatar: userData.photoURL || null,
          bio: userData.bio || 'no bio yet',
        });
      }

      const postsRef = collection(db, 'Posts');
      const postsQuery = query(
        postsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const postsSnapshot = await getDocs(postsQuery);

      const userPosts = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        imageUrl:
          doc.data().mediaUrls && doc.data().mediaUrls.length > 0
            ? doc.data().mediaUrls[0]
            : `https://picsum.photos/200/200?random=${Math.random()}`,
      }));

      setPosts(userPosts);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };
  
  // dùng useFocusEffect để lấy dữ liệu
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
      return () => {
        // Cleanup nếu cần
      };
    }, [user])
  );

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  // Hàm điều hướng đến tab CreatePost
  const navigateToCreatePost = () => {
    // Sử dụng jumpTo thay vì navigate để chuyển tab
    // @ts-ignore - Bỏ qua lỗi TypeScript vì navigation có thể là từ stack hoặc tab
    if (navigation.jumpTo) {
      // @ts-ignore
      navigation.jumpTo('CreatePost');
    } else {
      // Fallback nếu là stack navigator
      navigation.navigate('MainApp', { screen: 'CreatePost' });
    }
  };
const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{userProfile?.username || 'Trang cá nhân'}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity style={{ marginRight: 15 }}>
          <Icon name="plus-square" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress ={() => navigation.navigate('SettingScreen')}>
          <Icon name="bars" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileInfo = () => (
    <View style={styles.profileInfo}>
      <View style={styles.avatarContainer}>
        <Image
          source={userProfile?.avatar ? { uri: userProfile.avatar } : require('../../assets/images/defaultuser.png')}
          style={styles.avatarImage}
        />
        <Text style={styles.bioText}>{userProfile?.bio || 'Chưa có giới thiệu'}</Text>
      </View>
      <View style={styles.userInfoContainer}>
        <Text style={styles.displayName}>{userProfile?.displayName || 'Chưa đặt tên'}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile?.posts || 0}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile?.followers || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile?.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.editButtonText}>Chỉnh sửa</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.shareButton}>
        <Icon name="user-plus" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity style={styles.tabItem}>
        <Icon name="th" size={22} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem}>
        <Icon name="film" size={22} color={colors.darkGray} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem}>
        <Icon name="bookmark" size={22} color={colors.darkGray} />
      </TouchableOpacity>
    </View>
  );

  const renderPostItem = ({ item }: { item: ProfilePost }) => (
    <TouchableOpacity style={styles.postItem}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.postImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderPosts = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (posts.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="camera" size={50} color={colors.lightGray} />
          <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={navigateToCreatePost}
          >
            <Text style={styles.emptyButtonText}>Tạo bài viết đầu tiên</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        scrollEnabled={false}
        style={styles.postsGrid}
      />
    );
  };

  return (
    <AuthRequired
      authChecked={authChecked}
      isAuthenticated={isAuthenticated}
      message="Vui lòng đăng nhập để xem thông tin cá nhân"
    >
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderProfileInfo()}
          {renderActions()}
          {renderTabs()}
          <View style={styles.content}>{renderPosts()}</View>
        </ScrollView>
      </SafeAreaView>
    </AuthRequired>
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
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    height: 65,
    justifyContent: 'space-between',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: 15,
    width: 90,
  },
  userInfoContainer: {
    flex: 1,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: colors.lightGray,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 2,
  },
  displayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
    marginTop: 5,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  editButtonText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  content: {
    flex: 1,
  },
  postsGrid: {
    flex: 1,
  },
  postItem: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    padding: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  bioText: {
    fontSize: 12,
    color: colors.darkGray,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 90,
    flexWrap: 'wrap',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    color: colors.darkGray,
    marginTop: 10,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});