import { collection, addDoc, serverTimestamp, getFirestore } from '@react-native-firebase/firestore';

const categories = [
  {
    type: 'recipe',
    name: 'Salad & Healthy Food',
    description: 'Các món salad, eat-clean, low-carb',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'recipe',
    name: 'Đồ nướng BBQ',
    description: 'Món nướng thơm lừng',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'recipe',
    name: 'Món cay Hàn Quốc',
    description: 'Tokbokki, mì cay',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'normal',
    name: 'Món ăn đặc biệt',
    description: 'Các món ăn đặc biệt cho dịp lễ',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },  {
    type: 'general',
    name: 'Thực phẩm chay',
    description: 'Các món ăn chay ngon miệng và bổ dưỡng',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'review',
    name: 'Nhà hàng sang trọng',
    description: 'Fine dining, nhà hàng 5 sao',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'review',
    name: 'Quán ăn vỉa hè',
    description: 'Ẩm thực đường phố',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'review',
    name: 'Nhà hàng hải sản',
    description: 'Nhà hàng chuyên hải sản tươi ngon',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'recipe',
    name: 'Món Nhật',
    description: 'Sushi, sashimi, tempura, ramen',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'recipe',
    name: 'Món Ý',
    description: 'Pizza, pasta, risotto, lasagna',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'recipe',
    name: 'Món Trung',
    description: 'Dimsum, vịt quay Bắc Kinh, mì xào',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },  {
    type: 'general',
    name: 'Ăn sáng',
    description: 'Các món ăn sáng phổ biến',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },  {
    type: 'general',
    name: 'Ăn trưa',
    description: 'Các món ăn trưa tiện lợi',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },  {
    type: 'general',
    name: 'Ăn tối',
    description: 'Các món ăn tối ngon miệng',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'review',
    name: 'Quán cafe đẹp',
    description: 'Địa điểm check-in, sống ảo',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'review',
    name: 'Buffet',
    description: 'Nhà hàng buffet đa dạng món',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'review',
    name: 'Nhà hàng gia đình',
    description: 'Không gian ấm cúng, phù hợp gia đình',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
  {
    type: 'review',
    name: 'Quán ăn vặt',
    description: 'Các món ăn vặt tuổi teen',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },  {
    type: 'general',
    name: 'Đồ uống',
    description: 'Nước ép, sinh tố, trà sữa, cà phê',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },  {
    type: 'general',
    name: 'Bánh ngọt',
    description: 'Bánh kem, cupcake, cookies',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },  {
    type: 'general',
    name: 'Đồ ăn nhanh',
    description: 'Hamburger, gà rán, khoai tây chiên',
    imageUrl: null,
    createdAt: serverTimestamp(),
  },
];

export const seedCategories = async () => {
  try {
    const db = getFirestore();
    const categoriesCollection = collection(db, 'Categories');
    for (const category of categories) {
      await addDoc(categoriesCollection, category);
    }
    console.log('✅ Seed Categories thành công!');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};
