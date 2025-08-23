'use client'

import { useAuth } from '@/hooks/useAuth'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { LoadingSpinner } from '@/components/ui/loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabaseClient'

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
})

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const notificationsFormSchema = z.object({
  contractUpdates: z.boolean(),
  approvalRequests: z.boolean(),
  mentions: z.boolean(),
  newsletter: z.boolean(),
})

export default function SettingsPage() {
  const { user } = useAuth()

  const profileForm = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.user_metadata?.name || '',
      email: user?.email || '',
    },
  })

  const passwordForm = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const notificationsForm = useForm({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      contractUpdates: true,
      approvalRequests: true,
      mentions: true,
      newsletter: false,
    },
  })

  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    const { error } = await supabase.auth.updateUser({ data: { name: data.name } })
    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated successfully')
    }
  }

  const onPasswordSubmit = async (_data: z.infer<typeof passwordFormSchema>) => {
    // This requires a custom implementation to verify the current password before changing it.
    // Supabase doesn't directly support this. You would need a serverless function.
    toast.info('Password change functionality is not yet implemented.')
  }

  const onNotificationsSubmit = (_data: z.infer<typeof notificationsFormSchema>) => {
    toast.success('Notification settings saved')
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader
        title="Settings"
        description="Manage your account settings, profile, and notification preferences"
      />

      <PageSection>
        {/* Profile Settings */}
        <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback>{user.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <Button type="button" variant="outline">Change Avatar</Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...profileForm.register('name')} />
              {profileForm.formState.errors.name && (
                <p className="text-sm text-red-500">{String(profileForm.formState.errors.name?.message)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...profileForm.register('email')} disabled />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit">Change Password</Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your email notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="contractUpdates">Contract Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications about status changes to your contracts.
                </p>
              </div>
              <Controller
                control={notificationsForm.control}
                name="contractUpdates"
                render={({ field }) => (
                  <Switch
                    id="contractUpdates"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="approvalRequests">Approval Requests</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone requests your approval on a contract.
                </p>
              </div>
              <Controller
                control={notificationsForm.control}
                name="approvalRequests"
                render={({ field }) => (
                  <Switch
                    id="approvalRequests"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="mentions">Mentions</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone mentions you in a comment.
                </p>
              </div>
              <Controller
                control={notificationsForm.control}
                name="mentions"
                render={({ field }) => (
                  <Switch
                    id="mentions"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="newsletter">Newsletter</Label>
                <p className="text-sm text-muted-foreground">
                  Receive our monthly newsletter with updates and tips.
                </p>
              </div>
              <Controller
                control={notificationsForm.control}
                name="newsletter"
                render={({ field }) => (
                  <Switch
                    id="newsletter"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
            <Button type="submit">Save Preferences</Button>
          </form>
        </CardContent>
      </Card>
      </PageSection>
    </PageLayout>
  )
}

