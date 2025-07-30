import './App.css'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import { useUserStore } from './data/userstore'
import { useEffect } from 'react'

function App() {
  const init = useUserStore((s) => s.init)
  useEffect(() => {
    const unsubscribe = init()
    return () => unsubscribe()
  }, [init])

  return (
    <div className='overflow-x-hidden'>
      <Navbar/>
      

      <Outlet />
    </div>
  )
}

export default App
