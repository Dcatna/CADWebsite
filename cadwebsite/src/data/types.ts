import type { User } from "@supabase/supabase-js";


export type UserData = {
    user: User;
    stored: StoredUser;
    
};

export type StoredUser = {
    email: string;

    user_id: string;
    username: string;
}

export type FamilyMemeber = {
    name : string,
    userId: string,
    created_at: string,

}

export type GroupMediaItem = {
  url: string;
  uploader: string; // personName
};

export type FileType = {
    url: string; 
    name: string
}