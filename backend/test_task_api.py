import requests
import json
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000/api/v1" # Adjust if your API prefix or port is different

# --- User Credentials (Modify as needed) ---
USER_EMAIL = f"testuser_{uuid.uuid4()}@example.com"
USER_PASSWORD = "testpassword123"
USER_NAME = "Test User"

# --- Global variables to store session data ---
access_token = None
refresh_token = None
current_user_id = None
project_id = None # Will be set after project creation
task_id = None    # Will be set after task creation

def print_response(message, response):
    print(f"--- {message} ---")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
    except requests.exceptions.JSONDecodeError:
        print(f"Response Text: {response.text}")
    print("-" * 30)
    return response.status_code, response.json() if response.ok and response.content else None

def register_user():
    global access_token, refresh_token, current_user_id
    payload = {
        "email": USER_EMAIL,
        "password": USER_PASSWORD,
        "name": USER_NAME
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    status_code, data = print_response("Register User", response)
    if status_code == 201 and data:
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        current_user_id = data.get("user", {}).get("id")
        if not access_token or not current_user_id:
            print("ERROR: Registration successful but token or user ID not found in response.")
            return False
        return True
    elif status_code == 409: # User might already exist if script run multiple times
        print("User might already exist, trying to login...")
        return login_user() # Attempt to login if registration fails due to existing user
    print(f"ERROR: User registration failed. Status: {status_code}")
    return False


def login_user():
    global access_token, refresh_token, current_user_id
    payload = {
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    status_code, data = print_response("Login User", response)
    if status_code == 200 and data:
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        current_user_id = data.get("user", {}).get("id")
        if not access_token or not current_user_id:
            print("ERROR: Login successful but token or user ID not found in response.")
            return False
        return True
    print(f"ERROR: User login failed. Status: {status_code}")
    return False

def create_project():
    global project_id
    if not access_token:
        print("ERROR: No access token. Please login first.")
        return False

    headers = {"Authorization": f"Bearer {access_token}"}
    start_date_str = datetime.now().strftime("%Y-%m-%d")
    end_date_str = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    payload = {
        "name": f"Test Project for Tasks - {uuid.uuid4()}",
        "description": "A project created via API script to test tasks.",
        "status": "planning",
        "priority": "medium",
        "start_date": start_date_str,
        "end_date": end_date_str, # Corrected from due_date to end_date
        "progress": 0
    }
    response = requests.post(f"{BASE_URL}/projects/", headers=headers, json=payload)
    status_code, data = print_response("Create Project", response)
    if status_code == 201 and data:
        project_id = data.get("id")
        if not project_id:
            print("ERROR: Project creation successful but project ID not found in response.")
            return False
        print(f"Project created with ID: {project_id}")
        return True
    print(f"ERROR: Project creation failed. Status: {status_code}")
    return False

def create_task_for_project():
    global task_id
    if not access_token or not project_id:
        print("ERROR: No access token or project_id. Please login and create a project first.")
        return False

    headers = {"Authorization": f"Bearer {access_token}"}
    due_date_str = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Get another user's ID for assignee (optional, assumes another user exists or uses current user)
    # For simplicity, this example doesn't create/fetch a second user for assignees.
    # You could add logic to register another user or use current_user_id if assignees are needed.
    assignee_ids_list = [] # Example: [current_user_id] or another valid user ID

    payload = {
        "title": "Test Task 1 via Script",
        "description": "This is a detailed description for the test task.",
        "status": "todo",
        "priority": "high",
        "task_type": "task",
        "due_date": due_date_str,
        # project_id is part of the URL, but our Pydantic model in TaskCreate expects it.
        # The route logic in routes.py handles setting it from the path.
        # However, the task_creation_model in routes.py now explicitly expects project_id.
        "project_id": project_id, # Ensure this is sent if your model expects it.
        "assignee_ids": assignee_ids_list,
        "depends_on_task_ids": [] # No dependencies for this first task
    }
    response = requests.post(f"{BASE_URL}/tasks/project/{project_id}/tasks/", headers=headers, json=payload)
    status_code, data = print_response("Create Task", response)
    if status_code == 201 and data:
        task_id = data.get("id")
        if not task_id:
            print("ERROR: Task creation successful but task ID not found.")
            return False
        print(f"Task created with ID: {task_id}")
        return True
    print(f"ERROR: Task creation failed. Status: {status_code}")
    return False

def get_task_details():
    if not access_token or not task_id:
        print("ERROR: No access token or task_id. Cannot get task.")
        return False
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/tasks/{task_id}", headers=headers)
    status_code, data = print_response(f"Get Task {task_id}", response)
    return status_code == 200

def list_tasks_for_project():
    if not access_token or not project_id:
        print("ERROR: No access token or project_id. Cannot list tasks.")
        return False
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/tasks/project/{project_id}/tasks/", headers=headers)
    status_code, data = print_response(f"List Tasks for Project {project_id}", response)
    if status_code == 200 and data is not None:
        print(f"Found {len(data)} tasks.")
        return True
    return False

def update_task_details():
    if not access_token or not task_id:
        print("ERROR: No access token or task_id. Cannot update task.")
        return False
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {
        "title": "Updated Test Task 1 via Script",
        "description": "Description has been updated.",
        "status": "in_progress",
        "priority": "medium"
    }
    response = requests.put(f"{BASE_URL}/tasks/{task_id}", headers=headers, json=payload)
    status_code, data = print_response(f"Update Task {task_id}", response)
    return status_code == 200

def delete_task_item():
    if not access_token or not task_id:
        print("ERROR: No access token or task_id. Cannot delete task.")
        return False
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.delete(f"{BASE_URL}/tasks/{task_id}", headers=headers)
    # No JSON response body for 204
    print(f"--- Delete Task {task_id} ---")
    print(f"Status Code: {response.status_code}")
    print(f"Response Text: {response.text}") # Should be empty on success
    print("-" * 30)
    return response.status_code == 204

def main():
    print("Starting API Test Script...")

    if not register_user(): # This will try login if registration fails with 409
        print("Failed to register or login user. Exiting.")
        return

    if not create_project():
        print("Failed to create project. Exiting.")
        return
    
    if not create_task_for_project():
        print("Failed to create task. Some subsequent tests might fail or be skipped.")
    else: # Only run these if task creation was successful
        get_task_details()
        update_task_details() # Test update
        get_task_details() # Get again to see changes

    list_tasks_for_project() # List all tasks for the project

    if task_id: # Only attempt delete if a task was created
      if delete_task_item():
          print(f"Task {task_id} deleted successfully.")
          get_task_details() # Try to get - should be 404
      else:
          print(f"Failed to delete task {task_id}.")

    print("API Test Script Finished.")

if __name__ == "__main__":
    main()