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
} from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';  // Hoặc các bộ icon khác như Ionicons, MaterialIcons
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width / 3;
const ITEM_HEIGHT = ITEM_WIDTH;

// Removed duplicate declaration of RootStackParamList

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface UserProfile {
  username: string;
  displayName: string;
  posts: number;
  followers: number;
  following: number;
  avatar: string | null;
  bio: string | null;
}

interface Post {
  id: string;
  imageUrl: string;
}

export default function ProfileScreen() {

  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        // Lấy dữ liệu user từ Firestore
        const userDoc = await firestore().collection('Users').doc(user.uid).get();
        const userData = userDoc.data();
        setUserProfile({
          username: userData?.username || require('../../assets/images/defaultuser.png'),
          displayName: userData?.displayName || '',
          posts: userData?.posts || 0,
          followers: userData?.followers || 0,
          following: userData?.following || 0,
          avatar: userData?.photoURL || null,
          bio: userData?.bio || 'no bio yet',
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);


  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <Text style={styles.messageText}>
            Vui lòng đăng nhập để xem thông tin cá nhân
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
            activeOpacity={0.7}
          >
            <Text style={styles.loginButtonText}>
              Đăng nhập
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Mock data for posts
  const posts: Post[] = Array(15).fill(null).map((_, index) => ({
    id: index.toString(),
    imageUrl: `https://picsum.photos/200/200?random=${index}`,
  }));

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{userProfile?.username}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity style={{ marginRight: 15 }}>
          <Icon name="plus-square" size={30} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity>
          <Icon name="bars" size={30} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileInfo = () => (
    <View style={styles.profileInfo}>
      <View style={{ alignItems: 'center', marginRight: 20 }}>
        <Image
          source={userProfile?.avatar ? { uri: userProfile.avatar } : require('../../assets/images/defaultuser.png')}
          style={styles.avatarImage}
        />
        <Text style={styles.bioText}>{userProfile?.bio}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.displayName}>{userProfile?.displayName}</Text>
        <View style={styles.statsContainer}>

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userProfile?.posts}</Text>
            <Text style={styles.statLabel}>Bài viết</Text>
          </View>
          <TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile?.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile?.following}</Text>
              <Text style={styles.statLabel}>Followings</Text>
            </View>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.editButtonText}>Chỉnh sửa</Text>

      </TouchableOpacity>
      <TouchableOpacity style={styles.shareButton}>
        <Icon name='user-plus' size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );


  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity>
        <View>
          <Icon name="th" size={25} color={colors.text} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity>
        <View>
          <Icon name="film" size={25} color={colors.darkGray} />
        </View></TouchableOpacity>
      <TouchableOpacity>
        <View>
          <Icon name="bookmark" size={25} color={colors.darkGray} />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity style={styles.postItem}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.postImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderPosts = () => (
    <FlatList
      data={posts}
      renderItem={renderPostItem}
      keyExtractor={item => item.id}
      numColumns={3}
      scrollEnabled={false}
      style={styles.postsGrid}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView>
        {renderProfileInfo()}
        {renderActions()}
        {renderTabs()}
        <View style={styles.content}>
          {renderPosts()}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    height: 60,
    justifyContent: 'space-between',


  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 8,

  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 5,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: colors.lightGray,
    marginTop: 5,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.darkGray,
  },
  userInfo: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  displayName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    marginTop: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
    marginTop: 50
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 3,

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
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGray,
    paddingBottom: 5,
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
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messageText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 13,
    color: colors.darkGray,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    alignSelf: 'center',
    paddingVertical: 2,
    marginTop: 20,
  },
});