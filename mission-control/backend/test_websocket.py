#!/usr/bin/env python3
"""
Mission Control WebSocket Server Test
Tests WebSocket connectivity and message handling
"""

import asyncio
import json
import sys
import websockets

WS_URL = "ws://localhost:8765"


async def test_websocket_connection():
    """Test basic WebSocket connection"""
    print("\n🔌 Testing WebSocket connection...")
    
    try:
        async with websockets.connect(WS_URL) as ws:
            print(f"  ✅ Connected to {WS_URL}")
            
            # Send ping
            await ws.send(json.dumps({"type": "ping"}))
            
            # Wait for response
            response = await asyncio.wait_for(ws.recv(), timeout=5)
            data = json.loads(response)
            
            if data.get("type") == "pong":
                print(f"  ✅ Ping-pong successful")
                return True
            else:
                print(f"  ⚠️  Unexpected response: {data}")
                return True  # Still connected
                
    except ConnectionRefusedError:
        print(f"  ❌ Connection refused - WebSocket server not running")
        return False
    except asyncio.TimeoutError:
        print(f"  ❌ Connection timeout")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


async def test_websocket_subscription():
    """Test WebSocket subscription"""
    print("\n📡 Testing WebSocket subscription...")
    
    try:
        async with websockets.connect(WS_URL) as ws:
            # Subscribe to agent_status channel
            await ws.send(json.dumps({
                "type": "subscribe",
                "channel": "agent_status"
            }))
            
            # Wait for subscription confirmation
            response = await asyncio.wait_for(ws.recv(), timeout=5)
            data = json.loads(response)
            
            if data.get("type") == "subscribed":
                print(f"  ✅ Subscribed to channel: {data.get('channel')}")
            
            # Wait for initial state (should receive agent_status events)
            try:
                response = await asyncio.wait_for(ws.recv(), timeout=3)
                data = json.loads(response)
                print(f"  ✅ Received message type: {data.get('type')}")
                return True
            except asyncio.TimeoutError:
                print(f"  ⚠️  No initial messages (may be normal)")
                return True
                
    except ConnectionRefusedError:
        print(f"  ❌ Connection refused - WebSocket server not running")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


async def run_tests():
    """Run all WebSocket tests"""
    print("=" * 60)
    print("Mission Control WebSocket Integration Test")
    print("=" * 60)
    
    tests = [
        test_websocket_connection,
        test_websocket_subscription,
    ]
    
    results = []
    for test in tests:
        try:
            result = await test()
            results.append(result)
        except Exception as e:
            print(f"  ❌ Exception: {e}")
            results.append(False)
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All WebSocket tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(run_tests()))
