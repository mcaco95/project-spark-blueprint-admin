from flask import request, abort
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from http import HTTPStatus
import uuid
from typing import List

from backend.services.tasks import service as task_service
from backend.services.tasks import schemas as task_schemas
from backend.services.auth.schemas import UserPublic # For marshalling user details
from backend.services.projects.schemas import ProjectSimpleOutput # For marshalling project details
from backend.common.utils import pydantic_to_restx_marshallable # Added import
# Assuming UserSimplePublic is defined in auth.schemas and can be imported if needed for shared models
# from backend.services.auth.schemas import UserPublic # For typing current_user

# Define the namespace for tasks
tasks_ns = Namespace('tasks', description='Task related operations')

# --- Helper function to convert Pydantic model to Flask-RESTx compatible dict for marshalling ---
# Copied from project routes, ensure consistency or centralize this helper.
def pydantic_to_restx_marshallable(pydantic_obj, restx_model_fields):
    if pydantic_obj is None:
        return None
    response_data = {}
    if isinstance(pydantic_obj, list):
        return [pydantic_to_restx_marshallable(item, restx_model_fields) for item in pydantic_obj]

    obj_dict = pydantic_obj.model_dump(by_alias=True) if hasattr(pydantic_obj, 'model_dump') else pydantic_obj
    
    for key, field_type in restx_model_fields.items():
        if key in obj_dict:
            value = obj_dict[key]
            if isinstance(field_type, fields.Nested) and value is not None:
                nested_model_fields = field_type.model
                if isinstance(value, list):
                    response_data[key] = [pydantic_to_restx_marshallable(item, nested_model_fields) for item in value]
                else:
                    response_data[key] = pydantic_to_restx_marshallable(value, nested_model_fields)
            elif isinstance(field_type, fields.List) and isinstance(field_type.container, fields.Nested) and value is not None:
                nested_model_fields = field_type.container.model
                response_data[key] = [pydantic_to_restx_marshallable(item, nested_model_fields) for item in value]
            elif value is not None:
                response_data[key] = value
            elif hasattr(field_type, 'allow_null') and field_type.allow_null:
                 response_data[key] = None
    return response_data

# --- API Models for Tasks ---
user_simple_output_restx = tasks_ns.model('TaskUserSimpleOutput', {
    'id': fields.String(description='User ID'),
    'name': fields.String(description='User name', allow_null=True),
    'email': fields.String(description='User email')
})

project_simple_output_restx = tasks_ns.model('TaskProjectSimpleOutput', {
    'id': fields.String(description='Project ID'),
    'name': fields.String(description='Project name')
})

task_simple_output_restx = tasks_ns.model('TaskSimpleOutputRestx', {
    'id': fields.String(required=True, description='Task ID'),
    'title': fields.String(required=True, description='Task title'),
    'status': fields.String(required=True, enum=[e.value for e in task_schemas.TaskStatusEnum])
})

task_output_model = tasks_ns.model('TaskOutput', {
    'id': fields.String(required=True, description='Task ID'),
    'title': fields.String(required=True, description='Task title'),
    'description': fields.String(description='Task description', allow_null=True),
    'status': fields.String(required=True, enum=[e.value for e in task_schemas.TaskStatusEnum]),
    'priority': fields.String(enum=[e.value for e in task_schemas.TaskPriorityEnum], allow_null=True),
    'task_type': fields.String(required=True, enum=[e.value for e in task_schemas.TaskTypeEnum]),
    'due_date': fields.Date(allow_null=True),
    'start_date': fields.DateTime(allow_null=True),
    'end_date': fields.DateTime(allow_null=True),
    'duration_minutes': fields.Integer(allow_null=True),
    'project_id': fields.String(required=True, description='Parent Project ID'),
    'owner_id': fields.String(required=True, description='Task Owner ID'),
    'created_at': fields.DateTime(required=True),
    'updated_at': fields.DateTime(allow_null=True),
    'owner': fields.Nested(user_simple_output_restx, description='Task owner details'),
    'project': fields.Nested(project_simple_output_restx, description='Parent project details'),
    'assignees': fields.List(fields.Nested(user_simple_output_restx), description='List of assignees'),
    'dependencies': fields.List(fields.Nested(task_simple_output_restx), description='List of tasks this task depends on')
})

