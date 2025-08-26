'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'

interface ConnectedUser {
  id: string
  name: string
  email: string
  color: string
  isTyping: boolean
}

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
]

function getUserColor(userId: string): string {
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return USER_COLORS[index % USER_COLORS.length] || '#4D96FF'
}

export function useContractCollaboration(contractId: string) {
  const { user } = useAuth()
  const [ydoc] = useState(() => new Y.Doc())
  const [provider, setProvider] = useState<WebrtcProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  const providerRef = useRef<WebrtcProvider | null>(null)

  // Update connected users
  const updateConnectedUsers = useCallback(() => {
    if (!provider || !user) return

    const awarenessUsers: ConnectedUser[] = Array.from(provider.awareness.getStates().values())
      .filter((state: any) => state.user && state.user.id !== user.id)
      .map((state: any) => ({
        id: state.user.id,
        name: state.user.name,
        email: state.user.email,
        color: state.user.color,
        isTyping: state.isTyping || false
      }))
    
    setConnectedUsers(awarenessUsers)
  }, [provider, user])

  // Initialize collaboration
  useEffect(() => {
    if (!user || !contractId) return

    const initializeCollaboration = async (): Promise<(() => void) | undefined> => {
      try {
        const roomName = `contract:${contractId}`
        const webrtcProvider = new WebrtcProvider(roomName, ydoc, {
          signaling: ['wss://signaling.yjs.dev'],
          maxConns: 20,
          filterBcConns: true,
          password: contractId
        })

        providerRef.current = webrtcProvider
        setProvider(webrtcProvider)

        webrtcProvider.on('status', ({ connected }: { connected: boolean }) => {
          setIsConnected(connected)
        })

        webrtcProvider.on('peers', () => {
          updateConnectedUsers()
        })

        // Initialize Supabase Realtime for presence
        const presenceChannel = supabase.channel(`presence:contract:${contractId}`, {
          config: { presence: { key: user.id } }
        })

        presenceChannel
          .on('presence', { event: 'sync' }, () => updateConnectedUsers())
          .on('presence', { event: 'join' }, () => updateConnectedUsers())
          .on('presence', { event: 'leave' }, () => updateConnectedUsers())
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await presenceChannel.track({
                user_id: user.id,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
                email: user.email || '',
                color: getUserColor(user.id),
                online_at: new Date().toISOString(),
                contract_id: contractId,
                is_editing: true
              })
            }
          })

        return () => {
          presenceChannel.untrack()
          presenceChannel.unsubscribe()
        }

      } catch (error) {
        console.error('Failed to initialize collaboration:', error)
        setIsConnected(false)
        return undefined
      }
    }

    initializeCollaboration()

    return () => {
      if (providerRef.current) {
        providerRef.current.destroy()
      }
    }
  }, [user, contractId, ydoc, updateConnectedUsers])

  // Update typing status
  const updateTypingStatus = useCallback((isTyping: boolean) => {
    if (provider) {
      provider.awareness.setLocalStateField('isTyping', isTyping)
    }
  }, [provider])

  return {
    ydoc,
    provider,
    isConnected,
    connectedUsers,
    updateTypingStatus,
    getUserColor: (userId: string) => getUserColor(userId)
  }
}