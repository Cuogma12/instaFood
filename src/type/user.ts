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