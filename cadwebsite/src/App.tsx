import './App.css'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import { useUserStore } from './data/userstore'

function App() {
  const groupId = useUserStore((state) => state.userData?.user.id)

  return (
    <div className='overflow-x-hidden'>
      {groupId ? <Navbar/> : <div/>}
      

      <Outlet />
    </div>
  )
}

export default App
