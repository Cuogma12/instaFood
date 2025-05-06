import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { colors } from '../../utils/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import firestore from '@react-native-firebase/firestore';

interface StatCardProps {
  icon: string;
  title: string;
  value: number;
  color: string;
}

export default function AdminStatistics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    recipePosts: 0,
    reviewPosts: 0,
    generalPosts: 0,
    totalCategories: 0,
  });

  const fetchStats = async () => {
    try {
      const db = firestore();
      
      // Đếm tổng số người dùng
      const usersCount = (await db.collection('Users').get()).size;
      
      // Đếm các loại bài đăng
      const postsSnapshot = await db.collection('Posts').get();
      const posts = postsSnapshot.docs.map(doc => doc.data());
      const totalPosts = posts.length;
      const recipePosts = posts.filter(post => post.postType === 'recipe').length;
      const reviewPosts = posts.filter(post => post.postType === 'review').length;
      const generalPosts = posts.filter(post => post.postType === 'normal').length;
      
      // Đếm tổng số danh mục
      const categoriesCount = (await db.collection('Categories').get()).size;

      setStats({
        totalUsers: usersCount,
        totalPosts,
        recipePosts,
        reviewPosts,
        generalPosts,
        totalCategories: categoriesCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const loadStats = async () => {
      await fetchStats();
      setLoading(false);
    };
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const StatCard = ({ icon, title, value, color }: StatCardProps) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thống kê tổng quan</Text>
        <Text style={styles.headerSubtitle}>
          Cập nhật lần cuối: {new Date().toLocaleString()}
        </Text>
      </View>

      <View style={styles.grid}>
        <StatCard
          icon="users"
          title="Người dùng"
          value={stats.totalUsers}
          color="#4CAF50"
        />
        <StatCard
          icon="file-text"
          title="Tổng bài đăng"
          value={stats.totalPosts}
          color="#2196F3"
        />
        <StatCard
          icon="cutlery"
          title="Công thức"
          value={stats.recipePosts}
          color="#FF9800"
        />
        <StatCard
          icon="star"
          title="Đánh giá"
          value={stats.reviewPosts}
          color="#9C27B0"
        />
        <StatCard
          icon="newspaper-o"
          title="Bài viết thường"
          value={stats.generalPosts}
          color="#607D8B"
        />
        <StatCard
          icon="list"
          title="Danh mục"
          value={stats.totalCategories}
          color="#795548"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  grid: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});