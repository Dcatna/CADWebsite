import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "./ui/button"
import { SignOut, uploadMedia } from "@/data/supabaseclient"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { useUserStore } from "@/data/userstore"

const Navbar = () => {
    const navigator = useNavigate()
    const location = useLocation()
    console.log(location.pathname, "PATHS")
    return (
      location.pathname === "/home" ? (
        <nav>
          <div className="w-screen flex justify-center items-center space-x-4">
            <Button asChild variant="ghost">
              <Link to="/home">Home</Link>
            </Button>
    
            <UploadPopup />
            <Button
              onClick={async () => {
                await SignOut();
                navigator("/");
              }}
              asChild
              variant="ghost"
            >
              <p>Signout</p>
            </Button>
          </div>
        </nav>
      ) : location.pathname === "/" && (
        <nav>
          <div className="w-screen flex justify-center items-center space-x-4">
            <Button asChild variant="ghost">
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/signup">Sign Up</Link>
            </Button>

          </div>
        </nav>
      )
    );

}

const UploadPopup = () => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>("")

  const userId = useUserStore((s) => s.userData?.user.id)
  const refreshListsFunction = useUserStore((state) => state.refreshUserFiles)

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !userId) {
      alert("make sure to selct a file and be logged in")
      return
    }

    const formData = new FormData();
    formData.append("file", file); // original CAD file
    formData.append("fileName", fileName);
    formData.append("userId", userId);

    const response = await fetch("http://localhost:3001/convert", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      const fbxFile = new File([blob], `${fileName}.fbx`, {
        type: "application/octet-stream",
      })

      const publicUrl = await uploadMedia(fbxFile, userId, fileName)
      if (publicUrl) {
        console.log("uploaded file:", publicUrl)
        alert("upload successful")
        setOpen(false)
        await refreshListsFunction()
      }else {
        alert("upload failed")
      }


    } else {
      alert("upload failed")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">Upload Media</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg p-6 rounded-xl bg-card shadow-xl border border-muted">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center text-foreground">
            Upload a Photo or Video
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="mt-4 space-y-6">
          <div>
            <input 
              type="text" 
              placeholder="Enter File/Project Name" 
              className="mb-2 rounded-sm border-2"
              onChange={(e) => setFileName(e.target.value)}/>

            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Select File
            </label>
            <input
              type="file"
              accept=".stl,.step,.obj,.ply,.dae,.fbx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-primary file:text-white
                         hover:file:bg-primary/90"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="px-6">
              Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default Navbar