import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Activity,
  Key,
  Puzzle,
  FileText,
  ShieldAlert,
  Settings as SettingsIcon,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Globe,
  Monitor,
  MoreVertical,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Command,
  X,
  Copy,
  Terminal,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  GitMerge,
  Box,
  Cloud,
  Check,
  SearchCode
} from 'lucide-react';

// --- MOCK DATA ---
const KPI_DATA = [
  { label: 'MRR', value: '$124,500', change: '+12.5%', positive: true, icon: CreditCard },
  { label: 'Active Tenants', value: '1,248', change: '+4.2%', positive: true, icon: Building2 },
  { label: 'Total Users', value: '45,231', change: '+8.1%', positive: true, icon: Users },
  { label: 'API Calls / mo', value: '14.2M', change: '+22.4%', positive: true, icon: Activity },
  { label: 'Avg Latency', value: '42ms', change: '-5.1%', positive: true, icon: Zap },
  { label: 'Error Rate', value: '0.012%', change: '-0.005%', positive: true, icon: AlertTriangle },
  { label: 'Storage Used', value: '4.2 TB', change: '+1.2%', positive: false, icon: Server },
  { label: 'Active Webhooks', value: '8,420', change: '+15.2%', positive: true, icon: GitMerge },
];

const TENANTS_DATA = [
  { id: 't_1', name: 'Acme Corp', tier: 'Enterprise', users: 1450, status: 'Active', mrr: '$4,500', created: '2023-01-15' },
  { id: 't_2', name: 'Globex Inc', tier: 'Pro', users: 240, status: 'Active', mrr: '$990', created: '2023-03-22' },
  { id: 't_3', name: 'Initech', tier: 'Starter', users: 15, status: 'Churned', mrr: '$0', created: '2022-11-05' },
  { id: 't_4', name: 'Soylent Corp', tier: 'Enterprise', users: 890, status: 'Active', mrr: '$2,500', created: '2024-01-10' },
  { id: 't_5', name: 'Massive Dynamic', tier: 'Enterprise', users: 3200, status: 'Active', mrr: '$12,000', created: '2021-08-19' },
];

const AUDIT_LOGS = [
  { id: 'log_1', actor: 'admin@acme.com', action: 'API_KEY_CREATED', resource: 'key_live_xyz', ip: '192.168.1.1', time: '2 mins ago', status: 'Success' },
  { id: 'log_2', actor: 'system', action: 'SUBSCRIPTION_RENEWED', resource: 'sub_456', ip: 'internal', time: '1 hour ago', status: 'Success' },
  { id: 'log_3', actor: 'jdoe@acme.com', action: 'USER_DELETED', resource: 'usr_789', ip: '10.0.0.5', time: '3 hours ago', status: 'Success' },
  { id: 'log_4', actor: 'attacker@unknown.com', action: 'LOGIN_FAILED', resource: 'admin@acme.com', ip: '45.22.11.9', time: '5 hours ago', status: 'Failure' },
];

// --- COMPONENTS ---

const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', onClick }) => {
  const baseStyle = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
  };
  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
};

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

// --- VIEWS ---

