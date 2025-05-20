import { AdminUser, Role, SystemSetting, UserPerformanceMetrics, TeamMetrics, TaskMetrics } from '@/types/admin';
import { Project } from '@/types/project';
import { Task } from '@/types/task';
import { api } from '@/lib/api';
import { PaginatedResponse } from '@/types/common';

interface UserActivity {
  date: string;
  count: number;
}

interface CreateUserData {
  name: string;
  email: string;
  role: string;
  password?: string;
}

export const adminService = {
  // System Settings
  getSettings: async (params?: { page?: number; per_page?: number; category?: string }): Promise<PaginatedResponse<SystemSetting>> => {
    const response = await api.get<PaginatedResponse<SystemSetting>>('/admin/settings', { params });
    return response.data;
  },

  createSetting: async (setting: Omit<SystemSetting, 'id'>): Promise<SystemSetting> => {
    const response = await api.post<SystemSetting>('/admin/settings', setting);
    return response.data;
  },

  updateSetting: async (id: string, setting: Partial<SystemSetting>): Promise<SystemSetting> => {
    const response = await api.put<SystemSetting>(`/admin/settings/${id}`, setting);
    return response.data;
  },

  deleteSetting: async (id: string): Promise<void> => {
    await api.delete(`/admin/settings/${id}`);
  },

  // Users
  async getUsers(params?: { page?: number; per_page?: number; status?: string; role?: string }): Promise<PaginatedResponse<AdminUser>> {
    const response = await api.get<PaginatedResponse<AdminUser>>('/admin/users', { params });
    return response.data;
  },

  createUser: async (userData: CreateUserData): Promise<AdminUser> => {
    const response = await api.post<AdminUser>('/admin/users', userData);
    return response.data;
  },

  inviteUser: async (userData: Omit<CreateUserData, 'password'>): Promise<AdminUser> => {
    const response = await api.post<AdminUser>('/admin/users/invite', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<AdminUser>): Promise<AdminUser> => {
    const response = await api.put<AdminUser>(`/admin/users/${id}`, userData);
    return response.data;
  },

  updateUserRole: async (id: string, role: string): Promise<AdminUser> => {
    const response = await api.put<AdminUser>(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  updateUserStatus: async (id: string, status: 'active' | 'inactive'): Promise<AdminUser> => {
    const response = await api.put<AdminUser>(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  // Roles
  async getRoles(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<Role>> {
    const response = await api.get<PaginatedResponse<Role>>('/admin/roles', { params });
    return response.data;
  },

  createRole: async (role: Omit<Role, 'id' | 'userCount'>): Promise<Role> => {
    const response = await api.post<Role>('/admin/roles', role);
    return response.data;
  },

  updateRole: async (id: string, role: Partial<Role>): Promise<Role> => {
    const response = await api.put<Role>(`/admin/roles/${id}`, role);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`/admin/roles/${id}`);
  },

  // Projects
  async getProjects(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<Project>> {
    const response = await api.get<PaginatedResponse<Project>>('/admin/projects', { params });
    return response.data;
  },

  // Tasks
  async getTasks(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<Task>> {
    const response = await api.get<PaginatedResponse<Task>>('/admin/tasks', { params });
    return response.data;
  },

  // User Activity
  async getUserActivity(params?: { page?: number; per_page?: number }): Promise<PaginatedResponse<UserActivity>> {
    const response = await api.get<PaginatedResponse<UserActivity>>('/admin/analytics/user-activity', { params });
    return response.data;
  },

  async getUserPerformanceMetrics(userId: string, days: number = 30): Promise<UserPerformanceMetrics> {
    try {
      console.log('Fetching user performance metrics for:', userId);
      const [userResponse, metricsResponse] = await Promise.all([
        api.get<AdminUser>(`/admin/users/${userId}`),
        api.get<TaskMetrics>(`/tasks/metrics/user/${userId}?days=${days}`)
      ]);
      
      console.log('User response:', userResponse.data);
      console.log('Metrics response:', metricsResponse.data);
      if (metricsResponse.data) {
        console.log('Active Projects directly from metricsResponse.data:', metricsResponse.data.activeProjects);
      }

      const result: UserPerformanceMetrics = {
        userId: userResponse.data.id,
        userName: userResponse.data.name,
        metrics: {
          totalTasks: metricsResponse.data.totalTasks,
          completedTasks: metricsResponse.data.completedTasks,
          inProgressTasks: metricsResponse.data.inProgressTasks,
          todoTasks: metricsResponse.data.todoTasks,
          reviewTasks: metricsResponse.data.reviewTasks,
          overdueTasks: metricsResponse.data.overdueTasks,
          averageCompletionTime: metricsResponse.data.averageCompletionTime,
          taskVelocity: metricsResponse.data.taskVelocity,
          tasksByPriority: metricsResponse.data.tasksByPriority,
          taskStatusDistribution: metricsResponse.data.taskStatusDistribution,
          completionTrend: metricsResponse.data.completionTrend,
          activeTasks: metricsResponse.data.activeTasks,
          recentlyCompletedTasks: metricsResponse.data.recentlyCompletedTasks,
          lastActiveDate: metricsResponse.data.lastActiveDate,
          activeProjects: metricsResponse.data.activeProjects
        }
      };
      
      if (result.metrics) {
        console.log('Active Projects from constructed result.metrics:', result.metrics.activeProjects);
      }
      console.log('Combined metrics result:', result);
      return result;
    } catch (error) {
      console.error('Error in getUserPerformanceMetrics:', error);
      throw error;
    }
  },

  async getTeamMetrics(days: number = 30): Promise<TeamMetrics> {
    const response = await api.get<TeamMetrics>(`/tasks/metrics/team?days=${days}`);
    return response.data;
  },

  async getAllUserPerformanceMetrics(days: number = 30): Promise<UserPerformanceMetrics[]> {
    // Get all users first
    const usersResponse = await this.getUsers();
    
    // Then get metrics for each user
    const metrics = await Promise.all(
      usersResponse.items.map(user => 
        this.getUserPerformanceMetrics(user.id, days)
          .then(metrics => ({
            userId: user.id,
            userName: user.name,
            metrics
          }))
          .catch(() => null) // Handle errors gracefully
      )
    );

    // Filter out any failed requests
    return metrics.filter((m): m is UserPerformanceMetrics => m !== null);
  }
}; 