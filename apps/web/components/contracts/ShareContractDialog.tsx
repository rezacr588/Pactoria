'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Share2,
  Copy, 
  Mail,
  Users,
  Eye,
  Edit,
  Crown,
  Clock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface ShareContractDialogProps {
  contractId: string
  contractTitle: string
  isOpen: boolean
  onClose: () => void
}

interface CollaboratorPermission {
  id: string
  email: string
  role: 'viewer' | 'editor' | 'admin'
  status: 'pending' | 'accepted' | 'rejected'
  addedAt: Date
}

const ROLE_CONFIGS = {
  viewer: {
    icon: <Eye className="h-4 w-4" />,
    label: 'Viewer',
    description: 'Can view the contract and comments',
    color: 'bg-gray-100 text-gray-800'
  },
  editor: {
    icon: <Edit className="h-4 w-4" />,
    label: 'Editor', 
    description: 'Can edit the contract and add comments',
    color: 'bg-blue-100 text-blue-800'
  },
  admin: {
    icon: <Crown className="h-4 w-4" />,
    label: 'Admin',
    description: 'Full access including sharing and deletion',
    color: 'bg-purple-100 text-purple-800'
  }
}

export function ShareContractDialog({ 
  contractId, 
  contractTitle, 
  isOpen, 
  onClose 
}: ShareContractDialogProps) {
  const { } = useAuth()
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor' | 'admin'>('viewer')
  const [isSharing, setIsSharing] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorPermission[]>([
    {
      id: '1',
      email: 'alice@example.com',
      role: 'editor',
      status: 'accepted',
      addedAt: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
      id: '2', 
      email: 'bob@example.com',
      role: 'viewer',
      status: 'pending',
      addedAt: new Date(Date.now() - 3600000) // 1 hour ago
    }
  ])

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    // Check if user is already shared with
    if (collaborators.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      toast.error('This user already has access to the contract')
      return
    }

    setIsSharing(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const newCollaborator: CollaboratorPermission = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        role: selectedRole,
        status: 'pending',
        addedAt: new Date()
      }
      
      setCollaborators(prev => [...prev, newCollaborator])
      setEmail('')
      toast.success(`Invitation sent to ${email}`)
    } catch (error) {
      toast.error('Failed to send invitation')
    } finally {
      setIsSharing(false)
    }
  }

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id))
    toast.success('Access revoked')
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/contracts/${contractId}?share=true`
    navigator.clipboard.writeText(link)
    toast.success('Share link copied to clipboard')
  }

  const getStatusIcon = (status: CollaboratorPermission['status']) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusLabel = (status: CollaboratorPermission['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Contract</span>
          </DialogTitle>
          <DialogDescription>
            Share "{contractTitle}" with others and manage collaboration permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Share Link</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Input
                  value={`${window.location.origin}/contracts/${contractId}?share=true`}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button onClick={handleCopyLink} variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Anyone with this link can view the contract
              </p>
            </CardContent>
          </Card>

          {/* Add Collaborator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Invite Collaborators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleShare()}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Label>Role</Label>
                    <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_CONFIGS).map(([role, config]) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center space-x-2">
                              {config.icon}
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <Button 
                      onClick={handleShare}
                      disabled={isSharing || !email.trim()}
                      className="w-full"
                    >
                      {isSharing ? (
                        <>Loading...</>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Invite
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {selectedRole && (
                  <Alert>
                    <AlertDescription>
                      {ROLE_CONFIGS[selectedRole].description}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Collaborators */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Current Collaborators ({collaborators.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {collaborators.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No collaborators yet. Invite someone to start collaborating!
                  </p>
                ) : (
                  collaborators.map((collaborator) => (
                    <div 
                      key={collaborator.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {collaborator.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{collaborator.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Added {collaborator.addedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(collaborator.status)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusLabel(collaborator.status)}
                          </span>
                        </div>
                        <Badge className={ROLE_CONFIGS[collaborator.role].color}>
                          <span className="flex items-center space-x-1">
                            {ROLE_CONFIGS[collaborator.role].icon}
                            <span>{ROLE_CONFIGS[collaborator.role].label}</span>
                          </span>
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}