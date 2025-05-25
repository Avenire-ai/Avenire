"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { cn } from "@avenire/ui/utils"
import { Button } from "@avenire/ui/components/button"
import { Card, CardContent } from "@avenire/ui/components/card"
import { Input } from "@avenire/ui/components/input"
import { Label } from "@avenire/ui/components/label"
import { signUp, signIn, sendVerificationEmail } from "../client"
import { Mail, User, Lock, ArrowRight, Sparkles, MailIcon, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod";
import { GithubIcon, GoogleIcon, LoadingIcon } from "./icons"
import { getErrorMessage } from "../error_codes"


const registerSchema = z.object({
  email: z.string().email("Invalid email address").nonempty("Email is required"),
  username: z.string()
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username must be at most 20 characters long")
    .regex(/^(?!.*\.\.)(?!.*\.$)[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores, and periods, and cannot end with a period")
    .nonempty("Username is required"),
  displayname: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters long").nonempty("Password is required"),
  confirmPassword: z.string().nonempty("Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});


export function RegisterForm({ className, ...props }: React.ComponentProps<"div">) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [displayname, setDisplayName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{
    email: string | undefined;
    username: string | undefined;
    password: string | undefined;
    confirmPassword: string | undefined;
    displayname?: string | undefined;
  } | undefined>(undefined)

  const handleSubmit = async () => {
    setIsLoading(true)
    setErrors(undefined) // Reset errors

    const formData = {
      email,
      username,
      displayname,
      password,
      confirmPassword,
    }

    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      const formattedErrors = result.error.format();
      setErrors({
        email: formattedErrors.email?._errors.join(", "),
        username: formattedErrors.username?._errors.join(", "),
        password: formattedErrors.password?._errors.join(", "),
        confirmPassword: formattedErrors.confirmPassword?._errors.join(", "),
        displayname: formattedErrors.displayname?._errors.join(", ")
      });
      setIsLoading(false)
      return
    }

    const { data, error } = await signUp.email({
      email: email,
      name: displayname,
      password: password,
      username: username
    })
    if (error) {
      const errorMessage = getErrorMessage(error.code || "");
      if (errorMessage.source === "email") {
        setErrors({ email: errorMessage.userMessage, username: undefined, password: undefined, confirmPassword: undefined });
      } else if (errorMessage.source === "username") {
        setErrors({ email: undefined, username: errorMessage.userMessage, password: undefined, confirmPassword: undefined });
      }
      toast.error("Oops! Something went wrong", {
        description: errorMessage.userMessage,
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsSubmitted(true);
  }

  return (
    <>
      {!isSubmitted ? (
        <form className="p-5 md:p-6" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Create an account</h1>
              <p className="text-balance text-muted-foreground">Sign up to get started with Avenire</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    aria-describedby="email-description"
                    className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors?.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <span id="email-description" className="sr-only">
                  Enter your email address. We'll send a verification link to this email.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      required
                      aria-describedby="username-description"
                      className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    {errors?.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                  </div>
                  <span id="username-description" className="sr-only">
                    Choose a unique username that will identify you on the platform.
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="John Doe"
                    required
                    aria-describedby="displayname-description"
                    className="transition-all focus:ring-2 focus:ring-primary/20"
                    value={displayname}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  {errors?.displayname && <p className="text-red-500 text-xs mt-1">{errors.displayname}</p>}
                  <span id="displayname-description" className="sr-only">
                    Enter your display name. This is how other users will see you.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      required
                      aria-describedby="password-description"
                      className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {errors?.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      aria-describedby="confirm-password-description"
                      className="pl-10 transition-all focus:ring-2 focus:ring-primary/20"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {errors?.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                  <span id="confirm-password-description" className="sr-only">
                    Re-enter your password to confirm it.
                  </span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full group transition-all" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <LoadingIcon />
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>

            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full transition-all"
                type="button"
                onClick={() => {
                  signIn.social({
                    provider: "google",
                    callbackURL: "/dashboard"
                  })
                }}
              >
                <GoogleIcon />
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full transition-all"
                type="button"
                onClick={() => {
                  signIn.social({
                    provider: "github",
                    callbackURL: "/dashboard"
                  })
                }}
              >
                <GithubIcon />
                GitHub
              </Button>
            </div>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Login
              </Link>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 md:p-8 h-full slide-up">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="rounded-full bg-primary/10 p-3">
              <MailIcon className="text-primary h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold">Verify your email</h2>
            <p className="text-muted-foreground">
              We've sent a verification link to{" "}
              <span className="font-medium text-foreground">{email || "your email address"}</span>. Please check
              your inbox and click the link to complete your registration.
            </p>
            <div className="mt-2 w-full max-w-xs rounded-lg bg-muted p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-3 w-3 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-muted-foreground">
                    Don't see the email? Check your spam folder or try again in a few minutes.
                  </p>
                </div>
              </div>
            </div>
            <Button className="mt-4 transition-all hover:bg-primary/90 group" onClick={() => {
              sendVerificationEmail({
                email
              })
            }}>
              <div className="flex items-center">
                Resend verification email
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