task_creation_model = tasks_ns.model('TaskCreationInput', {
    'title': fields.String(required=True, description='Task title', min_length=1, max_length=255),
    'description': fields.String(description='Task description', allow_null=True),
    'status': fields.String(enum=[e.value for e in task_schemas.TaskStatusEnum], default=task_schemas.TaskStatusEnum.todo.value),
    'priority': fields.String(enum=[e.value for e in task_schemas.TaskPriorityEnum], default=task_schemas.TaskPriorityEnum.medium.value, allow_null=True),
    'task_type': fields.String(enum=[e.value for e in task_schemas.TaskTypeEnum], default=task_schemas.TaskTypeEnum.task.value),
    'due_date': fields.Date(allow_null=True),
    'start_date': fields.DateTime(allow_null=True),
    'end_date': fields.DateTime(allow_null=True),
    'duration_minutes': fields.Integer(allow_null=True),
    'project_id': fields.String(required=True, description='Parent Project ID (UUID format)'),
    'assignee_ids': fields.List(fields.String, description='List of User IDs to assign to the task (UUID format)'),
    'depends_on_task_ids': fields.List(fields.String, description='List of Task IDs this task depends on (UUID format)'),
    'dependency_type_for_new': fields.String(enum=[e.value for e in task_schemas.DependencyTypeEnum], default=task_schemas.DependencyTypeEnum.finish_to_start.value, allow_null=True)
})

task_update_model = tasks_ns.model('TaskUpdateInput', {
    'title': fields.String(description='Task title', min_length=1, max_length=255, allow_null=True),
    'description': fields.String(description='Task description', allow_null=True),
    'status': fields.String(enum=[e.value for e in task_schemas.TaskStatusEnum], allow_null=True),
    'priority': fields.String(enum=[e.value for e in task_schemas.TaskPriorityEnum], allow_null=True),
    'task_type': fields.String(enum=[e.value for e in task_schemas.TaskTypeEnum], allow_null=True),
    'due_date': fields.Date(allow_null=True),
    'start_date': fields.DateTime(allow_null=True),
    'end_date': fields.DateTime(allow_null=True),
    'duration_minutes': fields.Integer(allow_null=True),
    'project_id': fields.String(description='Move task to different Project ID (UUID format)', allow_null=True),
    'assignee_ids': fields.List(fields.String, description='List of User IDs to assign (replaces current list)', allow_null=True),
    'depends_on_task_ids': fields.List(fields.String, description='List of Task IDs this task depends on (replaces current list)', allow_null=True),
    'dependency_type_for_new': fields.String(enum=[e.value for e in task_schemas.DependencyTypeEnum], allow_null=True)
})


# --- Task Routes ---
# Path for project-specific tasks: /projects/{project_id}/tasks
# This will be registered with the main app router with a prefix like /api/v1
# So, the effective path becomes /api/v1/projects/{project_id}/tasks
@tasks_ns.route('/project/<uuid:project_id>/tasks/') # Added trailing slash
@tasks_ns.param('project_id', 'The project identifier')
class ProjectTaskList(Resource):
    @jwt_required()
    @tasks_ns.marshal_list_with(task_output_model)
    def get(self, project_id: uuid.UUID):
        """List all tasks for a specific project."""
        current_user_id = uuid.UUID(get_jwt_identity())
        tasks_db = task_service.get_tasks_for_project(project_id=project_id, user_id=current_user_id)
        tasks_public = [task_schemas.TaskPublic.from_orm(t) for t in tasks_db]
        return [pydantic_to_restx_marshallable(t_pub, task_output_model) for t_pub in tasks_public], HTTPStatus.OK

    @jwt_required()
    @tasks_ns.expect(task_creation_model, validate=True)
    @tasks_ns.marshal_with(task_output_model, code=HTTPStatus.CREATED)
    def post(self, project_id: uuid.UUID):
        """Create a new task for a specific project."""
        current_user_id = uuid.UUID(get_jwt_identity())
        
        raw_data = request.json
        # Add project_id from path to the data for Pydantic model
        raw_data['project_id'] = str(project_id)

        try:
            task_in = task_schemas.TaskCreate(**raw_data)
        except Exception as e: # Pydantic validation error
            abort(HTTPStatus.BAD_REQUEST, f"Input payload validation failed: {str(e)}")

        try:
            created_task_db = task_service.create_task(task_create_data=task_in, owner_id=current_user_id)
            task_public = task_schemas.TaskPublic.from_orm(created_task_db)
            return pydantic_to_restx_marshallable(task_public, task_output_model), HTTPStatus.CREATED
        except ValueError as e: 
            abort(HTTPStatus.BAD_REQUEST, str(e))
        except Exception as e:
            abort(HTTPStatus.INTERNAL_SERVER_ERROR, f"Could not create task: {str(e)}")

