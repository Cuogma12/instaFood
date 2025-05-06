import { collection, addDoc, serverTimestamp, getFirestore } from '@react-native-firebase/firestore';
const categories = [
    {
        "categoryId": "1",
        "type": "recipe",
        "name": "Salad & Healthy Food",
        "description": "Các món salad, eat-clean, low-carb",
        "imageUrl": null,
        "createdAt": "2025-04-28T12:54:09Z"
    },
    {
        "categoryId": "2",
        "type": "recipe",
        "name": "Đồ nướng BBQ",
        "description": "Món nướng thơm lừng",
        "imageUrl": null,
        "createdAt": "2025-04-28T12:54:09Z"
    },
    {
        "categoryId": "3",
        "type": "recipe",
        "name": "Món cay Hàn Quốc",
        "description": "Tokbokki, mì cay",
        "imageUrl": null,
        "createdAt": "2025-04-28T12:54:09Z"
    },
    {
        "categoryId": "4",
        "type": "normal",
        "name": "Món ăn đặc biệt",
        "description": "Các món ăn đặc biệt cho dịp lễ",
        "imageUrl": null,
        "createdAt": "2025-04-28T12:54:09Z"
    },
    {
        "categoryId": "5",
        "type": "normal",
        "name": "Thực phẩm chay",
        "description": "Các món ăn chay ngon miệng và bổ dưỡng",
        "imageUrl": null,
        "createdAt": "2025-04-28T12:54:09Z"
    },
    {
        "categoryId": "6",
        "type": "review",
        "name": "Nhà hàng sang trọng",
        "description": "Fine dining, nhà hàng 5 sao",
        "imageUrl": null,
        "createdAt": "2025-04-28T12:54:09Z"
    },
    {
        "categoryId": "7",
        "type": "review",
        "name": "Quán ăn vỉa hè",
        "description": "Ẩm thực đường phố",
        "imageUrl": null,
        "createdAt": "2025-04-28T12:54:09Z"
    },
    {
        "categoryId": "8",
        "type": "review",
        "name": "Nhà hàng hải sản",
        "description": "Nhà hàng chuyên hải sản tươi ngon",
        "imageUrl": null,
        "createdAt": "2025-04-28T12:54:09Z"
    }
];

export const seedCategories = async () => {
    try {
        const db = getFirestore();
        const categoriesCollection = collection(db, 'Categories');

        for (const category of categories) {
            await addDoc(categoriesCollection, {
                ...category,
                createdAt: serverTimestamp(),
            });
        }

        console.log('✅ Seed Categories thành công!');
    } catch (error) {
        console.error('Error seeding categories:', error);
    }
};
