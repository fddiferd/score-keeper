#!/usr/bin/env python3
"""
Run script for WristbandApiClient.query_tenant_roles()
Usage: python run_query_tenant_roles.py --tenant-id <tenant_id> --access-token <token>
       python run_query_tenant_roles.py  # Uses environment variables
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from pprint import pprint
from dotenv import load_dotenv

load_dotenv()

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from clients.wristband_client import WristbandClient


async def main():
    parser = argparse.ArgumentParser(
        description='Query tenant roles from Wristband API',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Environment variables:
  TENANT_ID                  Tenant ID to query roles for
  ACCESS_TOKEN              Access token for authentication
  APPLICATION_VANITY_DOMAIN  Application vanity domain (required for WristbandApiClient)

Examples:
  python run_query_tenant_roles.py --tenant-id tenant123 --access-token token456
  TENANT_ID=tenant123 ACCESS_TOKEN=token456 python run_query_tenant_roles.py
        """
    )
    
    parser.add_argument(
        '--tenant-id',
        help='Tenant ID to query roles for (env: TENANT_ID)',
        default=os.getenv('TENANT_ID')
    )
    parser.add_argument(
        '--access-token',
        help='Access token for authentication (env: ACCESS_TOKEN)',
        default=os.getenv('ACCESS_TOKEN')
    )
    parser.add_argument(
        '--pretty',
        action='store_true',
        help='Pretty print JSON output',
        default=True
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output raw JSON format',
        default=False
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
        # Initialize client and make API call
        client = WristbandClient()
        print(f"Querying roles for tenant_id: {args.tenant_id}")
        
        roles = await client.query_tenant_roles(args.tenant_id, args.access_token)
        
        # Print results
        print(f"\nFound {len(roles)} roles:")
        print("-" * 50)
        
        if args.json:
            # Output as JSON array
            roles_data = [role.model_dump() for role in roles]
            if args.pretty:
                print(json.dumps(roles_data, indent=2))
            else:
                print(json.dumps(roles_data))
        else:
            # Output in formatted table
            for role in roles:
                print(f"\nRole: {role.displayName}")
                print(f"  ID: {role.id}")
                print(f"  Name: {role.name}")
                print(f"  SKU: {role.sku}")
                print(f"  Type: {role.type}")
                print(f"  Owner Type: {role.ownerType}")
                print(f"  Tenant Visibility: {role.tenantVisibility}")
                if role.description:
                    print(f"  Description: {role.description}")
            
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())