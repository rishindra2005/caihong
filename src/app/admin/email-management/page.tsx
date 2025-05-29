'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getWelcomeEmailTemplate } from '@/lib/email/templates/welcomeTemplate';
import { getOfferLetterTemplate } from '@/lib/email/templates/offerLetterTemplate';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'full';

const deviceDimensions = {
  mobile: { width: '375px', height: '667px' },
  tablet: { width: '768px', height: '1024px' },
  desktop: { width: '1280px', height: '800px' },
  full: { width: '100%', height: '100%' }
};

export default function EmailManagement() {
  const router = useRouter();
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
    host: 'smtp.mail.us-east-1.awsapps.com',
    port: 465,
    secure: true,
    user: '',
    password: '',
  });
  
  const [verifiedSMTP, setVerifiedSMTP] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [recipients, setRecipients] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('full');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to CAIHONG',
      content: getWelcomeEmailTemplate(),
      variables: ['name']
    },
    {
      id: 'offer-letter',
      name: 'Internship Offer Letter',
      subject: 'CAIHONG Internship Offer Letter',
      content: getOfferLetterTemplate(),
      variables: ['name', 'startDate', 'email', 'password', 'role', 'description']
    }
  ]);

  useEffect(() => {
    if (selectedTemplate) {
      updatePreview();
    }
  }, [selectedTemplate, templateVariables]);

  const updatePreview = () => {
    if (!selectedTemplate) return;
    
    let preview = selectedTemplate.content;
    if (selectedTemplate.id === 'welcome') {
      preview = getWelcomeEmailTemplate(templateVariables['name']);
    } else if (selectedTemplate.id === 'offer-letter') {
      preview = getOfferLetterTemplate(
        templateVariables['name'],
        templateVariables['startDate'],
        templateVariables['email'],
        templateVariables['password'],
        templateVariables['role'],
        templateVariables['description']
      );
    } else {
      Object.entries(templateVariables).forEach(([key, value]) => {
        const regex = new RegExp(`\\$\\{${key}\\}|\\{\\{${key}\\}\\}`, 'g');
        preview = preview.replace(regex, value || `[${key}]`);
      });
    }
    
    setPreviewHtml(preview);
  };

  const verifySmtp = async () => {
    try {
      const response = await fetch('/api/admin/verify-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfig)
      });
      
      if (response.ok) {
        setVerifiedSMTP(true);
      } else {
        throw new Error('SMTP verification failed');
      }
    } catch (error) {
      console.error('SMTP verification error:', error);
      alert('Failed to verify SMTP configuration');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setSubject(template.subject);
      const newVariables: Record<string, string> = {};
      template.variables.forEach(variable => {
        newVariables[variable] = templateVariables[variable] || '';
      });
      setTemplateVariables(newVariables);
    } else {
      setSelectedTemplate(null);
      setSubject('');
      setTemplateVariables({});
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleSendEmail = async () => {
    try {
      if (!selectedTemplate) {
        alert('Please select a template first');
        return;
      }

      // Validate required variables
      if (selectedTemplate.id === 'offer-letter') {
        const requiredVariables = ['name', 'startDate', 'email', 'password', 'role', 'description'];
        const missingVariables = requiredVariables.filter(
          variable => !templateVariables[variable]
        );
        
        if (missingVariables.length > 0) {
          alert(`Please fill in all required fields: ${missingVariables.join(', ')}`);
          return;
        }
      }

      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: smtpConfig,
          recipients: recipients.split(',').map(r => r.trim()),
          subject,
          template: selectedTemplate.content,
          variables: templateVariables,
          templateId: selectedTemplate.id
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }
      
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Send email error:', error);
      alert(error instanceof Error ? error.message : 'Failed to send email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white">
      <div className="container mx-auto p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Email Management</h1>
          <div className="flex items-center space-x-4">
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value as DeviceType)}
              className="bg-white/10 rounded-lg border border-white/20 p-2 focus:outline-none focus:border-blue-500"
            >
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="desktop">Desktop</option>
              <option value="full">Full Width</option>
            </select>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20"
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h6m0 0v6m0-6L4 20m16-6h-6m0 0v6m0-6l6 6M4 4h6m0 0v6m0-6L4 10m16-6h-6m0 0v6m0-6l6 6" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className={`grid gap-8 ${isFullscreen ? '' : 'grid-cols-1'}`}>
          {!isFullscreen && (
            <div className="space-y-8">
              {/* SMTP Configuration */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold mb-4">SMTP Configuration</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={smtpConfig.host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                      className="w-full bg-white/5 rounded-lg border border-white/20 p-2 focus:outline-none focus:border-blue-500"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Port</label>
                    <input
                      type="number"
                      value={smtpConfig.port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, port: parseInt(e.target.value) })}
                      className="w-full bg-white/5 rounded-lg border border-white/20 p-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Username</label>
                    <input
                      type="text"
                      value={smtpConfig.user}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                      className="w-full bg-white/5 rounded-lg border border-white/20 p-2 focus:outline-none focus:border-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Password</label>
                    <input
                      type="password"
                      value={smtpConfig.password}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                      className="w-full bg-white/5 rounded-lg border border-white/20 p-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={verifySmtp}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Verify SMTP
                </button>
                {verifiedSMTP && (
                  <div className="text-green-400 mt-2">
                    ✓ SMTP Configuration Verified
                  </div>
                )}
              </div>

              {/* Email Composition */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold mb-4">Email Composition</h2>
                
                {/* Template Selection */}
                <div>
                  <label className="block text-sm mb-2">Template</label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                    className="w-full bg-white/5 rounded-lg border border-white/20 p-2 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select a template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm mb-2">Recipients (comma-separated)</label>
                  <input
                    type="text"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    className="w-full bg-white/5 rounded-lg border border-white/20 p-2 focus:outline-none focus:border-blue-500"
                    placeholder="user1@example.com, user2@example.com"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm mb-2">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white/5 rounded-lg border border-white/20 p-2 focus:outline-none focus:border-blue-500"
                    placeholder="Email subject"
                  />
                </div>

                {/* Template Variables */}
                {selectedTemplate && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Template Variables</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTemplate.variables.map(variable => (
                        <div key={variable}>
                          <label className="block text-sm mb-2">{variable}</label>
                          <input
                            type="text"
                            value={templateVariables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            className="w-full bg-white/5 rounded-lg border border-white/20 p-2 focus:outline-none focus:border-blue-500"
                            placeholder={`Enter ${variable}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={handleSendEmail}
                    disabled={!verifiedSMTP}
                    className={`px-6 py-2 rounded-lg transition-colors ${
                      verifiedSMTP
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Live Preview */}
          <div className={`bg-white/10 backdrop-blur-lg rounded-xl ${isFullscreen ? 'fixed inset-0 z-50 m-4' : ''}`}>
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-semibold">Live Preview</h2>
              {isFullscreen && (
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className={`p-4 flex items-center justify-center ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-[800px]'}`}>
              <div
                style={{
                  width: deviceDimensions[selectedDevice].width,
                  height: deviceDimensions[selectedDevice].height,
                  maxHeight: '100%',
                  transition: 'all 0.3s ease'
                }}
                className="bg-white rounded-lg overflow-hidden shadow-xl"
              >
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 