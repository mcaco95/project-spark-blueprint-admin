import requests
import random
import string
import json
import os
import sys
from datetime import datetime
from typing import Dict, Optional

BASE_URL = "http://localhost:5000/v1"  # Adjust if your server runs on a different port
ADMIN_CREDENTIALS = {
    "email": "simon@elderbalm.com",
    "password": "123456"
}
TEST_STATUS_FILE = "test_status.json"

class AdminAPITester:
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.base_url = BASE_URL
        self.test_status = self.load_test_status()
        
    def load_test_status(self) -> Dict[str, bool]:
        """Load test status from file if it exists"""
        if os.path.exists(TEST_STATUS_FILE):
            try:
                with open(TEST_STATUS_FILE, 'r') as f:
                    data = json.load(f)
                    # Load access token if available
                    self.access_token = data.get('access_token')
                    self.refresh_token = data.get('refresh_token')
                    # Return just the test status part
                    return data.get('test_status', {
                        "login": False,
                        "user_management": False,
                        "role_management": False,
                        "system_settings": False
                    })
            except:
                pass
        return {
            "login": False,
            "user_management": False,
            "role_management": False,
            "system_settings": False
        }

    def save_test_status(self):
        """Save test status and tokens to file"""
        data = {
            'test_status': self.test_status,
            'access_token': self.access_token,
            'refresh_token': self.refresh_token
        }
        with open(TEST_STATUS_FILE, 'w') as f:
            json.dump(data, f)

    def reset_test_status(self):
        """Reset all test status and tokens"""
        self.test_status = {
            "login": False,
            "user_management": False,
            "role_management": False,
            "system_settings": False
        }
        self.access_token = None
        self.refresh_token = None
        if os.path.exists(TEST_STATUS_FILE):
            os.remove(TEST_STATUS_FILE)

    def _get_headers(self) -> Dict[str, str]:
        """Get headers with authorization token"""
        if not self.access_token:
            raise ValueError("Not authenticated. Call login() first.")
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    def login(self) -> bool:
        """Login as admin and get access token"""
        # Always perform login if we don't have an access token
        if not self.access_token:
            print("🔄 No valid access token found, logging in...")
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=ADMIN_CREDENTIALS
            )
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.refresh_token = data.get("refresh_token")
                print("✅ Login successful")
                self.test_status["login"] = True
                self.save_test_status()
                return True
            print("❌ Login failed:", response.text)
            return False
        else:
            print("✅ Using existing access token")
            return True

    def test_user_management(self):
        """Test user management APIs"""
        if self.test_status.get("user_management_list"):
            print("✅ User listing already tested, skipping...")
        else:
            print("\n🔍 Testing User Management APIs...")
            # List users
            response = requests.get(
                f"{self.base_url}/admin/users",
                headers=self._get_headers(),
                params={"page": 1, "per_page": 10}
            )
            assert response.status_code == 200, f"Failed to list users: {response.text}"
            print("✅ List users successful")
            self.test_status["user_management_list"] = True
            self.save_test_status()

        if self.test_status.get("user_management_create"):
            print("✅ User creation already tested, skipping...")
        else:
            # Create a test user
            test_user = {
                "email": f"test_{random.randint(1000, 9999)}@example.com",
                "name": "Test User",
                "password": "test123!",
                "role": "member",
                "status": "active",
                "language": "en"  # Adding required language field
            }
            response = requests.post(
                f"{self.base_url}/admin/users",
                headers=self._get_headers(),
                json=test_user
            )
            assert response.status_code == 201, f"Failed to create user: {response.text}"
            user_id = response.json()["id"]
            print("✅ Create user successful")
            self.test_status["user_management_create"] = True
            self.test_status["last_created_user_id"] = user_id
            self.save_test_status()

        if self.test_status.get("user_management_update"):
            print("✅ User update already tested, skipping...")
        else:
            # Update user
            user_id = self.test_status.get("last_created_user_id")
            if not user_id:
                print("❌ No user ID found for update test")
                return
            
            update_data = {
                "name": "Updated Test User",
                "status": "inactive"
            }
            response = requests.put(
                f"{self.base_url}/admin/users/{user_id}",
                headers=self._get_headers(),
                json=update_data
            )
            assert response.status_code == 200, f"Failed to update user: {response.text}"
            print("✅ Update user successful")
            self.test_status["user_management_update"] = True
            self.save_test_status()

        if self.test_status.get("user_management_get"):
            print("✅ User details already tested, skipping...")
        else:
            # Get user details
            user_id = self.test_status.get("last_created_user_id")
            if not user_id:
                print("❌ No user ID found for get details test")
                return
            
            response = requests.get(
                f"{self.base_url}/admin/users/{user_id}",
                headers=self._get_headers()
            )
            assert response.status_code == 200, f"Failed to get user details: {response.text}"
            assert response.json()["name"] == "Updated Test User", "User update not reflected"
            print("✅ Get user details successful")
            self.test_status["user_management_get"] = True
            self.test_status["user_management"] = True
            self.save_test_status()

    def test_role_management(self):
        """Test role management APIs"""
        if self.test_status.get("role_management_list"):
            print("✅ Role listing already tested, skipping...")
        else:
            print("\n🔍 Testing Role Management APIs...")
            # List roles
            response = requests.get(
                f"{self.base_url}/admin/roles",
                headers=self._get_headers(),
                params={"page": 1, "per_page": 10}
            )
            assert response.status_code == 200, f"Failed to list roles: {response.text}"
            print("✅ List roles successful")
            self.test_status["role_management_list"] = True
            self.save_test_status()

        if self.test_status.get("role_management_create"):
            print("✅ Role creation already tested, skipping...")
        else:
            # Create a test role
            test_role = {
                "name": f"test_role_{random.randint(1000, 9999)}",
                "description": "Test role description",
                "permissions": ["read:users", "write:users"]
            }
            response = requests.post(
                f"{self.base_url}/admin/roles",
                headers=self._get_headers(),
                json=test_role
            )
            assert response.status_code == 201, f"Failed to create role: {response.text}"
            role_id = response.json()["id"]
            print("✅ Create role successful")
            self.test_status["role_management_create"] = True
            self.test_status["last_created_role_id"] = role_id
            self.save_test_status()

        if self.test_status.get("role_management_update"):
            print("✅ Role update already tested, skipping...")
        else:
            # Update role
            role_id = self.test_status.get("last_created_role_id")
            if not role_id:
                print("❌ No role ID found for update test")
                return
            
            update_data = {
                "description": "Updated test role description",
                "permissions": ["read:users", "write:users", "delete:users"]
            }
            response = requests.put(
                f"{self.base_url}/admin/roles/{role_id}",
                headers=self._get_headers(),
                json=update_data
            )
            assert response.status_code == 200, f"Failed to update role: {response.text}"
            print("✅ Update role successful")
            self.test_status["role_management_update"] = True
            self.save_test_status()

        if self.test_status.get("role_management_get"):
            print("✅ Role details already tested, skipping...")
        else:
            # Get role details
            role_id = self.test_status.get("last_created_role_id")
            if not role_id:
                print("❌ No role ID found for get details test")
                return
            
            response = requests.get(
                f"{self.base_url}/admin/roles/{role_id}",
                headers=self._get_headers()
            )
            assert response.status_code == 200, f"Failed to get role details: {response.text}"
            assert response.json()["description"] == "Updated test role description", "Role update not reflected"
            print("✅ Get role details successful")
            self.test_status["role_management_get"] = True
            self.test_status["role_management"] = True
            self.save_test_status()

    def test_system_settings(self):
        """Test system settings APIs"""
        if self.test_status["system_settings"]:
            print("✅ System Settings tests already successful, skipping...")
            return

        print("\n🔍 Testing System Settings APIs...")

        # List settings
        response = requests.get(
            f"{self.base_url}/admin/settings",
            headers=self._get_headers(),
            params={"page": 1, "per_page": 10}
        )
        assert response.status_code == 200, f"Failed to list settings: {response.text}"
        print("✅ List settings successful")

        # Create test settings
        test_settings = [
            {
                "name": f"test_string_setting_{random.randint(1000, 9999)}",
                "value": "test value",
                "type": "string",
                "description": "Test string setting",
                "category": "test"
            },
            {
                "name": f"test_boolean_setting_{random.randint(1000, 9999)}",
                "value": True,  # Using Python's True, which will be serialized to JSON's true
                "type": "boolean",
                "description": "Test boolean setting",
                "category": "test"
            },
            {
                "name": f"test_number_setting_{random.randint(1000, 9999)}",
                "value": 42,  # Using an integer
                "type": "number",
                "description": "Test number setting",
                "category": "test"
            }
        ]

        created_settings = []
        for setting in test_settings:
            response = requests.post(
                f"{self.base_url}/admin/settings",
                headers=self._get_headers(),
                json=setting
            )
            assert response.status_code == 201, f"Failed to create setting: {response.text}"
            created_settings.append(response.json())
            print(f"✅ Create {setting['type']} setting successful")

        # Update settings
        for setting in created_settings:
            print(f"\nUpdating {setting['type']} setting...")
            
            # Prepare update data based on type
            update_data = {
                "description": f"Updated {setting['type']} setting"
            }
            
            # Set the value based on the setting type
            setting_type = setting["type"].replace("SettingTypeEnum.", "")  # Remove the enum prefix
            if setting_type == "string":
                update_data["value"] = "updated value"
            elif setting_type == "boolean":
                update_data["value"] = False  # Using Python's False
                print(f"Sending boolean update with value: {update_data['value']} (type: {type(update_data['value'])})")
            elif setting_type == "number":
                update_data["value"] = 99
            
            print(f"Update request data: {update_data}")
            
            response = requests.put(
                f"{self.base_url}/admin/settings/{setting['id']}",
                headers=self._get_headers(),
                json=update_data
            )
            assert response.status_code == 200, f"Failed to update setting: {response.text}"
            print(f"Update response: {response.text}")
            print(f"✅ Update {setting['type']} setting successful")

            # Verify update
            response = requests.get(
                f"{self.base_url}/admin/settings/{setting['id']}",
                headers=self._get_headers()
            )
            assert response.status_code == 200, f"Failed to get setting details: {response.text}"
            updated_setting = response.json()
            print(f"Get response after update: {updated_setting}")
            
            # Compare values based on type
            setting_type = updated_setting["type"].replace("SettingTypeEnum.", "")  # Remove the enum prefix
            if setting_type == "string":
                assert str(updated_setting["value"]) == "updated value", f"Setting update not reflected for {setting['type']}"
            elif setting_type == "boolean":
                # API returns boolean values directly
                expected = False  # We always update to False
                actual = updated_setting["value"]  # API response is already a Python boolean
                print(f"\nBoolean comparison:")
                print(f"Expected: {expected} ({type(expected)})")
                print(f"Actual: {actual} ({type(actual)})")
                assert isinstance(actual, bool), f"Expected boolean type but got {type(actual)}"
                assert actual == expected, f"Setting update not reflected for {setting['type']}, expected {expected} but got {actual}"
            elif setting_type == "number":
                assert float(updated_setting["value"]) == 99, f"Setting update not reflected for {setting['type']}"
            
            print(f"✅ Verify {setting['type']} setting update successful")

        self.test_status["system_settings"] = True

    def stress_test(self, num_requests: int = 50):
        """Perform stress testing on the APIs"""
        print(f"\n🔨 Performing stress test with {num_requests} requests...")

        # Stress test user listing with different page sizes
        print("\nStress testing user listing...")
        for i in range(num_requests):
            per_page = random.randint(5, 50)
            response = requests.get(
                f"{self.base_url}/admin/users",
                headers=self._get_headers(),
                params={"page": 1, "per_page": per_page}
            )
            assert response.status_code == 200, f"Failed stress test on user listing: {response.text}"
            if (i + 1) % 10 == 0:
                print(f"✅ Completed {i + 1} requests")

        # Stress test settings with concurrent reads/writes
        print("\nStress testing settings API...")
        settings_data = {
            "name": f"stress_test_{random.randint(1000, 9999)}",
            "value": "test",  # Using a string value
            "type": "string",
            "description": "Stress test setting",
            "category": "stress_test"
        }

        # Create a setting and update it multiple times
        response = requests.post(
            f"{self.base_url}/admin/settings",
            headers=self._get_headers(),
            json=settings_data
        )
        assert response.status_code == 201, f"Failed to create stress test setting: {response.text}"
        setting_id = response.json()["id"]

        for i in range(num_requests):
            # Alternate between read and write operations
            if i % 2 == 0:
                response = requests.get(
                    f"{self.base_url}/admin/settings/{setting_id}",
                    headers=self._get_headers()
                )
            else:
                update_data = {
                    "value": f"stress_value_{i}",  # Using a string value
                    "description": f"Stress test update {i}"
                }
                response = requests.put(
                    f"{self.base_url}/admin/settings/{setting_id}",
                    headers=self._get_headers(),
                    json=update_data
                )
            assert response.status_code in [200, 201], f"Failed stress test on settings API: {response.text}"
            if (i + 1) % 10 == 0:
                print(f"✅ Completed {i + 1} requests")

        print("✅ Stress testing completed successfully")

def main():
    tester = AdminAPITester()
    
    # Check for --reset flag
    if "--reset" in sys.argv:
        print("🔄 Resetting test status...")
        tester.reset_test_status()
    
    # Login first
    if not tester.login():
        print("❌ Failed to login. Exiting...")
        return

    try:
        # Run all tests
        tester.test_user_management()
        tester.test_role_management()
        tester.test_system_settings()
        tester.stress_test()
        print("\n✅ All tests completed successfully!")
    except AssertionError as e:
        print(f"\n❌ Test failed: {str(e)}")
        # Save progress up to the failure point
        tester.save_test_status()
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        # Save progress up to the failure point
        tester.save_test_status()

if __name__ == "__main__":
    main() 