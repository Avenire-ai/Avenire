"use client"

import { useState, useMemo } from "react"
import { useUserStore } from "../../../stores/userStore"
import { getLibraryItemsAction } from "../../../actions/actions"
import { Card, CardContent } from "@avenire/ui/components/card"
import { Button } from "@avenire/ui/components/button"
import { Badge } from "@avenire/ui/components/badge"
import { Input } from "@avenire/ui/components/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@avenire/ui/components/select"
import { BookOpen, RotateCcw, HelpCircle, Calendar, TrendingUp, Filter, Search } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"
import { getFSRSStateLabel, getStabilityDescription, getEloInfo, formatInterval } from "../../../lib/spaced-repetition-utils"

export default function LibraryPage() {
  const { user } = useUserStore()
  const [filters, setFilters] = useState({
    type: "all" as "flashcard" | "quiz" | "all",
    topic: "",
    difficulty: undefined as "beginner" | "intermediate" | "advanced" | undefined,
    dueDate: "all" as "due" | "not_due" | "all",
    searchQuery: "",
  })
  const [sort, setSort] = useState<{
    field: "createdAt" | "dueDate" | "eloRating" | "lastStudied" | "masteryLevel"
    order: "asc" | "desc"
  }>({
    field: "createdAt",
    order: "desc",
  })
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data, isLoading, mutate } = useSWR(
    user?.id ? ['library', filters, sort, page] : null,
    async () => {
      if (!user?.id) return { flashcards: [], quizzes: [], total: 0 }
      return await getLibraryItemsAction({ filters, sort, page, pageSize })
    },
    {
      refreshInterval: 0,
      revalidateOnFocus: true,
    }
  )

  const items = useMemo(() => {
    const flashcards = (data?.flashcards || []).map((fp: any) => ({
      type: "flashcard" as const,
      id: fp.flashcardId,
      cardIndex: fp.cardIndex,
      progress: fp,
    }))
    const quizzes = (data?.quizzes || []).map((qp: any) => ({
      type: "quiz" as const,
      id: qp.quizId,
      questionIndex: qp.questionIndex,
      progress: qp,
    }))
    return [...flashcards, ...quizzes]
  }, [data])

  const stats = useMemo(() => {
    const total = items.length
    const mastered = items.filter((item: any) => item.progress?.masteryLevel >= 0.8).length
    const due = items.filter((item: any) => {
      if (!item.progress?.dueDate) return false
      return new Date(item.progress.dueDate) <= new Date()
    }).length
    return { total, mastered, due }
  }, [items])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to view your library</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Library</h1>
            <p className="text-muted-foreground">Manage your flashcards and quizzes</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mastered</p>
                    <p className="text-2xl font-bold">{stats.mastered}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Due for Review</p>
                    <p className="text-2xl font-bold">{stats.due}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Sort */}
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filters.type}
                    onValueChange={(value: any) => setFilters({ ...filters, type: value })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="flashcard">Flashcards</SelectItem>
                      <SelectItem value="quiz">Quizzes</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.difficulty || "all"}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        difficulty: value === "all" ? undefined : (value as any),
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sort.field}
                    onValueChange={(value: any) =>
                      setSort({ ...sort, field: value })
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Created Date</SelectItem>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="eloRating">ELO Rating</SelectItem>
                      <SelectItem value="lastStudied">Last Studied</SelectItem>
                      <SelectItem value="masteryLevel">Mastery</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sort.order}
                    onValueChange={(value: any) =>
                      setSort({ ...sort, order: value })
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Desc</SelectItem>
                      <SelectItem value="asc">Asc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Grid */}
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-32 animate-pulse bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No items found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create flashcards or quizzes to see them here
                </p>
                <Button variant="outline" asChild>
                  <Link href="/chat">Start Creating</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item: any) => (
                <Card key={`${item.type}-${item.id}-${item.cardIndex || item.questionIndex}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {item.type === "flashcard" ? (
                          <RotateCcw className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <HelpCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <Badge variant="secondary">
                          {item.type === "flashcard" ? "Flashcard" : "Quiz"}
                        </Badge>
                      </div>
                      {item.progress?.dueDate && new Date(item.progress.dueDate) <= new Date() && (
                        <Badge variant="outline" className="text-xs">
                          Due
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      {item.progress?.masteryLevel !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Mastery</span>
                          <span className="font-medium">
                            {Math.round(item.progress.masteryLevel * 100)}%
                          </span>
                        </div>
                      )}
                      {item.progress?.eloRating && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">ELO</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{Math.round(item.progress.eloRating)}</span>
                            {(() => {
                              const eloInfo = getEloInfo(item.progress.eloRating)
                              return (
                                <Badge variant="outline" className="text-xs">
                                  {eloInfo.level}
                                </Badge>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                      {item.progress?.fsrsState && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">FSRS State</span>
                            <Badge variant="outline" className="text-xs">
                              {getFSRSStateLabel(item.progress.fsrsState.state)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Stability</span>
                            <span className="font-medium text-xs">
                              {item.progress.fsrsState.stability.toFixed(1)}d
                            </span>
                          </div>
                        </>
                      )}
                      {item.progress?.interval && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Next Review</span>
                          <span className="font-medium text-xs">
                            {formatInterval(item.progress.interval)}
                          </span>
                        </div>
                      )}
                      {item.progress?.lastStudied && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Studied</span>
                          <span className="font-medium text-xs">
                            {new Date(item.progress.lastStudied).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <Link href={`/study?type=${item.type}&id=${item.id}&index=${item.cardIndex || item.questionIndex}`}>
                          Study
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.total > pageSize && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(data.total / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(data.total / pageSize)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}






