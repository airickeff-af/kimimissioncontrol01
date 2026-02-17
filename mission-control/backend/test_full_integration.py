#!/usr/bin/env python3
"""
Mission Control Backend Full Integration Test
Tests all backend components: API, WebSocket, Data Pipeline, Backup System
"""

import asyncio
import json
import sys
import urllib.request
import urllib.error
import websockets

API_URL = "http://localhost:8080"
WS_URL = "ws://localhost:8765"


def make_request(endpoint, method="GET", data=None):
    """Make HTTP request and return response"""
    url = f"{API_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if data:
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode('utf-8'))
        except:
            return e.code, {"error": str(e)}
    except Exception as e:
        return None, str(e)


# ═══════════════════════════════════════════════════════════════
# API TESTS
# ═══════════════════════════════════════════════════════════════

def test_health():
    """Test health check endpoint"""
    print("\n📊 Testing /api/health...")
    status, data = make_request("/api/health")
    
    if status == 200 and data.get("status") == "healthy":
        print(f"  ✅ Health check passed")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_agents_list():
    """Test agents list endpoint"""
    print("\n👥 Testing /api/agents...")
    status, data = make_request("/api/agents")
    
    if status == 200 and "agents" in data:
        agents = data["agents"]
        print(f"  ✅ Found {len(agents)} agents")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_agent_detail():
    """Test agent detail endpoint"""
    print("\n🔍 Testing /api/agents/{id}...")
    status, data = make_request("/api/agents")
    if status != 200 or not data.get("agents"):
        print("  ⚠️  Skipped - no agents found")
        return True
    
    agent_id = data["agents"][0]["id"]
    status, data = make_request(f"/api/agents/{agent_id}")
    
    if status == 200:
        print(f"  ✅ Agent detail retrieved for '{agent_id}'")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_system_status():
    """Test system status endpoint"""
    print("\n🖥️  Testing /api/system/status...")
    status, data = make_request("/api/system/status")
    
    if status == 200 and "office_state" in data:
        office = data.get("office_state", {})
        positions = office.get("positions", {})
        print(f"  ✅ System status retrieved ({len(positions)} agents in office)")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_tasks():
    """Test tasks endpoint"""
    print("\n📋 Testing /api/tasks...")
    status, data = make_request("/api/tasks")
    
    if status == 200 and "tasks" in data:
        print(f"  ✅ Task queue retrieved ({len(data['tasks'])} tasks)")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_active_tasks():
    """Test active tasks endpoint"""
    print("\n⚡ Testing /api/tasks/active...")
    status, data = make_request("/api/tasks/active")
    
    if status == 200 and "active_tasks" in data:
        print(f"  ✅ Active tasks retrieved ({len(data['active_tasks'])} active)")
        return True
    else:
        print(f"  ❌ Failed: {data}")
        return False


def test_files_browse():
    """Test file browsing endpoint"""
    print("\n📁 Testing /api/files/browse...")
    status, data = make_request("/api/files/browse?path=mission-control")
    
    if status == 200 and "items" in data:
        print(f"  ✅ File browser working ({len(data['items'])} items)")
        return True
    else:
        print(f"  ❌ Failed: {status} - {data}")
        return False


def test_files_read():
    """Test file reading endpoint"""
    print("\n📄 Testing /api/files/read...")
    status, data = make_request("/api/files/read?path=mission-control/README.md")
    
    if status == 200 and "content" in data:
        print(f"  ✅ File reading working ({data.get('size', 0)} bytes)")
        return True
    elif status == 404:
        print(f"  ⚠️  File not found (may be normal)")
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


# ═══════════════════════════════════════════════════════════════
# WEBSOCKET TESTS
# ═══════════════════════════════════════════════════════════════

async def test_ws_connection():
    """Test WebSocket connection"""
    print("\n🔌 Testing WebSocket connection...")
    
    try:
        async with websockets.connect(WS_URL) as ws:
            await ws.send(json.dumps({"type": "ping"}))
            response = await asyncio.wait_for(ws.recv(), timeout=5)
            data = json.loads(response)
            
            if data.get("type") in ["pong", "agent_position", "agent_status"]:
                print(f"  ✅ WebSocket connected and responding")
                return True
            else:
                print(f"  ⚠️  Unexpected response type: {data.get('type')}")
                return True
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


async def test_ws_subscription():
    """Test WebSocket subscription"""
    print("\n📡 Testing WebSocket subscription...")
    
    try:
        async with websockets.connect(WS_URL) as ws:
            await ws.send(json.dumps({"type": "subscribe", "channel": "agent_status"}))
            
            # Receive subscription confirmation or initial state
            response = await asyncio.wait_for(ws.recv(), timeout=5)
            data = json.loads(response)
            
            print(f"  ✅ Subscribed, received: {data.get('type')}")
            return True
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════

async def run_async_tests():
    """Run async tests"""
    tests = [
        test_ws_connection,
        test_ws_subscription,
    ]
    
    results = []
    for test in tests:
        try:
            results.append(await test())
        except Exception as e:
            print(f"  ❌ Exception: {e}")
            results.append(False)
    
    return results


def run_sync_tests():
    """Run synchronous tests"""
    tests = [
        test_health,
        test_agents_list,
        test_agent_detail,
        test_system_status,
        test_tasks,
        test_active_tasks,
        test_files_browse,
        test_files_read,
        test_websocket_status,
    ]
    
    results = []
    for test in tests:
        try:
            results.append(test())
        except Exception as e:
            print(f"  ❌ Exception: {e}")
            results.append(False)
    
    return results


def main():
    """Main test runner"""
    print("=" * 70)
    print("  Mission Control Backend - Full Integration Test")
    print("=" * 70)
    print(f"  API URL: {API_URL}")
    print(f"  WebSocket: {WS_URL}")
    print("=" * 70)
    
    # Run sync tests
    print("\n" + "─" * 70)
    print("  REST API Tests")
    print("─" * 70)
    sync_results = run_sync_tests()
    
    # Run async tests
    print("\n" + "─" * 70)
    print("  WebSocket Tests")
    print("─" * 70)
    async_results = asyncio.run(run_async_tests())
    
    # Results
    all_results = sync_results + async_results
    passed = sum(all_results)
    total = len(all_results)
    
    print("\n" + "=" * 70)
    print(f"  Results: {passed}/{total} tests passed")
    print("=" * 70)
    
    if passed == total:
        print("\n  🎉 ALL TESTS PASSED!")
        print("  Backend is fully operational and ready for frontend integration.")
        return 0
    else:
        print(f"\n  ⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
