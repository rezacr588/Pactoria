import { Resend } from 'resend'
import { supabase } from '@/lib/supabaseClient'

// Initialize Resend with API key from environment variable
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface EmailTemplate {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
}

export interface NotificationPreferences {
  contractUpdates: boolean
  newCollaborations: boolean
  statusChanges: boolean
  comments: boolean
  reminders: boolean
  weeklyDigest: boolean
}

// Email templates
export const emailTemplates = {
  contractStatusUpdate: (data: {
    recipientName: string
    contractTitle: string
    oldStatus: string
    newStatus: string
    updatedBy: string
    contractUrl: string
  }) => ({
    subject: `Contract Status Updated: ${data.contractTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Contract Status Update</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
            .status-draft { background: #f3f4f6; color: #6b7280; }
            .status-in_review { background: #fef3c7; color: #d97706; }
            .status-approved { background: #d1fae5; color: #059669; }
            .status-rejected { background: #fee2e2; color: #dc2626; }
            .status-signed { background: #dbeafe; color: #2563eb; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Contract Status Updated</h1>
            </div>
            <div class="content">
              <p>Hi ${data.recipientName},</p>
              
              <p>The status of the contract "<strong>${data.contractTitle}</strong>" has been updated.</p>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Previous Status:</strong> <span class="status-badge status-${data.oldStatus}">${data.oldStatus.replace('_', ' ')}</span></p>
                <p style="margin: 0;"><strong>New Status:</strong> <span class="status-badge status-${data.newStatus}">${data.newStatus.replace('_', ' ')}</span></p>
              </div>
              
              <p>Updated by: <strong>${data.updatedBy}</strong></p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.contractUrl}" class="button">View Contract</a>
              </div>
              
              <div class="footer">
                <p>You're receiving this email because you have notifications enabled for contract updates.</p>
                <p>To manage your notification preferences, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">account settings</a>.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Contract Status Updated
      
      Hi ${data.recipientName},
      
      The status of the contract "${data.contractTitle}" has been updated.
      
      Previous Status: ${data.oldStatus.replace('_', ' ')}
      New Status: ${data.newStatus.replace('_', ' ')}
      
      Updated by: ${data.updatedBy}
      
      View the contract: ${data.contractUrl}
      
      You're receiving this email because you have notifications enabled for contract updates.
      To manage your notification preferences, visit your account settings.
    `
  }),

  newCollaboration: (data: {
    recipientName: string
    inviterName: string
    contractTitle: string
    role: string
    contractUrl: string
  }) => ({
    subject: `You've been added to: ${data.contractTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Collaboration</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .role-badge { display: inline-block; padding: 6px 12px; background: #ede9fe; color: #7c3aed; border-radius: 20px; font-size: 14px; font-weight: 600; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">You've Been Added as a Collaborator!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.recipientName},</p>
              
              <p><strong>${data.inviterName}</strong> has added you as a collaborator on the following contract:</p>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin: 0 0 10px 0; font-size: 18px;">${data.contractTitle}</h2>
                <p style="margin: 0;">Your role: <span class="role-badge">${data.role}</span></p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.contractUrl}" class="button">View Contract</a>
              </div>
              
              <div class="footer">
                <p>You're receiving this email because someone added you as a collaborator on a contract.</p>
                <p>To manage your notification preferences, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">account settings</a>.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      You've Been Added as a Collaborator!
      
      Hi ${data.recipientName},
      
      ${data.inviterName} has added you as a collaborator on the following contract:
      
      Contract: ${data.contractTitle}
      Your role: ${data.role}
      
      View the contract: ${data.contractUrl}
      
      You're receiving this email because someone added you as a collaborator on a contract.
      To manage your notification preferences, visit your account settings.
    `
  }),

  weeklyDigest: (data: {
    recipientName: string
    weekStartDate: string
    weekEndDate: string
    stats: {
      contractsCreated: number
      contractsUpdated: number
      contractsSigned: number
      newCollaborations: number
    }
    recentContracts: Array<{
      title: string
      status: string
      url: string
    }>
  }) => ({
    subject: `Your Weekly Contract Summary - ${data.weekStartDate} to ${data.weekEndDate}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Weekly Digest</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .stat-card { display: inline-block; width: 48%; margin: 1%; padding: 15px; background: #f9fafb; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 28px; font-weight: bold; color: #6366f1; }
            .stat-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
            .contract-item { padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">Your Weekly Summary</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">${data.weekStartDate} - ${data.weekEndDate}</p>
            </div>
            <div class="content">
              <p>Hi ${data.recipientName},</p>
              
              <p>Here's your weekly contract activity summary:</p>
              
              <div style="margin: 30px 0;">
                <div class="stat-card">
                  <div class="stat-number">${data.stats.contractsCreated}</div>
                  <div class="stat-label">Contracts Created</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.stats.contractsUpdated}</div>
                  <div class="stat-label">Contracts Updated</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.stats.contractsSigned}</div>
                  <div class="stat-label">Contracts Signed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.stats.newCollaborations}</div>
                  <div class="stat-label">New Collaborations</div>
                </div>
              </div>
              
              ${data.recentContracts.length > 0 ? `
                <h2 style="font-size: 18px; margin-top: 30px;">Recent Contracts</h2>
                ${data.recentContracts.map(contract => `
                  <div class="contract-item">
                    <strong>${contract.title}</strong><br>
                    Status: ${contract.status.replace('_', ' ')}<br>
                    <a href="${contract.url}" style="color: #6366f1;">View Contract →</a>
                  </div>
                `).join('')}
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
              </div>
              
              <div class="footer">
                <p>You're receiving this weekly digest because you have it enabled in your notification preferences.</p>
                <p>To manage your notification preferences, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">account settings</a>.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Your Weekly Summary
      ${data.weekStartDate} - ${data.weekEndDate}
      
      Hi ${data.recipientName},
      
      Here's your weekly contract activity summary:
      
      - Contracts Created: ${data.stats.contractsCreated}
      - Contracts Updated: ${data.stats.contractsUpdated}
      - Contracts Signed: ${data.stats.contractsSigned}
      - New Collaborations: ${data.stats.newCollaborations}
      
      ${data.recentContracts.length > 0 ? `Recent Contracts:
      ${data.recentContracts.map(c => `- ${c.title} (${c.status.replace('_', ' ')})`).join('\n')}` : ''}
      
      View your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
      
      You're receiving this weekly digest because you have it enabled in your notification preferences.
      To manage your notification preferences, visit your account settings.
    `
  })
}

// Send email function
export async function sendEmail(template: EmailTemplate) {
  if (!resend) {
    console.warn('Email service not configured. Please set RESEND_API_KEY environment variable.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: template.from || 'Contract Manager <noreply@contractmanager.app>',
      to: template.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      reply_to: template.replyTo
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Get user notification preferences
export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('notification_preferences')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      // Return default preferences if not found
      return {
        contractUpdates: true,
        newCollaborations: true,
        statusChanges: true,
        comments: true,
        reminders: true,
        weeklyDigest: false
      }
    }

    return data.notification_preferences as NotificationPreferences
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return null
  }
}

// Check if user wants to receive a specific type of notification
export async function shouldSendNotification(
  userId: string,
  notificationType: keyof NotificationPreferences
): Promise<boolean> {
  const preferences = await getUserNotificationPreferences(userId)
  if (!preferences) return false
  return preferences[notificationType]
}

// Queue email for sending (for batch processing)
export async function queueEmail(
  recipientId: string,
  templateName: string,
  templateData: any,
  scheduledFor?: Date
) {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        recipient_id: recipientId,
        template_name: templateName,
        template_data: templateData,
        scheduled_for: scheduledFor || new Date(),
        status: 'pending'
      })

    if (error) {
      console.error('Error queuing email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error queuing email:', error)
    return { success: false, error }
  }
}

// Process email queue (can be called by a cron job or serverless function)
export async function processEmailQueue() {
  try {
    // Get pending emails scheduled for now or earlier
    const { data: pendingEmails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(10) // Process 10 at a time

    if (error || !pendingEmails) {
      console.error('Error fetching email queue:', error)
      return
    }

    for (const email of pendingEmails) {
      // Get recipient details
      const { data: user } = await supabase
        .from('auth.users')
        .select('email, raw_user_meta_data')
        .eq('id', email.recipient_id)
        .single()

      if (!user) continue

      // Get the template function
      const templateFunction = (emailTemplates as any)[email.template_name]
      if (!templateFunction) {
        console.error(`Template not found: ${email.template_name}`)
        continue
      }

      // Generate email content
      const emailContent = templateFunction({
        ...email.template_data,
        recipientName: user.raw_user_meta_data?.name || user.email.split('@')[0]
      })

      // Send the email
      const result = await sendEmail({
        to: user.email,
        ...emailContent
      })

      // Update queue status
      await supabase
        .from('email_queue')
        .update({
          status: result.success ? 'sent' : 'failed',
          sent_at: result.success ? new Date() : null,
          error: result.error ? JSON.stringify(result.error) : null
        })
        .eq('id', email.id)
    }
  } catch (error) {
    console.error('Error processing email queue:', error)
  }
}
