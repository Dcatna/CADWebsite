import { failureResult, successResult, type Result } from "../lib/utils";
import { 
  getAllCADFilesForUser, 
  getUserById, 
  signInWithEmailAndPassword, 
  supabase 
} from "./supabaseclient";
import type { FileType, UserData } from "./types";
import { create } from "zustand";

export interface UserStore {
  userData: UserData | undefined;
  files: FileType[];
  refreshUserFiles: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  init: () => () => void;
  removeFile: (path: string) => Promise<void>;
}

function getInitialUserData() {
  try {
    const userString = localStorage.getItem("user");
    const storedString = localStorage.getItem("stored");

    const user = userString ? JSON.parse(userString) : null;
    const stored = storedString ? JSON.parse(storedString) : null;

    if (user && stored && user.user.id === stored.user_id) {
      return {
        user: user.user,
        stored: {
          ...stored,
          activeRole: stored.activeRole ?? null,
        },
      };
    }
  } catch (error) {
    console.error("Error parsing localStorage data:", error);
  }
  return undefined;
}

export const useUserStore = create<UserStore>((set, get) => ({
  userData: getInitialUserData(),
  files: JSON.parse(localStorage.getItem("files") || "[]"), // ✅ Restore saved files

  init: () => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(event, session);

      if (event === "SIGNED_IN") {
        get().refreshUser();
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("user");
        localStorage.removeItem("stored");
        localStorage.removeItem("files");
        set({ userData: undefined, files: [] });
      } else if (event === "USER_UPDATED") {
        get().refreshUser();
      }
    });

    initializeUser().then((result) => {
      if (!result.ok) {
        localStorage.removeItem("user");
        localStorage.removeItem("stored");
        localStorage.removeItem("files");
        return;
      }
      localStorage.setItem("user", JSON.stringify(result.data.user));
      localStorage.setItem("stored", JSON.stringify(result.data.stored));
      set({
        userData: result.data,
      });
      get().refreshUserFiles(); // ✅ Load files immediately
    });

    return data.subscription.unsubscribe;
  },

  signIn: async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(email, password);
    if (result) {
      const stored = await getUserById(result.user.id);
      if (!stored) {
        console.warn("User ID not found in database");
        return false;
      }
      set({
        userData: {
          user: result.user,
          stored: stored,
        },
      });
      get().refreshUserFiles();
      return true;
    }
    return false;
  },

  refreshUserFiles: async () => {
    const user_id = get().userData?.user.id;
    console.log("REFRESH");
    if (!user_id) {
      set({ files: [] });
      localStorage.setItem("files", JSON.stringify([]));
    } else {
      console.log("GOOD");
      const result = await getAllCADFilesForUser(user_id);
      set({ files: result });
      localStorage.setItem("files", JSON.stringify(result)); // ✅ Save to localStorage
    }
  },

  refreshUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error fetching user:", error.message);
      return;
    }
    const id = data.user?.id;
    if (!id) {
      console.warn("No user ID found");
      return;
    }
    const stored = await getUserById(id);
    if (!stored) {
      console.warn("User ID not found in database");
      return;
    }
    localStorage.setItem("user", JSON.stringify({ user: data.user }));
    localStorage.setItem("stored", JSON.stringify(stored));
    set({
      userData: {
        user: data.user,
        stored: stored,
      },
    });
    get().refreshUserFiles(); // ✅ Refresh files after restoring user
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign-out error:", error.message);
      return;
    }
    localStorage.removeItem("user");
    localStorage.removeItem("stored");
    localStorage.removeItem("files");
    set({
      userData: undefined,
      files: [],
    });
  },

  removeFile: async (path: string) => {
    try {
      const { error } = await supabase
        .storage
        .from("cadfiles")
        .remove([path]);

      if (error) {
        console.error("Error deleting file:", error.message);
        return;
      }

      set((state) => {
        const updatedFiles = state.files.filter((file) => file.path !== path);
        localStorage.setItem("files", JSON.stringify(updatedFiles)); // ✅ Persist deletion
        return { files: updatedFiles };
      });

      console.log(`File deleted: ${path}`);
    } catch (err) {
      console.error("Unexpected error deleting file:", err);
    }
  },
}));

async function initializeUser(): Promise<Result<UserData, unknown>> {
  const user = await supabase.auth.getUser();
  if (user.error) {
    return failureResult(user.error);
  }
  return successResult({
    user: user.data.user,
    stored: {
      email: user.data.user.email || "",
      profile_image: "",
      user_id: user.data.user.id,
      username: user.data.user.email?.split("@")[0] || "unknown",
      activeRole: null,
      name: null,
    },
  });
}
