#!/usr/bin/env python3
"""
Mission Control API Integration Test
Tests all endpoints to validate backend functionality
"""

import asyncio
import json
import sys
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8080"


def make_request(endpoint, method="GET", data=None):
    """Make HTTP request and return response"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if data:
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(
        url,
        data=data,
        headers=headers,
        method=method
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))
    except Exception as e:
        return None, str(e)


def test_health():
    """Test health check endpoint"""
    print("\n📊 Testing /api/health...")
    status, data = make_request("/api/health")
    
    if status == 200 and data.get("status") == "healthy":
        print(f"  ✅ Health check passed")
        print(f"     Services: {data.get('services', {})}")
        return True
    else:
        print(f"  ❌ Health check failed: {data}")
        return False


def test_agents_list():
    """Test agents list endpoint"""
    print("\n👥 Testing /api/agents...")
    status, data = make_request("/api/agents")
    
    if status == 200 and "agents" in data:
        agents = data["agents"]
        print(f"  ✅ Found {len(agents)} agents")
        for agent in agents[:3]:
            print(f"     - {agent['id']}: {agent['name']} ({agent['status']})")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_agent_detail():
    """Test agent detail endpoint"""
    print("\n🔍 Testing /api/agents/{id}...")
    
    # First get list of agents
    status, data = make_request("/api/agents")
    if status != 200 or not data.get("agents"):
        print("  ⚠️  No agents found to test")
        return True
    
    agent_id = data["agents"][0]["id"]
    status, data = make_request(f"/api/agents/{agent_id}")
    
    if status == 200:
        print(f"  ✅ Agent detail for '{agent_id}' retrieved")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_system_status():
    """Test system status endpoint"""
    print("\n🖥️  Testing /api/system/status...")
    status, data = make_request("/api/system/status")
    
    if status == 200 and "office_state" in data:
        print(f"  ✅ System status retrieved")
        office = data.get("office_state", {})
        if "positions" in office:
            print(f"     Agents in office: {len(office['positions'])}")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_tasks():
    """Test tasks endpoint"""
    print("\n📋 Testing /api/tasks...")
    status, data = make_request("/api/tasks")
    
    if status == 200 and "tasks" in data:
        tasks = data["tasks"]
        print(f"  ✅ Found {len(tasks)} tasks")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_active_tasks():
    """Test active tasks endpoint"""
    print("\n⚡ Testing /api/tasks/active...")
    status, data = make_request("/api/tasks/active")
    
    if status == 200 and "active_tasks" in data:
        tasks = data["active_tasks"]
        print(f"  ✅ Found {len(tasks)} active tasks")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_files_browse():
    """Test file browsing endpoint"""
    print("\n📁 Testing /api/files/browse...")
    status, data = make_request("/api/files/browse?path=mission-control")
    
    if status == 200 and "items" in data:
        items = data["items"]
        print(f"  ✅ Found {len(items)} items in mission-control/")
        return True
    elif status == 404:
        print(f"  ⚠️  Path not found (expected if directory doesn't exist)")
        return True
    else:
        print(f"  ❌ Failed: {status} - {data}")
        return False


def test_websocket_status():
    """Test WebSocket status endpoint"""
    print("\n🔌 Testing /api/websocket/status...")
    status, data = make_request("/api/websocket/status")
    
    if status == 200 and "status" in data:
        print(f"  ✅ WebSocket status: {data['status']}")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def run_tests():
    """Run all tests"""
    print("=" * 60)
    print("Mission Control API Integration Test")
    print("=" * 60)
    
    tests = [
        test_health,
        test_agents_list,
        test_agent_detail,
        test_system_status,
        test_tasks,
        test_active_tasks,
        test_files_browse,
        test_websocket_status,
    ]
    
    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"  ❌ Exception: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(run_tests())
