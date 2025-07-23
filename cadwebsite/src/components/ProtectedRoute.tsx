
import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../data/userstore";



const ProtectedRoute = ({children} : {children : ReactNode}) => {
    const userData = useUserStore((state) => state.userData);
    const navigator = useNavigate()

    console.log(userData, "PROTECTED")

  useEffect(() => {
    if (userData === undefined ) {
      navigator("/signin");
    }
  }, [userData, navigator]);

  if (userData === undefined) {
    return <div className="text-white text-center p-10">Loading...</div>;
  }

  return (
    <>{children}</>
  )
}

export default ProtectedRoute