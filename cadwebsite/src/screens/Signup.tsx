import { GetSignedInUserAndRole, supabase } from '@/data/supabaseclient'
import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import * as yup from 'yup'
import type { IFormInput } from './Signin'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const Signup = () => {
  const navigator = useNavigate()

  useEffect(() => {
    async function checkUser() {
      const signedIn = await GetSignedInUserAndRole()
      if (signedIn) {
        navigator("/home")
      }
    }
    checkUser()
  }, [navigator])

  const schema = yup.object().shape({
    email: yup.string().email().required(),
    password: yup.string().min(6).max(15).required()
  })

  const [isJiggling, setIsJiggling] = useState(false);
  const handleButtonClick = () => {
    setIsJiggling(true);
    setTimeout(() => setIsJiggling(false), 500);
  };

  const { register, handleSubmit, formState: { errors } } = useForm<IFormInput>({
    resolver: yupResolver(schema),
  });

  function showAlertAfterAnimation(message: string) {
    setTimeout(() => {
      alert(message);
    }, 100);
  }

  async function submitForm(formData: IFormInput) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (data) {
        navigator("/signin")
      }
    } catch (error) {
      handleButtonClick()
      if (error instanceof Error) {
        showAlertAfterAnimation(error.message)
      } else {
        console.error("An unknown error occurred", error);
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">

      {/* Glowing Background Orb */}
      <div className="absolute w-[900px] h-[900px] bg-green-500/15 rounded-full blur-[200px] animate-pulse" />

      {/* Holographic Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none 
        bg-[linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] 
        bg-[size:50px_50px]" />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-green-300/50 rounded-full blur-[1px] animate-floatParticle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`
          }}
        />
      ))}

      {/* Signup Card */}
      <Card className="w-full max-w-md p-6 relative z-10 rounded-xl border border-green-400/30 bg-black/70 backdrop-blur-md shadow-[0_0_25px_rgba(34,197,94,0.25)]">

        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)] mb-2">
            Sign Up
          </h1>
          <p className="text-gray-300 mb-4">Please enter your email and password</p>
        </div>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Email"
              className="flex h-10 w-full rounded-md border border-green-400/30 bg-black/40 px-3 py-1 text-base shadow-sm text-white placeholder:text-green-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              {...register("email")}
            />
            <p className="text-red-500 text-sm mt-1">{errors.email?.message}</p>
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className="flex h-10 w-full rounded-md border border-green-400/30 bg-black/40 px-3 py-1 text-base shadow-sm text-white placeholder:text-green-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
              {...register("password")}
            />
            <p className="text-red-500 text-sm mt-1">{errors.password?.message}</p>
          </div>

          <Button
            onClick={errors.password || errors.email ? handleButtonClick : () => { }}
            className={`w-full py-2 rounded-md transition-all duration-300 ${isJiggling ? "animate-shake" : ""} 
              bg-green-500 hover:bg-green-600 text-black font-semibold shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:scale-105`}
            type="submit"
          >
            Create Account
          </Button>
        </form>

        <div className="text-center mt-6 text-green-300">
          <p className="mb-1">Already have an account?</p>
          <Link to="/signin" className="hover:underline font-medium">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default Signup
