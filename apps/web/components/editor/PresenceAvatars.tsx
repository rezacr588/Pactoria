'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'

interface PresenceState {
  user_id: string
  name: string
  email: string
  color: string
  online_at: string
}

interface PresenceAvatarsProps {
  contractId: string
  className?: string
  maxVisible?: number
}

const AVATAR_COLORS = [
  'bg-red-500',
  'bg-blue-500', 
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500'
]

function getAvatarColor(userId: string): string {
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[index % AVATAR_COLORS.length] || '#4D96FF'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function PresenceAvatars({
  contractId,
  className = '',
  maxVisible = 5
}: PresenceAvatarsProps) {
  const { user } = useAuth()
  const [presences, setPresences] = useState<Record<string, PresenceState>>({})

  useEffect(() => {
    if (!user || !contractId) return

    const channelName = `presence:contract:${contractId}`
    
    const presenceChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    })

    // Join the channel and set initial presence
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const formattedPresences: Record<string, PresenceState> = {}
        
        Object.entries(state).forEach(([userId, presences]) => {
          const presence = presences[0] as unknown as PresenceState
          if (presence) {
            formattedPresences[userId] = presence
          }
        })
        
        setPresences(formattedPresences)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setPresences(prev => ({
          ...prev,
          [key]: newPresences[0] as unknown as PresenceState
        }))
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setPresences(prev => {
          const updated = { ...prev }
          delete updated[key]
          return updated
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Set user's presence when successfully subscribed
          await presenceChannel.track({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
            email: user.email || '',
            color: getAvatarColor(user.id),
            online_at: new Date().toISOString(),
          })
        }
      })


    // Cleanup on unmount
    return () => {
      if (presenceChannel) {
        presenceChannel.untrack()
        presenceChannel.unsubscribe()
      }
    }
  }, [user, contractId])

  // Filter out current user and convert to array
  const otherUsers = Object.values(presences).filter(
    presence => presence.user_id !== user?.id
  )

  const visibleUsers = otherUsers.slice(0, maxVisible)
  const hiddenCount = Math.max(0, otherUsers.length - maxVisible)

  if (otherUsers.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <TooltipProvider>
        {/* Visible user avatars */}
        <div className="flex -space-x-2">
          {visibleUsers.map((presence) => (
            <Tooltip key={presence.user_id}>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8 border-2 border-white cursor-pointer hover:scale-105 transition-transform">
                  <AvatarFallback 
                    className={`text-white text-xs font-medium ${getAvatarColor(presence.user_id)}`}
                  >
                    {getInitials(presence.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-center">
                  <p className="font-medium">{presence.name}</p>
                  <p className="text-xs text-muted-foreground">{presence.email}</p>
                  <div className="flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                    <span className="text-xs">Online</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Overflow indicator */}
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="secondary" 
                className="h-8 w-8 p-0 rounded-full flex items-center justify-center text-xs cursor-pointer"
              >
                +{hiddenCount}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div>
                <p className="font-medium mb-1">{hiddenCount} more user{hiddenCount > 1 ? 's' : ''} online</p>
                {otherUsers.slice(maxVisible).map((presence) => (
                  <p key={presence.user_id} className="text-xs text-muted-foreground">
                    {presence.name}
                  </p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Online indicator */}
        <div className="flex items-center space-x-1 ml-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-muted-foreground">
            {otherUsers.length} online
          </span>
        </div>
      </TooltipProvider>
    </div>
  )
}