import { useEffect, useState } from "react";
import { useUserStore } from "@/data/userstore";
import type { FileType } from "@/data/types";
import { getAllCADFilesForUser } from "@/data/supabaseclient";


const Home = () => {
  // const user_id = useUserStore((s) => s.userData?.user.id)
  const files = useUserStore((s) => s.files)
  console.log(files)

  return (
    <>
    {files.length > 0 ? files.map((file : FileType) => (
      <div>{file.name}</div>
    )) : <div></div>}
    </>
  );
};

export default Home;
