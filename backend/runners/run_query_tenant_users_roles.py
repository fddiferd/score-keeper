#!/usr/bin/env python3
"""
Run script that queries tenant users and then resolves their assigned roles
Usage: python run_query_tenant_users_roles.py --tenant-id <tenant_id> --access-token <token>
       python run_query_tenant_users_roles.py  # Uses environment variables
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from pprint import pprint

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from clients.wristband_client import WristbandClient
from models.wristband.user import User
from models.wristband.roles import RoleList   


async def main():
    parser = argparse.ArgumentParser(
        description='Query tenant users and resolve their assigned roles from Wristband API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Environment variables:
  TENANT_ID             Tenant ID to query users for
  ACCESS_TOKEN          Access token for authentication
  APPLICATION_VANITY_DOMAIN  Application vanity domain (required for WristbandApiClient)

Examples:
  python run_query_tenant_users_roles.py --tenant-id tenant123 --access-token token456
  python run_query_tenant_users_roles.py --tenant-id tenant123 --access-token token456 --start-index 20 --count 20
  TENANT_ID=tenant123 ACCESS_TOKEN=token456 python run_query_tenant_users_roles.py
        """
    )
    
    parser.add_argument(
        '--tenant-id',
        help='Tenant ID to query users for (env: TENANT_ID)',
        default=os.getenv('TENANT_ID')
    )
    parser.add_argument(
        '--access-token',
        help='Access token for authentication (env: ACCESS_TOKEN)',
        default=os.getenv('ACCESS_TOKEN')
    )
    parser.add_argument(
        '--start-index',
        type=int,
        default=0,
        help='Start index (default: 0)'
    )
    parser.add_argument(
        '--count',
        type=int,
        default=10,
        help='Number of users to retrieve (default: 10)'
    )
    
    args = parser.parse_args()
    
    # Validate required arguments
    if not args.tenant_id:
        print("Error: --tenant-id is required (or set TENANT_ID environment variable)")
        sys.exit(1)
    
    if not args.access_token:
        print("Error: --access-token is required (or set ACCESS_TOKEN environment variable)")
        sys.exit(1)
    
    if not os.getenv('APPLICATION_VANITY_DOMAIN'):
        print("Error: APPLICATION_VANITY_DOMAIN environment variable is required")
        sys.exit(1)
    
    try:
        # Initialize client
        client = WristbandClient()
        
        # Step 1: Query tenant users
        print(f"📋 Querying users for tenant_id: {args.tenant_id}")
        print(f"   Start index: {args.start_index}, Count: {args.count}")
        
        user_list: list[User] = await client.query_tenant_users(
            args.tenant_id,
            args.access_token
        )
        
        print(f"✅ Found {len(user_list)} users on this page")
        
        print("\n🔍 User List:")
        for user in user_list:
            print(f"   - {user.email} (ID: {user.id})")
        
        # Step 2: Get user IDs and resolve roles
        if user_list:
            user_ids = [user.id for user in user_list]
            print(f"\n🔐 Resolving roles for {len(user_ids)} users...")
            
            roles_data: RoleList = await client.resolve_assigned_roles_for_users(
                user_ids,
                args.access_token
            )
            
            print("✅ Roles resolved successfully!")
            
            # Display combined results
            print("\n📊 Complete Results:")
            print("\n--- Users ---")
            pprint([user.model_dump() for user in user_list])
            
            print("\n--- Assigned Roles ---")
            pprint([role.model_dump() for role in roles_data.items])
          
        else:
            print("\n⚠️  No users found - skipping role resolution")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 