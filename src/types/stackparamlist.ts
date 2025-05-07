// Kiểu RootStackParamList để khai báo các màn hình trong navigation
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainApp: { screen: string };
  EditProfile: undefined;
  SettingScreen: undefined;
  Admin: undefined;
  RecipePost: { id: string };
  PostDetail: { postId: string };
};

export type AdminStackParamList = {
  AdminHome: undefined;
  CreateCategory: undefined;
  BackToApp: undefined;
};