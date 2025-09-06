import { MessageSquare, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@avenire/ui/components/card"
import { Button } from "@avenire/ui/components/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@avenire/ui/components/tooltip"
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns"
import { cn } from "@avenire/ui/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { log, captureException } from "@avenire/logger/client"

function formatDate(date: Date) {
  const inputDate = new Date(date)

  if (isToday(inputDate)) {
    return `Today at ${format(inputDate, "h:mm a")}`
  }
  if (isYesterday(inputDate)) {
    return `Yesterday at ${format(inputDate, "h:mm a")}`
  }

  const daysAgo = formatDistanceToNow(inputDate, { addSuffix: false })

  if (daysAgo.includes("days") && Number.parseInt(daysAgo) < 7) {
    return `Last ${format(inputDate, "EEEE")} at ${format(inputDate, "h:mm a")}`
  }

  return format(inputDate, "do MMMM yyyy")
}

interface ChatHistoryItemProps {
  chat: {
    id: string;
    createdAt: Date;
    title: string;
    userId: string;
    visibility: "public" | "private";
  }
}

export function ChatHistoryItem({ chat }: ChatHistoryItemProps) {
  const router = useRouter();

  const handleDeleteChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/chat?id=${chat.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the page to update the chat list
        router.refresh();
      }
    } catch (error) {
      log.error('Failed to delete chat:', { error });
      captureException(error);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative w-full">
            <Link href={`/chat/${chat.id}`}>
              <Card className="border hover:bg-foreground/10 transition-colors cursor-pointer w-full h-full">
                <CardHeader className="flex flex-row items-center gap-2 p-3 pb-0 space-y-0">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="font-medium line-clamp-1 min-w-0">{chat.title}</div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">{formatDate(chat.createdAt)}</p>
                </CardContent>
              </Card>
            </Link>

            {/* Delete button - appears on hover for this specific item only */}
            <div
              className={cn(
                "absolute right-2 top-2 transition-all duration-200 ease-in-out",
                "opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto",
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleDeleteChat}
              >
                <Trash2 className="w-3 h-3" />
                <span className="sr-only">Delete chat</span>
              </Button>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{chat.title}</p>
          <p className="text-xs text-muted-foreground">{formatDate(chat.createdAt)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