const Overview = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Executive Dashboard</h2>
      <div className="flex gap-2">
        <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm rounded-lg px-3 py-2">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Quarter</option>
          <option>Year to Date</option>
        </select>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export</Button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KPI_DATA.map((kpi, i) => (
        <Card key={i} className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${kpi.positive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            {kpi.positive ? <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" /> : <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />}
            <span className={kpi.positive ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>{kpi.change}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">vs last period</span>
          </div>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-5 col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue & Usage Trends</h3>
        <div className="h-64 flex items-end gap-2">
          {/* Mock Chart */}
          {[40, 55, 45, 60, 75, 65, 80, 95, 85, 100, 110, 105].map((val, i) => (
            <div key={i} className="w-full bg-blue-500/20 rounded-t-sm relative group hover:bg-blue-500/40 transition-all" style={{ height: `${val}%` }}>
              <div className="absolute bottom-0 w-full bg-blue-600 rounded-t-sm" style={{ height: `${val * 0.6}%` }}></div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Live Activity</h3>
        <div className="space-y-4">
          {[1,2,3,4,5].map((i) => (
             <div key={i} className="flex items-start gap-3">
               <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 animate-pulse"></div>
               <div>
                 <p className="text-sm font-medium text-gray-900 dark:text-white">New user signup in Acme Corp</p>
                 <p className="text-xs text-gray-500">{i * 2} minutes ago</p>
               </div>
             </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

const Tenants = ({ openCreateModal }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tenants / Organizations</h2>
      <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" /> Create Tenant</Button>
    </div>

    <Card>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input type="text" placeholder="Search tenants..." className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Filter className="w-4 h-4 mr-2"/> Filter</Button>
          <Button variant="outline"><Download className="w-4 h-4 mr-2"/> Export</Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 font-medium">Organization Name</th>
              <th className="px-6 py-3 font-medium">Plan Tier</th>
              <th className="px-6 py-3 font-medium">Users</th>
              <th className="px-6 py-3 font-medium">MRR</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Created</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {TENANTS_DATA.map(tenant => (
              <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{tenant.name.charAt(0)}</div>
                  {tenant.name}
                </td>
                <td className="px-6 py-4"><Badge color={tenant.tier === 'Enterprise' ? 'blue' : 'gray'}>{tenant.tier}</Badge></td>
                <td className="px-6 py-4">{tenant.users.toLocaleString()}</td>
                <td className="px-6 py-4 font-medium">{tenant.mrr}</td>
                <td className="px-6 py-4">
                  <Badge color={tenant.status === 'Active' ? 'green' : 'red'}>{tenant.status}</Badge>
                </td>
                <td className="px-6 py-4">{tenant.created}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><MoreVertical className="w-5 h-5 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm">
        <span className="text-gray-500">Showing 1 to 5 of 1,248 entries</span>
        <div className="flex gap-1">
          <Button variant="outline" className="px-2 py-1">Prev</Button>
          <Button variant="outline" className="px-2 py-1">Next</Button>
        </div>
      </div>
    </Card>
  </div>
);

const UsersRBAC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Users & RBAC</h2>
      <Button><Plus className="w-4 h-4 mr-2" /> Invite User</Button>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Roles</h3>
          <ul className="space-y-1">
             {['Super Admin', 'Tenant Admin', 'Developer', 'Billing Analyst', 'Read-Only'].map((role, i) => (
                <li key={i} className={`p-2 rounded-lg cursor-pointer ${i===0 ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {role}
                </li>
             ))}
          </ul>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="p-4">
           <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Super Admin Permissions</h3>
           <div className="space-y-6">
             {[
               { module: 'Tenant Management', perms: ['Create', 'Read', 'Update', 'Delete', 'Suspend'] },
               { module: 'User Management', perms: ['Invite', 'Read', 'Update', 'Delete', 'Reset MFA'] },
               { module: 'Billing', perms: ['View Invoices', 'Manage Cards', 'Change Plan', 'Cancel'] },
             ].map((group, i) => (
               <div key={i}>
                 <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{group.module}</h4>
                 <div className="flex flex-wrap gap-4">
                    {group.perms.map((p, j) => (
                      <label key={j} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        {p}
                      </label>
                    ))}
                 </div>
               </div>
             ))}
           </div>
           <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button>Save Changes</Button>
           </div>
        </Card>
      </div>
    </div>
  </div>
);

const Billing = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subscriptions & Billing</h2>
      <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Download Latest Invoice</Button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 col-span-2">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Enterprise Plan</h3>
            <p className="text-gray-500 text-sm mt-1">Billed annually. Next charge $144,000 on Jan 1, 2025.</p>
          </div>
          <Badge color="green">Active</Badge>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">API Requests</span>
              <span className="text-gray-500">14.2M / 20M</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '71%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">Storage</span>
              <span className="text-gray-500">4.2 TB / 10 TB</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '42%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">Active Users (Seats)</span>
              <span className="text-gray-500">3,450 / 5,000</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '69%' }}></div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button>Upgrade Plan</Button>
          <Button variant="outline">Manage Add-ons</Button>
        </div>
      </Card>
      
      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h3>
        <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg mb-4">
           <div className="w-12 h-8 bg-blue-900 rounded flex items-center justify-center text-white font-bold text-xs">VISA</div>
           <div>
             <p className="font-medium text-gray-900 dark:text-white">•••• •••• •••• 4242</p>
             <p className="text-xs text-gray-500">Expires 12/25</p>
           </div>
        </div>
        <Button variant="outline" className="w-full">Update Payment Method</Button>
      </Card>
    </div>

    <Card>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Billing History</h3>
      </div>
      <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-6 py-3 font-medium">Invoice Date</th>
            <th className="px-6 py-3 font-medium">Amount</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 font-medium text-right">Invoice</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {[1,2,3].map(i => (
             <tr key={i}>
               <td className="px-6 py-4">Dec 1, 2023</td>
               <td className="px-6 py-4">$12,000.00</td>
               <td className="px-6 py-4"><Badge color="green">Paid</Badge></td>
               <td className="px-6 py-4 text-right"><Button variant="outline" className="px-2 py-1 text-xs"><Download className="w-3 h-3 mr-1"/> PDF</Button></td>
             </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const DeveloperPortal = ({ openApiModal }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Keys & Webhooks</h2>
      <Button onClick={openApiModal}><Plus className="w-4 h-4 mr-2" /> Generate API Key</Button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Active API Keys</h3>
          </div>
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Token Prefix</th>
                <th className="px-4 py-3 font-medium">Last Used</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-4 font-medium">Production Primary</td>
                <td className="px-4 py-4 font-mono text-xs">pk_live_8f9a...</td>
                <td className="px-4 py-4">2 mins ago</td>
                <td className="px-4 py-4 text-right">
                  <Button variant="danger" className="px-2 py-1 text-xs">Revoke</Button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-medium">Staging Key</td>
                <td className="px-4 py-4 font-mono text-xs">pk_test_b2c1...</td>
                <td className="px-4 py-4">5 hours ago</td>
                <td className="px-4 py-4 text-right">
                  <Button variant="danger" className="px-2 py-1 text-xs">Revoke</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Webhooks</h3>
            <Button variant="outline" className="px-3 py-1.5 text-sm">Add Endpoint</Button>
          </div>
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Events</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-4 font-mono text-xs">https://api.acme.com/webhook</td>
                <td className="px-4 py-4"><Badge color="blue">customer.created</Badge></td>
                <td className="px-4 py-4"><Badge color="green">Healthy</Badge></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">API Performance</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Requests (24h)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1.4M</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Latency</p>
              <p className="text-2xl font-bold text-green-500">42ms</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">0.01%</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>
);

const Integrations = () => {
  const integrationsList = [
    { name: 'Stripe', desc: 'Billing and subscriptions', connected: true, icon: CreditCard },
    { name: 'Slack', desc: 'Notifications and alerts', connected: true, icon: CheckCircle2 },
    { name: 'AWS S3', desc: 'Object storage', connected: false, icon: Cloud },
    { name: 'GitHub', desc: 'Code syncing', connected: true, icon: GitMerge },
    { name: 'Datadog', desc: 'Monitoring and metrics', connected: false, icon: Activity },
    { name: 'Segment', desc: 'Customer data platform', connected: false, icon: Box },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrationsList.map((int, i) => (
          <Card key={i} className="p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <int.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              {int.connected ? <Badge color="green">Connected</Badge> : null}
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{int.name}</h3>
            <p className="text-sm text-gray-500 mb-6 flex-1">{int.desc}</p>
            {int.connected ? (
              <Button variant="outline" className="w-full">Configure</Button>
            ) : (
              <Button className="w-full">Connect</Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

const AuditLogs = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h2>
      <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
    </div>
    <Card>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input type="text" placeholder="Search logs..." className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none" />
        </div>
        <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm rounded-lg px-3 py-2">
          <option>All Actions</option>
          <option>Authentication</option>
          <option>Resource Changes</option>
        </select>
        <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm rounded-lg px-3 py-2">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      </div>
      <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-6 py-3 font-medium">Timestamp</th>
            <th className="px-6 py-3 font-medium">Action</th>
            <th className="px-6 py-3 font-medium">Actor</th>
            <th className="px-6 py-3 font-medium">Resource</th>
            <th className="px-6 py-3 font-medium">IP Address</th>
            <th className="px-6 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {AUDIT_LOGS.map(log => (
            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer">
              <td className="px-6 py-4 text-xs">{log.time}</td>
              <td className="px-6 py-4 font-mono text-xs font-semibold">{log.action}</td>
              <td className="px-6 py-4">{log.actor}</td>
              <td className="px-6 py-4 font-mono text-xs">{log.resource}</td>
              <td className="px-6 py-4 text-xs">{log.ip}</td>
              <td className="px-6 py-4">
                <Badge color={log.status === 'Success' ? 'green' : 'red'}>{log.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
);

const SecurityCenter = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security Center</h2>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 flex flex-col items-center justify-center text-center">
         <div className="relative w-32 h-32 mb-4 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-gray-200 dark:text-gray-700" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-green-500" strokeDasharray="96, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">96</span>
              <span className="text-xs text-gray-500">/100</span>
            </div>
         </div>
         <h3 className="font-bold text-gray-900 dark:text-white">Security Score</h3>
         <p className="text-sm text-gray-500 mt-1">Your organization security is excellent.</p>
      </Card>
      
      <div className="md:col-span-2 space-y-4">
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Lock className="w-6 h-6"/></div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Multi-Factor Authentication (MFA)</h4>
              <p className="text-sm text-gray-500">88% of users have MFA enabled.</p>
            </div>
          </div>
          <Button variant="outline">Enforce MFA</Button>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><ShieldCheck className="w-6 h-6"/></div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">Single Sign-On (SSO / SAML 2.0)</h4>
              <p className="text-sm text-gray-500">Configure identity providers like Okta, Azure AD.</p>
            </div>
          </div>
          <Button>Configure SSO</Button>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"><Server className="w-6 h-6"/></div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">IP Allowlisting</h4>
              <p className="text-sm text-gray-500">Restrict access to specific IP ranges.</p>
            </div>
          </div>
          <Button variant="outline">Manage IPs</Button>
        </Card>
      </div>
    </div>
  </div>
);

const Settings = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
    </div>
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-64">
        <nav className="flex flex-col gap-1">
          {['General', 'Organization', 'Authentication', 'Security', 'Notifications', 'Danger Zone'].map((item, i) => (
             <button key={i} className={`text-left px-4 py-2 rounded-lg text-sm font-medium ${i===0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
               {item}
             </button>
          ))}
        </nav>
      </div>
      <div className="flex-1 space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platform Name</label>
              <input type="text" defaultValue="Acme Global Enterprise" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Email</label>
              <input type="email" defaultValue="support@acme.com" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="pt-4">
              <Button>Save Changes</Button>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border-red-200 dark:border-red-900/50">
          <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2">Danger Zone</h3>
          <p className="text-sm text-gray-500 mb-4">Permanent actions that cannot be undone.</p>
          <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-lg bg-red-50/50 dark:bg-red-900/10">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Delete Workspace</h4>
              <p className="text-sm text-gray-500">Permanently delete this workspace and all data.</p>
            </div>
            <Button variant="danger">Delete Workspace</Button>
          </div>
        </Card>
      </div>
    </div>
  </div>
);

// --- MODALS ---

const CommandPalette = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input autoFocus type="text" placeholder="Search commands, tenants, settings..." className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500" />
          <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500 font-medium font-mono">ESC</div>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Navigation</div>
          {['Go to Dashboard', 'Manage Tenants', 'API Keys', 'Billing & Subscriptions'].map((item, i) => (
             <div key={i} className="px-4 py-3 flex items-center text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 cursor-pointer rounded-lg">
               <ArrowUpRight className="w-4 h-4 mr-3 opacity-50" />
               {item}
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CreateTenantModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Tenant</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization Name</label>
            <input type="text" placeholder="e.g. Wayne Enterprises" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subdomain</label>
             <div className="flex rounded-lg shadow-sm">
                <input type="text" placeholder="wayne" className="flex-1 px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                <span className="inline-flex items-center px-3 rounded-r-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 text-sm">.acme.com</span>
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Tier</label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
              <option>Starter</option>
              <option>Pro</option>
              <option>Enterprise</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Create Tenant</Button>
        </div>
      </Card>
    </div>
  );
};

const CreateApiKeyModal = ({ isOpen, onClose }) => {
  const [generated, setGenerated] = useState(false);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{generated ? 'API Key Created' : 'Create API Key'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-4 space-y-4">
          {!generated ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Name</label>
                <input type="text" placeholder="e.g. Production Mobile App" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Environment</label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Live</option>
                  <option>Test</option>
                </select>
              </div>
            </>
          ) : (
            <div className="space-y-4">
               <div className="p-3 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg text-sm flex items-start gap-2">
                 <AlertTriangle className="w-5 h-5 shrink-0" />
                 <p>Please copy this key now. For security reasons, you will not be able to see it again.</p>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Key</label>
                  <div className="flex gap-2">
                    <input type="text" readOnly value="sk_live_1a2b3c4d5e6f7g8h9i0j" className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm outline-none" />
                    <Button variant="outline"><Copy className="w-4 h-4" /></Button>
                  </div>
               </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          {!generated ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => setGenerated(true)}>Generate Key</Button>
            </>
          ) : (
            <Button onClick={onClose}>Done</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

// --- MAIN APP COMPONENT ---

export default function App() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [darkMode, setDarkMode] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [env, setEnv] = useState('Production');
  const [mode, setMode] = useState('Platform Admin');

  // Modals
  const [isTenantModalOpen, setTenantModalOpen] = useState(false);
  const [isApiModalOpen, setApiModalOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const NAV_ITEMS = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Tenants / Organizations', icon: Building2 },
    { name: 'Users & RBAC', icon: Users },
    { name: 'Subscriptions & Billing', icon: CreditCard },
    { name: 'Usage & Limits', icon: Activity },
    { name: 'API Keys & Webhooks', icon: Key },
    { name: 'Integrations', icon: Puzzle },
    { name: 'Audit Logs', icon: FileText },
    { name: 'Security Center', icon: ShieldAlert },
    { name: 'Settings', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview': return <Overview />;
      case 'Tenants / Organizations': return <Tenants openCreateModal={() => setTenantModalOpen(true)} />;
      case 'Users & RBAC': return <UsersRBAC />;
      case 'Subscriptions & Billing': return <Billing />;
      case 'API Keys & Webhooks': return <DeveloperPortal openApiModal={() => setApiModalOpen(true)} />;
      case 'Integrations': return <Integrations />;
      case 'Audit Logs': return <AuditLogs />;
      case 'Security Center': return <SecurityCenter />;
      case 'Settings': return <Settings />;
      default: return <div className="p-8 text-center text-gray-500">Coming soon...</div>;
    }
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${darkMode ? 'dark' : ''}`}>
      
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-500">
            <Command className="w-6 h-6" />
            NexusSaaS
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    active 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
              JS
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">John Smith</p>
              <p className="text-xs text-gray-500 truncate">john@nexus.app</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Bar */}
        <header className="h-16 flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-900 border border-transparent dark:border-gray-700 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-64"
            >
              <Search className="w-4 h-4" />
              <span>Search...</span>
              <span className="ml-auto flex items-center gap-1 text-xs font-mono">
                <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800">Ctrl</span>
                <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800">K</span>
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
              <button onClick={() => setEnv('Production')} className={`px-3 py-1 text-xs font-medium rounded-md ${env === 'Production' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Production</button>
              <button onClick={() => setEnv('Staging')} className={`px-3 py-1 text-xs font-medium rounded-md ${env === 'Staging' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Staging</button>
            </div>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-xs font-medium text-green-700 dark:text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                Connected
              </div>
            </div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-auto p-6 lg:p-8 text-gray-900 dark:text-gray-100">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>

      </main>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
      <CreateTenantModal isOpen={isTenantModalOpen} onClose={() => setTenantModalOpen(false)} />
      <CreateApiKeyModal isOpen={isApiModalOpen} onClose={() => setApiModalOpen(false)} />

    </div>
  );
}
