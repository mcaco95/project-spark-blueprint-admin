from flask import request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from http import HTTPStatus

from services.auth.routes import admin_required, error_response_model
from services.projects import service as project_service
from services.tasks import service as task_service
from services.auth import service as auth_service

# Define the namespace for admin metrics
admin_projects_ns = Namespace('admin/projects', description='Admin Project Management operations')
admin_tasks_ns = Namespace('admin/tasks', description='Admin Task Management operations')
admin_analytics_ns = Namespace('admin/analytics', description='Admin Analytics operations')

# Flask-RESTX Models for Admin Project Management
admin_project_view_model = admin_projects_ns.model('AdminProjectView', {
    'id': fields.String(required=True, description='Project ID'),
    'name': fields.String(required=True, description='Project name'),
    'description': fields.String(description='Project description'),
    'status': fields.String(required=True, description='Project status'),
    'priority': fields.String(required=True, description='Project priority'),
    'progress': fields.Integer(required=True, description='Project progress'),
    'owner_id': fields.String(required=True, description='Project owner ID'),
    'created_at': fields.DateTime(required=True, description='Creation timestamp'),
    'updated_at': fields.DateTime(required=True, description='Last update timestamp')
})

admin_project_list_response_model = admin_projects_ns.model('AdminProjectListResponse', {
    'items': fields.List(fields.Nested(admin_project_view_model)),
    'total': fields.Integer(description='Total number of projects'),
    'page': fields.Integer(description='Current page number'),
    'per_page': fields.Integer(description='Number of projects per page')
})

# Flask-RESTX Models for Admin Task Management
admin_task_view_model = admin_tasks_ns.model('AdminTaskView', {
    'id': fields.String(required=True, description='Task ID'),
    'title': fields.String(required=True, description='Task title'),
    'description': fields.String(description='Task description'),
    'status': fields.String(required=True, description='Task status'),
    'priority': fields.String(required=True, description='Task priority'),
    'project_id': fields.String(required=True, description='Project ID'),
    'owner_id': fields.String(required=True, description='Task owner ID'),
    'created_at': fields.DateTime(required=True, description='Creation timestamp'),
    'updated_at': fields.DateTime(required=True, description='Last update timestamp'),
    'due_date': fields.DateTime(description='Due date')
})

admin_task_list_response_model = admin_tasks_ns.model('AdminTaskListResponse', {
    'items': fields.List(fields.Nested(admin_task_view_model)),
    'total': fields.Integer(description='Total number of tasks'),
    'page': fields.Integer(description='Current page number'),
    'per_page': fields.Integer(description='Number of tasks per page')
})

# Flask-RESTX Models for Admin Analytics
user_activity_model = admin_analytics_ns.model('UserActivity', {
    'date': fields.String(required=True, description='Activity date'),
    'count': fields.Integer(required=True, description='Activity count')
})

user_activity_list_response_model = admin_analytics_ns.model('UserActivityListResponse', {
    'items': fields.List(fields.Nested(user_activity_model)),
    'total': fields.Integer(description='Total number of activity records'),
    'page': fields.Integer(description='Current page number'),
    'per_page': fields.Integer(description='Number of records per page')
})

@admin_projects_ns.route('')
class AdminProjectList(Resource):
    @admin_projects_ns.doc('list_admin_projects', security='BearerAuth')
    @admin_projects_ns.marshal_with(admin_project_list_response_model)
    @admin_projects_ns.param('page', 'Page number', type=int, default=1)
    @admin_projects_ns.param('per_page', 'Projects per page', type=int, default=10)
    @admin_projects_ns.param('status', 'Filter by status', type=str)
    @admin_projects_ns.param('sort_by', 'Field to sort by', type=str, default='created_at')
    @admin_projects_ns.param('sort_order', 'Sort order (asc, desc)', type=str, default='desc')
    @admin_required
    def get(self):
        """List and filter projects (Admin)"""
        args = request.args
        page = args.get('page', 1, type=int)
        per_page = args.get('per_page', 10, type=int)
        status = args.get('status', type=str)
        sort_by = args.get('sort_by', 'created_at', type=str)
        sort_order = args.get('sort_order', 'desc', type=str)

        projects_page = project_service.get_projects_paginated(
            page=page, per_page=per_page, status=status,
            sort_by=sort_by, sort_order=sort_order
        )
        
        return {
            'items': projects_page.items,
            'total': projects_page.total,
            'page': projects_page.page,
            'per_page': projects_page.per_page
        }

@admin_tasks_ns.route('')
class AdminTaskList(Resource):
    @admin_tasks_ns.doc('list_admin_tasks', security='BearerAuth')
    @admin_tasks_ns.marshal_with(admin_task_list_response_model)
    @admin_tasks_ns.param('page', 'Page number', type=int, default=1)
    @admin_tasks_ns.param('per_page', 'Tasks per page', type=int, default=10)
    @admin_tasks_ns.param('status', 'Filter by status', type=str)
    @admin_tasks_ns.param('sort_by', 'Field to sort by', type=str, default='created_at')
    @admin_tasks_ns.param('sort_order', 'Sort order (asc, desc)', type=str, default='desc')
    @admin_required
    def get(self):
        """List and filter tasks (Admin)"""
        args = request.args
        page = args.get('page', 1, type=int)
        per_page = args.get('per_page', 10, type=int)
        status = args.get('status', type=str)
        sort_by = args.get('sort_by', 'created_at', type=str)
        sort_order = args.get('sort_order', 'desc', type=str)

        tasks_page = task_service.get_tasks_paginated(
            page=page, per_page=per_page, status=status,
            sort_by=sort_by, sort_order=sort_order
        )
        
        return {
            'items': tasks_page.items,
            'total': tasks_page.total,
            'page': tasks_page.page,
            'per_page': tasks_page.per_page
        }

@admin_analytics_ns.route('/user-activity')
class UserActivityList(Resource):
    @admin_analytics_ns.doc('list_user_activity', security='BearerAuth')
    @admin_analytics_ns.marshal_with(user_activity_list_response_model)
    @admin_analytics_ns.param('days', 'Number of days to look back', type=int, default=30)
    @admin_required
    def get(self):
        """Get user activity data (Admin)"""
        args = request.args
        days = args.get('days', 30, type=int)

        activity_data = auth_service.get_user_activity(days=days)
        
        return {
            'items': activity_data.items,
            'total': activity_data.total,
            'page': 1,
            'per_page': len(activity_data.items)
        } 