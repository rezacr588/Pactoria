'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import contractsService from '@/lib/services/contracts'
import type { 
  ContractStats, 
  ContractWithDetails, 
  RecentActivity 
} from '@/types'
import { 
  FileText, 
  Plus, 
  Users, 
  TrendingUp, 
  Clock,
  Activity,
  Calendar,
  Download,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  ChevronRight,
  Briefcase,
  FileSignature,
  Folder
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<ContractStats | null>(null)
  const [recentContracts, setRecentContracts] = useState<ContractWithDetails[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])

  // Load dashboard data
  useEffect(() => {
    if (!user) return

    loadDashboardData()
    
    // Set up real-time subscriptions
    const contractsSub = contractsService.subscribeToContractUpdates((payload) => {
      console.log('Contract update:', payload)
      loadDashboardData() // Reload data on changes
    })

    const activitySub = contractsService.subscribeToActivityUpdates((payload) => {
      console.log('New activity:', payload)
      loadActivities() // Reload activities on new events
    })

    return () => {
      contractsSub.unsubscribe()
      activitySub.unsubscribe()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsData, contractsData, activitiesData] = await Promise.all([
        contractsService.getContractStats(),
        contractsService.getRecentContracts(5),
        contractsService.getRecentActivity(4)
      ])
      
      setStats(statsData)
      setRecentContracts(contractsData)
      setActivities(activitiesData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      const activitiesData = await contractsService.getRecentActivity(4)
      setActivities(activitiesData)
    } catch (error) {
      console.error('Error loading activities:', error)
    }
  }

  // Format stats for display
  const formattedStats = stats ? [
    {
      title: 'Total Contracts',
      value: stats.totalContracts.toLocaleString(),
      change: `${stats.contractsChange > 0 ? '+' : ''}${stats.contractsChange}%`,
      trend: stats.contractsChange >= 0 ? 'up' : 'down',
      icon: <FileText className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Negotiations',
      value: stats.activeNegotiations.toString(),
      change: `${stats.negotiationsChange > 0 ? '+' : ''}${stats.negotiationsChange}%`,
      trend: stats.negotiationsChange >= 0 ? 'up' : 'down',
      icon: <Users className="h-4 w-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Pending Review',
      value: stats.pendingReview.toString(),
      change: `${stats.reviewChange > 0 ? '+' : ''}${stats.reviewChange}%`,
      trend: stats.reviewChange >= 0 ? 'up' : 'down',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      change: `${stats.completionChange > 0 ? '+' : ''}${stats.completionChange}%`,
      trend: stats.completionChange >= 0 ? 'up' : 'down',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ] : []

  const quickActions = [
    {
      title: 'Create Contract',
      description: 'Start from template or AI',
      icon: <Plus className="h-5 w-5" />,
      action: () => router.push('/contracts/new')
    },
    {
      title: 'Templates',
      description: 'Browse contract templates',
      icon: <Folder className="h-5 w-5" />,
      action: () => router.push('/templates')
    },
    {
      title: 'Import Document',
      description: 'Upload existing contract',
      icon: <Download className="h-5 w-5" />,
      action: () => router.push('/import')
    },
    {
      title: 'Team Members',
      description: 'Manage collaborators',
      icon: <Users className="h-5 w-5" />,
      action: () => router.push('/team')
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      negotiation: { label: 'In Negotiation', className: 'bg-blue-100 text-blue-700' },
      review: { label: 'Under Review', className: 'bg-yellow-100 text-yellow-700' },
      signed: { label: 'Signed', className: 'bg-green-100 text-green-700' },
      expired: { label: 'Expired', className: 'bg-red-100 text-red-700' }
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { icon: <AlertCircle className="h-3 w-3" />, className: 'text-red-500' },
      medium: { icon: <AlertCircle className="h-3 w-3" />, className: 'text-yellow-500' },
      low: { icon: <AlertCircle className="h-3 w-3" />, className: 'text-gray-400' }
    }
    const config = priorityConfig[priority as keyof typeof priorityConfig]
    return <span className={config.className}>{config.icon}</span>
  }

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your contracts today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={action.action}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <div className="text-indigo-600">{action.icon}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{action.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            // Loading skeleton
            [...Array(4)].map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            formattedStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last week</span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Contracts - 2 columns */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Contracts</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-1" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  // Loading skeleton
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="flex items-center space-x-4 p-4 border rounded-lg">
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentContracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No contracts yet</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => router.push('/contracts/new')}
                    >
                      Create Your First Contract
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentContracts.map((contract) => (
                    <div 
                      key={contract.id} 
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => router.push(`/contracts/${contract.id}`)}
                    >
                      <div className="flex-shrink-0">
                        {getPriorityBadge(contract.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {contract.title}
                          </h3>
                          {getStatusBadge(contract.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(contract.updated_at || contract.created_at).toLocaleDateString()}
                          </span>
                          {contract.value && (
                            <span className="flex items-center">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {contract.value}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {contract.parties?.length || 0} parties
                          </span>
                        </div>
                        <div className="mt-2">
                          <Progress value={contract.progress} className="h-1" />
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileSignature className="mr-2 h-4 w-4" />
                            Edit Contract
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed - 1 column */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Track what's happening across your contracts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  // Loading skeleton
                  <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="animate-pulse flex items-start space-x-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.avatar} />
                        <AvatarFallback>{activity.user[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{' '}
                          <span className="text-gray-500">{activity.action}</span>{' '}
                          <span className="font-medium">{activity.contractTitle}</span>
                        </p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
                {!loading && activities.length > 0 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All Activity
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Your contract metrics this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Contracts Created</span>
                      <span className="text-sm font-bold">45</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Avg. Completion Time</span>
                      <span className="text-sm font-bold">3.2 days</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Approval Rate</span>
                      <span className="text-sm font-bold">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Team Efficiency</span>
                      <span className="text-sm font-bold">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  )
}
