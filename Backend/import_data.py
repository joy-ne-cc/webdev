"""
This script reads all 308 transactions from transactions.csv and prints them to the console.
Run this code and check that it says "Loaded 308 transactions"
This should work for the database. SQL statements at the end are for reference...till after models have been built
"""

import csv
import os

csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'transactions.csv')

transactions = []

with open(csv_path, mode='r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    for row in reader:
        transactions.append({
            'transaction_id': row['TransactionID'],
            'booth': row['MobileBooth'],
            'location': row['Location'],
            'service': row['Service'],
            'revenue_per_kwanch': float(row['RevenuePerKwanch']),
            'transaction_amount': int(row['TransactionAmount'])
        })

print(f"Loaded {len(transactions)} transactions.\n")

# Show first 5 rows to confirm it worked
print("First 5 transactions:")
print("-" * 60)
for t in transactions[:5]:
    print(f"  {t}")
print("-" * 60)

# Sample SQL for when the python models are built)
print("\n Sample SQL INSERT statements:")
print("=" * 60)
for t in transactions[:3]:
    print(f"INSERT INTO transaction VALUES ('{t['transaction_id']}', '{t['booth']}', "
          f"'{t['location']}', '{t['service']}', {t['revenue_per_kwanch']}, {t['transaction_amount']});")
print("=" * 60)

print(f"\n Total rows ready for import: {len(transactions)}")
print("Next step: Adaption of this code for the database.")