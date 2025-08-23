'use client'

import React from 'react'
import { useContracts } from '@/hooks/useContracts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { PageLayout, PageHeader, PageSection } from '@/components/layout/PageLayout'
import { StatsCard, MetricCard } from '@/components/ui/stats-card'
import { PageSkeleton } from '@/components/ui/loading'
import {
  Card,
  Title,
  Text,
  Metric,
  BarChart,
  DonutChart,
  LineChart,
  Grid,
  Col,
  Flex,
  Badge,
  ProgressBar,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@tremor/react'
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Users,
  Activity,
  DollarSign
} from 'lucide-react'

export default function AnalyticsPage() {
  const { contracts, isLoading: contractsLoading } = useContracts()
  const { 
    monthlyTrend,
    riskDistribution,
    cycleTime,
    riskScore,
    activeUsers,
    avgResponseTime,
    costSavings,
    approvalRate,
    onTimeCompletion,
    complianceScore,
    formatCurrency,
    isLoading: analyticsLoading
  } = useAnalytics()

  const isLoading = contractsLoading || analyticsLoading

  if (isLoading) {
    return (
      <PageLayout>
        <PageSkeleton />
      </PageLayout>
    )
  }

  // Calculate metrics
  const totalContracts = contracts.length
  const draftContracts = contracts.filter(c => c.status === 'draft').length
  const approvedContracts = contracts.filter(c => c.status === 'approved').length
  const avgVersions = contracts.reduce((acc, c) => acc + (c.latest_version_number || 0), 0) / (totalContracts || 1)

  // Status distribution for donut chart
  const statusData = [
    { name: 'Draft', value: contracts.filter(c => c.status === 'draft').length },
    { name: 'In Review', value: contracts.filter(c => c.status === 'in_review').length },
    { name: 'Approved', value: contracts.filter(c => c.status === 'approved').length },
    { name: 'Rejected', value: contracts.filter(c => c.status === 'rejected').length },
    { name: 'Signed', value: contracts.filter(c => c.status === 'signed').length },
  ].filter(item => item.value > 0)

  // Use real data from analytics hook
  const monthlyData = monthlyTrend
  const riskData = riskDistribution
  const cycleTimeData = cycleTime
  const contractsAnalyzed = contracts.filter(c => c.metadata?.risk_level).length

  return (
    <PageLayout>
      <PageHeader
        title="Analytics Dashboard"
        description="Monitor contract performance, risk metrics, and operational efficiency"
      />

      <PageSection>
        {/* KPI Cards using reusable components */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Contracts"
            metric={totalContracts}
            icon={<FileText className="h-5 w-5" />}
            color="blue"
          />
          
          <MetricCard
            title="Approved"
            metric={approvedContracts}
            subtitle={totalContracts > 0 ? `${((approvedContracts / totalContracts) * 100).toFixed(0)}% of total` : '0%'}
            icon={<CheckCircle className="h-5 w-5" />}
            color="green"
          />
          
          <MetricCard
            title="In Draft"
            metric={draftContracts}
            subtitle="Pending review"
            icon={<Clock className="h-5 w-5" />}
            color="yellow"
          />
          
          <MetricCard
            title="Avg Versions"
            metric={avgVersions.toFixed(1)}
            subtitle="Per contract"
            icon={<Activity className="h-5 w-5" />}
            color="purple"
          />
        </div>
      </PageSection>

      <PageSection>

      {/* Charts Section */}
      <TabGroup>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Risk Analysis</Tab>
          <Tab>Performance</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Grid numItemsLg={2} className="gap-6 mt-6">
              {/* Status Distribution */}
              <Card>
                <Title>Contract Status Distribution</Title>
                <DonutChart
                  className="mt-6"
                  data={statusData}
                  category="value"
                  index="name"
                  colors={["slate", "yellow", "green", "red", "blue"]}
                  showLabel={true}
                />
              </Card>

              {/* Monthly Trend */}
              <Card>
                <Title>Monthly Contract Trend</Title>
                <LineChart
                  className="mt-6"
                  data={monthlyData}
                  index="month"
                  categories={["contracts", "approvals"]}
                  colors={["blue", "green"]}
                  yAxisWidth={40}
                />
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid numItemsLg={2} className="gap-6 mt-6">
              {/* Risk Distribution */}
              <Card>
                <Title>Risk Level Distribution</Title>
                <Flex className="mt-4" justifyContent="between" alignItems="baseline">
                  <Text>Contract Risk Assessment</Text>
                  <Badge color="orange">
                    <AlertTriangle className="h-3 w-3 mr-1 inline" />
                    {contractsAnalyzed} contracts analyzed
                  </Badge>
                </Flex>
                <BarChart
                  className="mt-6"
                  data={riskData}
                  index="category"
                  categories={["count"]}
                  colors={["emerald", "yellow", "red"]}
                  yAxisWidth={40}
                />
              </Card>

              {/* Risk Score Progress */}
              <Card>
                <Title>Average Risk Score</Title>
                <Text className="mt-2">Portfolio Risk Level</Text>
                <Flex className="mt-4" justifyContent="between">
                  <Text>Low Risk</Text>
                  <Text>High Risk</Text>
                </Flex>
                <ProgressBar value={riskScore} color={riskScore > 60 ? "red" : riskScore > 30 ? "yellow" : "green"} className="mt-2" />
                <Flex className="mt-4 space-x-4">
                  <div>
                    <Text className="text-xs text-gray-500">Current Score</Text>
                    <Text className="text-lg font-semibold">{riskScore}%</Text>
                  </div>
                  <div>
                    <Text className="text-xs text-gray-500">Target</Text>
                    <Text className="text-lg font-semibold">{'<30%'}</Text>
                  </div>
                </Flex>
              </Card>
            </Grid>
          </TabPanel>

          <TabPanel>
            <Grid numItemsLg={2} className="gap-6 mt-6">
              {/* Cycle Time */}
              <Card>
                <Title>Average Cycle Time</Title>
                <Text className="mt-2">Days per stage</Text>
                <BarChart
                  className="mt-6"
                  data={cycleTimeData}
                  index="stage"
                  categories={["days"]}
                  colors={["blue"]}
                  yAxisWidth={40}
                  layout="horizontal"
                />
              </Card>

              {/* Performance Metrics */}
              <Card>
                <Title>Performance Metrics</Title>
                <div className="mt-6 space-y-4">
                  <div>
                    <Flex justifyContent="between" alignItems="center">
                      <Text>Approval Rate</Text>
                      <Badge color="green">{approvalRate}%</Badge>
                    </Flex>
                    <ProgressBar value={approvalRate} color="green" className="mt-2" />
                  </div>
                  <div>
                    <Flex justifyContent="between" alignItems="center">
                      <Text>On-Time Completion</Text>
                      <Badge color="blue">{onTimeCompletion}%</Badge>
                    </Flex>
                    <ProgressBar value={onTimeCompletion} color="blue" className="mt-2" />
                  </div>
                  <div>
                    <Flex justifyContent="between" alignItems="center">
                      <Text>Compliance Score</Text>
                      <Badge color="purple">{complianceScore}%</Badge>
                    </Flex>
                    <ProgressBar value={complianceScore} color="purple" className="mt-2" />
                  </div>
                </div>
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      </PageSection>

      {/* Bottom Stats using reusable components */}
      <PageSection>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Active Users"
            value={activeUsers.toString()}
            change={activeUsers > 0 ? Math.round((activeUsers / Math.max(activeUsers - 2, 1) - 1) * 100) : 0}
            changeLabel="vs last month"
            trend={activeUsers > 0 ? "up" : "neutral"}
            icon={<Users className="h-5 w-5" />}
          />
          
          <StatsCard
            title="Avg Response Time"
            value={avgResponseTime}
            description="Between contract versions"
            trend="neutral"
            icon={<Clock className="h-5 w-5" />}
          />
          
          <StatsCard
            title="Cost Savings"
            value={formatCurrency(costSavings)}
            description="Estimated from automation"
            trend={costSavings > 0 ? "up" : "neutral"}
            icon={<DollarSign className="h-5 w-5" />}
          />
        </div>
      </PageSection>
    </PageLayout>
  )
}
