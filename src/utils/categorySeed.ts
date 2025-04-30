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
          "type": "recipe",
          "name": "Súp & Cháo",
          "description": "Các món súp, cháo bổ dưỡng",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "5",
          "type": "recipe",
          "name": "Đồ ăn nhanh (Fastfood)",
          "description": "Burger, gà rán, khoai tây chiên",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "6",
          "type": "recipe",
          "name": "Bánh mì",
          "description": "Bánh mì Việt Nam, sandwich",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "7",
          "type": "recipe",
          "name": "Phở & Bún",
          "description": "Các loại phở, bún",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "8",
          "type": "recipe",
          "name": "Tráng miệng (Dessert)",
          "description": "Pudding, mousse, bánh flan",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "9",
          "type": "review",
          "name": "Nhà hàng sang trọng",
          "description": "Fine dining, nhà hàng 5 sao",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "10",
          "type": "review",
          "name": "Quán ăn vỉa hè",
          "description": "Ẩm thực đường phố",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "11",
          "type": "recipe",
          "name": "Kem",
          "description": "Món kem mát lạnh",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "12",
          "type": "location",
          "name": "Hà Nội",
          "description": "Địa điểm tại Hà Nội",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "13",
          "type": "location",
          "name": "TP.HCM",
          "description": "Địa điểm tại TP.HCM",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "14",
          "type": "normal",
          "name": "Món ăn đặc biệt",
          "description": "Các món ăn đặc biệt cho dịp lễ",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "15",
          "type": "normal",
          "name": "Thực phẩm chay",
          "description": "Các món ăn chay ngon miệng và bổ dưỡng",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "16",
          "type": "normal",
          "name": "Đồ uống",
          "description": "Các loại đồ uống, từ nước trái cây đến cà phê",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "17",
          "type": "normal",
          "name": "Món ăn sáng",
          "description": "Các món ăn sáng nhanh và bổ dưỡng",
          "imageUrl": null,
          "createdAt": "2025-04-28T12:54:09Z"
        },
        {
          "categoryId": "18",
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
