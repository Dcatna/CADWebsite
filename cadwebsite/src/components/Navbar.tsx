import { Link, useLocation, useNavigate } from "react-router-dom";
import { SignOut } from "@/data/supabaseclient";
import { useState } from "react";
import { useUserStore } from "@/data/userstore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { uploadMedia } from "@/data/supabaseclient";
import { Button } from "./ui/button";

const Navbar = () => {
  const navigator = useNavigate();
  const location = useLocation();

  const navItemStyle = (path: string) =>
    `px-3 py-2 rounded-md transition-all duration-200 ${
      location.pathname === path
        ? "text-green-400 font-semibold border-b-2 border-green-400"
        : "text-gray-300 hover:text-green-300"
    }`;

  return (
    <nav className="bg-black border-b border-green-500 px-6 py-4">
      <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
        {/* Brand */}
        <h1 className="text-green-400 text-2xl font-bold tracking-wide">HoloDraft</h1>

        {/* Conditional Nav */}
        {location.pathname === "/home" ? (
          <div className="flex gap-4 items-center">
            <Link to="/home" className={navItemStyle("/home")}>Home</Link>
            <UploadPopup />
            <button
              onClick={async () => {
                await SignOut();
                navigator("/");
              }}
              className="text-gray-300 hover:text-red-400 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        ) : location.pathname === "/" ? (
          <div className="flex gap-4">
            <Link to="/signin" className={navItemStyle("/signin")}>Sign In</Link>
            <Link to="/signup" className={navItemStyle("/signup")}>Sign Up</Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
};

export const UploadPopup = () => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const userId = useUserStore((s) => s.userData?.user.id);
  const refreshListsFunction = useUserStore((state) => state.refreshUserFiles);

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !userId) {
      alert("Make sure to select a file and be logged in");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", fileName);
    formData.append("userId", userId);

    const response = await fetch("http://localhost:3001/convert", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      const glbFile = new File([blob], `${fileName}.glb`, {
        type: "application/octet-stream",
      });

      const publicUrl = await uploadMedia(glbFile, userId, fileName);
      if (publicUrl) {
        alert("Upload successful");
        setOpen(false);
        await refreshListsFunction();
      } else {
        alert("Upload failed");
      }
    } else {
      alert("Upload failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="px-3 py-2 text-gray-300 hover:text-green-300 transition-all duration-200">
          Upload CAD File
        </button>
      </DialogTrigger>
<DialogContent className="max-w-lg p-6 rounded-2xl bg-black/90 backdrop-blur-md shadow-[0_0_25px_rgba(34,197,94,0.3)] border border-green-400/40">
  <DialogHeader>
    <DialogTitle className="text-2xl font-bold text-green-400 text-center tracking-wide drop-shadow-[0_0_5px_rgba(34,197,94,0.6)]">
      Upload a CAD File
    </DialogTitle>
  </DialogHeader>

  <form onSubmit={handleFormSubmit} className="mt-6 space-y-6">
    {/* Project Name Input */}
    <input
      type="text"
      placeholder="Enter File/Project Name"
      className="w-full rounded-lg border border-green-400/40 bg-black/80 text-white px-4 py-2
                 focus:outline-none focus:ring-2 focus:ring-green-400/60 focus:border-green-400/60
                 placeholder-gray-500"
      onChange={(e) => setFileName(e.target.value)}
    />

    {/* File Upload */}
    <div>
      <label className="block text-sm font-medium text-green-300 mb-2">
        Select File
      </label>
      <input
        type="file"
        accept=".stl,.step,.obj,.ply,.dae,.fbx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:bg-green-500 file:text-black
                   hover:file:bg-green-400 cursor-pointer"
      />
    </div>

    {/* Submit Button */}
    <div className="flex justify-end">
      <Button
        type="submit"
        className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg
                   shadow-[0_0_10px_rgba(34,197,94,0.4)] hover:shadow-[0_0_15px_rgba(34,197,94,0.6)]
                   transition-all duration-200"
      >
        Upload
      </Button>
    </div>
  </form>
</DialogContent>
    </Dialog>
  );
};

export default Navbar;
