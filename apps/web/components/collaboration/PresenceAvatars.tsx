'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { User } from 'lucide-react'

interface PresenceUser {
  id: string
  name: string
  email: string
  avatar?: string
  color: string
  cursor?: { x: number; y: number }
  lastSeen: number
}

interface PresenceAvatarsProps {
  contractId: string
  currentUser: {
    id: string
    email: string
    name?: string
    avatar?: string
  } | null
  maxVisible?: number
  className?: string
  showCursors?: boolean
}

// Generate a random color for the user
const generateUserColor = (userId: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#FFD93D', '#6BCB77', '#4D96FF'
  ]
  const index = userId.charCodeAt(0) % colors.length
  return colors[index] || '#4D96FF'
}

// Get initials from name or email
const getInitials = (name?: string, email?: string) => {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email?.charAt(0).toUpperCase() || 'U'
}

export default function PresenceAvatars({
  contractId,
  currentUser,
  maxVisible = 5,
  className,
  showCursors = false
}: PresenceAvatarsProps) {
  const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null)
  const [, setPresenceState] = useState<RealtimePresenceState<PresenceUser>>({})
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])

  useEffect(() => {
    if (!currentUser) return

    // Create presence channel
    const channel = supabase.channel(`presence:contract:${contractId}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    })

    // Set up presence sync
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>()
        setPresenceState(state)
        
        // Extract unique users from presence state
        const users = Object.values(state)
          .flat()
          .filter(user => user.id !== currentUser.id)
          .filter((user, index, self) => 
            index === self.findIndex(u => u.id === user.id)
          )
        
        setOnlineUsers(users)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const userPresence: PresenceUser = {
          id: currentUser.id,
          name: currentUser.name || 'Anonymous',
          email: currentUser.email,
          avatar: currentUser.avatar || '',
          color: generateUserColor(currentUser.id || 'anonymous'),
          lastSeen: Date.now()
        }
        
        await channel.track(userPresence)
      }
    })

    setPresenceChannel(channel)

    // Update cursor position if enabled
    if (showCursors) {
      const handleMouseMove = async (e: MouseEvent) => {
        if (channel && channel.state === 'joined') {
          await channel.track({
            cursor: { x: e.clientX, y: e.clientY }
          })
        }
      }

      window.addEventListener('mousemove', handleMouseMove)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        channel.unsubscribe()
      }
    }

    return () => {
      channel.unsubscribe()
    }
  }, [contractId, currentUser, showCursors])

  // Update heartbeat every 30 seconds
  useEffect(() => {
    if (!presenceChannel || !currentUser) return

    const interval = setInterval(async () => {
      if (presenceChannel.state === 'joined') {
        await presenceChannel.track({ lastSeen: Date.now() })
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [presenceChannel, currentUser])

  const visibleUsers = onlineUsers.slice(0, maxVisible)
  const hiddenCount = Math.max(0, onlineUsers.length - maxVisible)

  return (
    <TooltipProvider>
      <div className={cn("flex items-center -space-x-2", className)}>
        {/* Current user indicator */}
        {currentUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name || currentUser.email} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(currentUser.name, currentUser.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">You</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Other online users */}
        {visibleUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar 
                  className="h-8 w-8 border-2 border-background"
                  style={{ borderColor: user.color }}
                >
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: user.color + '20', color: user.color }}
                  >
                    {getInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <span 
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background"
                  style={{ backgroundColor: user.color }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                Active {getRelativeTime(user.lastSeen)}
              </p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Hidden users count */}
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-background bg-muted">
                  <AvatarFallback className="text-xs">
                    +{hiddenCount}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{hiddenCount} more {hiddenCount === 1 ? 'person' : 'people'} online</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Online count */}
        <div className="ml-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span>{onlineUsers.length + 1} online</span>
        </div>
      </div>

      {/* Cursor tracking (if enabled) */}
      {showCursors && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {onlineUsers.map((user) => 
            user.cursor ? (
              <div
                key={user.id}
                className="absolute transition-all duration-100"
                style={{
                  left: user.cursor.x,
                  top: user.cursor.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div 
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white shadow-lg"
                  style={{ backgroundColor: user.color }}
                >
                  <User className="h-3 w-3" />
                  {user.name}
                </div>
                <svg
                  className="absolute -top-1 -left-1"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M0.5 0.5L5.5 14.5L7.5 7.5L14.5 5.5L0.5 0.5Z"
                    fill={user.color}
                    stroke="white"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : null
          )}
        </div>
      )}
    </TooltipProvider>
  )
}

// Helper function to get relative time
function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (seconds > 30) return `${seconds} seconds ago`
  return 'just now'
}
