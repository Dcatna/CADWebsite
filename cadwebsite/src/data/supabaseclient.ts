import { createClient, type Session, type User } from '@supabase/supabase-js';
import type { FileType, StoredUser } from './types';
import { useUserStore } from './userstore';

export const supabase = createClient(
  'https://eqotajbtrxfslfvpjhnd.supabase.co',
  import.meta.env.VITE_SUPABASE_API_KEY
);

export async function GetSignedInUserAndRole() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const userId = session.user.id;

  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  const refreshUser = useUserStore((s) => s.refreshUser)
  await refreshUser()
  
  return {
    user: session.user,
    stored: data,
  };
}

export async function SignOut() {
  const data = await supabase.auth.signOut();
  return data;
}

export async function signInWithEmailAndPassword(
  email: string,
  password: string
): Promise<{ user: User; session: Session } | null> {
  try {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (result.data.user && result.data.session) {
      return result.data;
    }
  } catch {
    return null;
  }
  return null;
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("user_id", id);

  if (error) {
    console.error("Error fetching user by ID:", error.message);
    return null;
  }
  if (!data || data.length <= 0) {
    console.error("No user found");
    return null;
  }

  return {
    user_id: data[0].user_id,
    email: data[0].email,
    username: data[0].username,
  } satisfies StoredUser;
}

export async function uploadMedia(file: File, user_id: string, fileName: string) {
  const fullFileName = `${fileName}.glb`;
  const filePath = `user-uploads/${user_id}/${fullFileName}`;

  const { error } = await supabase.storage
    .from("cadfiles")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("cadfiles")
    .getPublicUrl(filePath);

  return urlData?.publicUrl;
}

export async function getAllCADFilesForUser(userId: string): Promise<FileType[]> {
  const result: FileType[] = [];
  const path = `user-uploads/${userId}`;

  const { data: files, error } = await supabase
    .storage
    .from("cadfiles")
    .list(path);

  if (error || !files) {
    console.error("Error listing CAD files:", error);
    return [];
  }

  for (const file of files) {
    const fullPath = `${path}/${file.name}`;
    const { data } = supabase.storage.from("cadfiles").getPublicUrl(fullPath);

    result.push({
      name: file.name,
      url: data.publicUrl,
      path: fullPath, // ✅ Added so we can use .download()
    });
  }

  return result;
}
