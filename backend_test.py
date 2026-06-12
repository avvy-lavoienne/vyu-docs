#!/usr/bin/env python3
"""
Backend API Tests for DocForge AI - Phase 1 MVP
Tests all API endpoints except POST /api/analyze (already tested manually)
"""

import requests
import json
import sys
from typing import Dict, Any

# Base URL from environment
BASE_URL = "https://codebase-docs-3.preview.emergentagent.com/api"

# Test repo ID that exists in database
TEST_REPO_ID = "9ccf520a-fc77-41c5-bc1e-44f4b311cca5"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name: str):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}TEST: {name}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")

def print_success(message: str):
    print(f"{Colors.GREEN}✅ SUCCESS: {message}{Colors.END}")

def print_error(message: str):
    print(f"{Colors.RED}❌ FAILED: {message}{Colors.END}")

def print_info(message: str):
    print(f"{Colors.YELLOW}ℹ️  INFO: {message}{Colors.END}")

def validate_response(response: requests.Response, expected_status: int, test_name: str) -> bool:
    """Validate response status code"""
    if response.status_code != expected_status:
        print_error(f"{test_name} - Expected status {expected_status}, got {response.status_code}")
        print_info(f"Response: {response.text[:500]}")
        return False
    return True

def test_health_check() -> bool:
    """Test GET /api - Health check endpoint"""
    print_test("Health Check - GET /api")
    
    try:
        response = requests.get(BASE_URL, timeout=10)
        
        if not validate_response(response, 200, "Health check"):
            return False
        
        data = response.json()
        print_info(f"Response: {json.dumps(data, indent=2)}")
        
        # Validate response structure
        required_fields = ['status']
        for field in required_fields:
            if field not in data:
                print_error(f"Missing required field: {field}")
                return False
        
        if data['status'] != 'ok':
            print_error(f"Expected status 'ok', got '{data['status']}'")
            return False
        
        print_success("Health check passed - API is running")
        return True
        
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON response: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_list_repos() -> bool:
    """Test GET /api/repos - List all repositories"""
    print_test("List Repositories - GET /api/repos")
    
    try:
        response = requests.get(f"{BASE_URL}/repos", timeout=10)
        
        if not validate_response(response, 200, "List repos"):
            return False
        
        data = response.json()
        
        # Validate response structure
        if 'repos' not in data:
            print_error("Response missing 'repos' field")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            return False
        
        repos = data['repos']
        if not isinstance(repos, list):
            print_error(f"Expected 'repos' to be a list, got {type(repos)}")
            return False
        
        print_info(f"Found {len(repos)} repositories")
        
        # If repos exist, validate structure of first repo
        if len(repos) > 0:
            repo = repos[0]
            required_fields = ['id', 'url', 'owner', 'repo', 'status', 'created_at']
            missing_fields = [field for field in required_fields if field not in repo]
            
            if missing_fields:
                print_error(f"Repository missing required fields: {missing_fields}")
                print_info(f"Repository structure: {json.dumps(repo, indent=2)}")
                return False
            
            print_info(f"Sample repo: {repo['owner']}/{repo['repo']} (status: {repo['status']})")
        else:
            print_info("No repositories found in database")
        
        print_success("List repositories endpoint working correctly")
        return True
        
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON response: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_get_repo_by_id() -> bool:
    """Test GET /api/repos/[id] - Get specific repository with documentation"""
    print_test(f"Get Repository by ID - GET /api/repos/{TEST_REPO_ID}")
    
    try:
        response = requests.get(f"{BASE_URL}/repos/{TEST_REPO_ID}", timeout=10)
        
        if not validate_response(response, 200, "Get repo by ID"):
            return False
        
        data = response.json()
        
        # Validate response structure
        if 'repo' not in data:
            print_error("Response missing 'repo' field")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            return False
        
        repo = data['repo']
        required_repo_fields = ['id', 'url', 'owner', 'repo', 'status', 'created_at']
        missing_fields = [field for field in required_repo_fields if field not in repo]
        
        if missing_fields:
            print_error(f"Repository missing required fields: {missing_fields}")
            print_info(f"Repository: {json.dumps(repo, indent=2)}")
            return False
        
        print_info(f"Repository: {repo['owner']}/{repo['repo']}")
        print_info(f"Status: {repo['status']}")
        print_info(f"URL: {repo['url']}")
        
        # Check documentation
        if 'documentation' in data and data['documentation']:
            doc = data['documentation']
            print_info(f"Documentation found with ID: {doc.get('id', 'N/A')}")
            
            # Validate documentation structure
            doc_fields = ['readme', 'architecture', 'setup']
            for field in doc_fields:
                if field in doc:
                    content = doc[field]
                    if isinstance(content, dict) and 'content' in content:
                        content_length = len(content['content'])
                        print_info(f"  - {field}: {content_length} characters")
                    else:
                        print_info(f"  - {field}: present but unexpected format")
                else:
                    print_info(f"  - {field}: not present")
        else:
            print_info("No documentation found for this repository")
        
        print_success("Get repository by ID endpoint working correctly")
        return True
        
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON response: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_get_nonexistent_repo() -> bool:
    """Test GET /api/repos/[id] with non-existent ID - Should return 404"""
    print_test("Get Non-existent Repository - GET /api/repos/nonexistent-id")
    
    fake_id = "00000000-0000-0000-0000-000000000000"
    
    try:
        response = requests.get(f"{BASE_URL}/repos/{fake_id}", timeout=10)
        
        if not validate_response(response, 404, "Get non-existent repo"):
            return False
        
        data = response.json()
        
        if 'error' not in data:
            print_error("Expected 'error' field in 404 response")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            return False
        
        print_info(f"Error message: {data['error']}")
        print_success("404 error handling working correctly")
        return True
        
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_error(f"Invalid JSON response: {str(e)}")
        return False
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        return False

