export interface UserData {
    uid: string;
    email: string;
    username: string;
    displayName: string;
    photoURL: string | null;
    bio: string;
    role: string;
    createdAt: Date;
}

export interface RegisterResult {
    success: boolean;
    message?: string;
    user?: UserData;
}

export interface UserProfile {
    username: string;
    displayName: string;
    posts: number;
    followers: number;
    following: number;
    avatar: string | null;
    bio: string | null;
}

export interface UserProfileData {
    uid?: string;
    email?: string;
    username?: string;
    displayName?: string;
    photoURL?: string | null;
    bio?: string;
    role?: string;
    posts?: number;
    followers?: number;
    following?: number;
    createdAt?: Date;
}