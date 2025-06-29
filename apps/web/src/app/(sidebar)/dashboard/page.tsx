"use client"

import { Suspense } from "react"
import { CourseCard, CourseCardSkeleton } from "../../../components/dashboard/course-card"
import { Button } from "@avenire/ui/components/button"
import { ChatHistoryItem } from "../../../components/dashboard/chat-item"
import { PlusCircle, ChevronRight } from "lucide-react"
import useSWR from "swr"
import { getRecentChats } from "../../../actions/actions" // Adjust path as needed
import { useUserStore } from "../../../stores/userStore"

// Sample data for courses
const courses = [
  {
    id: 1,
    title: "The Twin Paradox: Time Travel in Relativity",
    description: "Unravel the mind-bending consequences of Einstein’s theory as we explore how time can tick differently for twins traveling at near-light speed.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30), // 30 hours ago
    thumbnail: "/Twin.PNG?height=200&width=400",
    lessonCount: 6,
  },
  {
    id: 2,
    title: "Lagrangian Mechanics: The Art of Motion",
    description: "Discover the elegant framework that revolutionized physics, making sense of motion from planets to pendulums with the power of calculus.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
    thumbnail: "/Lagrangian.PNG?height=200&width=400",
    lessonCount: 8,
  },
  {
    id: 3,
    title: "Zeno’s Paradox: Infinite Steps, Finite Journeys",
    description: "Dive into the ancient puzzles that challenge our understanding of motion, infinity, and the very fabric of reality.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36), // 36 hours ago
    thumbnail: "/Zeno.PNG?height=200&width=400",
    lessonCount: 10,
  },
  {
    id: 4,
    title: "Noether’s Theorem: Symmetry Unleashed",
    description: "Explore how Emmy Noether’s groundbreaking insight connects the beauty of symmetry to the fundamental laws that govern our universe.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    thumbnail: "/Noether.PNG?height=200&width=400",
    lessonCount: 12,
  },
  {
    id: 5,
    title: "The Principle of Least Action: Nature’s Shortcut",
    description: "Learn how the universe chooses the most efficient path, revealing the hidden simplicity behind complex physical phenomena.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 24 hours ago
    thumbnail: "/PSA.PNG?height=200&width=400",
    lessonCount: 15,
  },
]
export default function LibraryPage() {

  // Sample data for recent chats
  const { user } = useUserStore()
  const { data: recentChatsData } = useSWR(
    user?.id ? '/api/history' : null,
    async () => {
      if (!user?.id) return { chats: [] }
      const { chats } = await getRecentChats(user.id)
      return { chats }
    },
    {
      refreshInterval: 0, // Disable automatic polling
      revalidateOnFocus: true, // Revalidate when window gains focus
      revalidateOnReconnect: true, // Revalidate when browser regains connection
    }
  )

  const recentChats = recentChatsData?.chats || []

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">My Library</h1>
          <Button variant="outline" size="sm" className="gap-1 rounded-full self-start sm:self-auto">
            <PlusCircle className="h-4 w-4" />
            <span>Create a course</span>
          </Button>
        </div>
      </div>

      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h2 className="text-xl font-semibold">Recent Chats</h2>
        </div>
        <Suspense
          fallback={
            <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-xl" />
              ))}
            </div>
          }
        >
          <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {recentChats.map((chat) => (
              <ChatHistoryItem key={chat.id} chat={chat} />
            ))}
          </div>
        </Suspense>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h2 className="text-xl font-semibold">All Courses</h2>
          <Button variant="link" size="sm" className="gap-1 self-start sm:self-auto">
            <span>See all</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <Suspense
            fallback={
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} onQuit={(id) => console.log("Quit course:", id)} />
              ))}
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

