
import { UserRole } from './auth';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export interface SystemSetting {
  id: string;
  name: string;
  value: string | boolean | number;
  type: 'string' | 'boolean' | 'number';
  description: string;
  category: string;
}

export interface MetricData {
  label: string;
  value: number;
}

export interface ChartData {
  name: string;
  value: number;
}