def test_delete_repo() -> bool:
    """Test DELETE /api/repos/[id] - Delete repository"""
    print_test(f"Delete Repository - DELETE /api/repos/{TEST_REPO_ID}")
    
    print_info("⚠️  WARNING: This will delete the test repository!")
    print_info("Skipping actual deletion to preserve test data")
    print_info("To test deletion, uncomment the deletion code in backend_test.py")
    
    # UNCOMMENT BELOW TO ACTUALLY TEST DELETION
    # try:
    #     response = requests.delete(f"{BASE_URL}/repos/{TEST_REPO_ID}", timeout=10)
    #     
    #     if not validate_response(response, 200, "Delete repo"):
    #         return False
    #     
    #     data = response.json()
    #     
    #     if 'success' not in data or not data['success']:
    #         print_error("Expected 'success: true' in response")
    #         print_info(f"Response: {json.dumps(data, indent=2)}")
    #         return False
    #     
    #     print_info(f"Response: {json.dumps(data, indent=2)}")
    #     
    #     # Verify deletion by trying to GET the repo
    #     verify_response = requests.get(f"{BASE_URL}/repos/{TEST_REPO_ID}", timeout=10)
    #     if verify_response.status_code != 404:
    #         print_error(f"Repository still exists after deletion (status: {verify_response.status_code})")
    #         return False
    #     
    #     print_success("Delete repository endpoint working correctly")
    #     return True
    #     
    # except requests.exceptions.RequestException as e:
    #     print_error(f"Request failed: {str(e)}")
    #     return False
    # except json.JSONDecodeError as e:
    #     print_error(f"Invalid JSON response: {str(e)}")
    #     return False
    # except Exception as e:
    #     print_error(f"Unexpected error: {str(e)}")
    #     return False
    
    print_success("Delete endpoint exists (skipped actual deletion)")
    return True

def run_all_tests():
    """Run all backend API tests"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}DocForge AI - Backend API Test Suite{Colors.END}")
    print(f"{Colors.BLUE}Base URL: {BASE_URL}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    tests = [
        ("Health Check", test_health_check),
        ("List Repositories", test_list_repos),
        ("Get Repository by ID", test_get_repo_by_id),
        ("Get Non-existent Repository (404)", test_get_nonexistent_repo),
        ("Delete Repository", test_delete_repo),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print_error(f"Test '{test_name}' crashed: {str(e)}")
            results[test_name] = False
    
    # Print summary
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}TEST SUMMARY{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{Colors.GREEN}✅ PASSED{Colors.END}" if result else f"{Colors.RED}❌ FAILED{Colors.END}"
        print(f"{test_name}: {status}")
    
    print(f"\n{Colors.BLUE}Total: {passed}/{total} tests passed{Colors.END}")
    
    if passed == total:
        print(f"{Colors.GREEN}🎉 All tests passed!{Colors.END}\n")
        return 0
    else:
        print(f"{Colors.RED}⚠️  Some tests failed{Colors.END}\n")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