# Path for general task operations: /tasks/{task_id}
# Registered with main app as /api/v1/tasks/{task_id}
@tasks_ns.route('/<uuid:task_id>') # Removed trailing slash if not desired for specific task ops
@tasks_ns.param('task_id', 'The task identifier')
@tasks_ns.response(HTTPStatus.NOT_FOUND, 'Task not found or no access.')
@tasks_ns.response(HTTPStatus.UNAUTHORIZED, 'Authentication required.')
class TaskDetail(Resource):
    @jwt_required()
    @tasks_ns.marshal_with(task_output_model)
    def get(self, task_id: uuid.UUID):
        """Get a specific task by ID."""
        current_user_id = uuid.UUID(get_jwt_identity())
        task_db = task_service.get_task_by_id(task_id=task_id, user_id=current_user_id)
        if not task_db:
            abort(HTTPStatus.NOT_FOUND, "Task not found or no access.")
        task_public = task_schemas.TaskPublic.from_orm(task_db)
        return pydantic_to_restx_marshallable(task_public, task_output_model), HTTPStatus.OK

    @jwt_required()
    @tasks_ns.expect(task_update_model, validate=True)
    @tasks_ns.marshal_with(task_output_model)
    def put(self, task_id: uuid.UUID):
        """Update an existing task."""
        current_user_id = uuid.UUID(get_jwt_identity())
        try:
            task_in = task_schemas.TaskUpdate(**request.json)
        except Exception as e: 
            abort(HTTPStatus.BAD_REQUEST, f"Input payload validation failed: {str(e)}")
        
        try:
            updated_task_db = task_service.update_task(task_id=task_id, task_update_data=task_in, user_id=current_user_id)
            if not updated_task_db:
                abort(HTTPStatus.NOT_FOUND, "Task not found or user not authorized to update.")
            task_public = task_schemas.TaskPublic.from_orm(updated_task_db)
            return pydantic_to_restx_marshallable(task_public, task_output_model), HTTPStatus.OK
        except ValueError as e:
            abort(HTTPStatus.BAD_REQUEST, str(e))
        except Exception as e:
            abort(HTTPStatus.INTERNAL_SERVER_ERROR, f"Could not update task: {str(e)}")

    @jwt_required()
    @tasks_ns.response(HTTPStatus.NO_CONTENT, 'Task deleted successfully.')
    @tasks_ns.response(HTTPStatus.FORBIDDEN, 'Not authorized to delete this task.')
    def delete(self, task_id: uuid.UUID):
        """Delete a task."""
        current_user_id = uuid.UUID(get_jwt_identity())
        
        deleted = task_service.delete_task(task_id=task_id, user_id=current_user_id)
        if not deleted:
            abort(HTTPStatus.NOT_FOUND, "Task not found or user not authorized to delete.")
        return '', HTTPStatus.NO_CONTENT

# The main application (e.g., in app.py or main.py) will need to include this namespace:
# from backend.services.tasks.routes import tasks_ns
# api.add_namespace(tasks_ns, path=f'{settings.API_V1_STR}/tasks') 
# Note: The project-specific task routes are defined within the same 'tasks_ns' but with a more specific path.
# Flask-RESTx handles merging routes under the same namespace.
# If distinct prefixes like '/tasks' and '/projects/{id}/tasks' are hard to manage under one NS,
# two namespaces might be cleaner as originally thought.
# For now, this uses one NS and relies on distinct route paths.
# If using `tasks_ns.route('/project/<uuid:project_id>/tasks')` and `tasks_ns.route('/<uuid:task_id>')`
# they will be prefixed by the `tasks_ns` prefix, e.g., `/api/v1/tasks/project/...` and `/api/v1/tasks/...`