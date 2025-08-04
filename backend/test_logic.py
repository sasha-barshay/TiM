import unittest
import sys
import os

# Adjust the module search path so tests can import logic.py when run with unittest discovery.
sys.path.append(os.path.dirname(__file__))

from logic import TiMBackend, ValidationError


class TestTiMBackend(unittest.TestCase):
    def setUp(self) -> None:
        self.backend = TiMBackend()

    def test_create_customer(self):
        customer = self.backend.create_customer(name='Acme Ltd', hourly_rate=150, currency='USD')
        self.assertIn('id', customer)
        self.assertEqual(customer['name'], 'Acme Ltd')
        self.assertEqual(len(self.backend.list_customers()), 1)

    def test_create_customer_requires_name(self):
        with self.assertRaises(ValidationError):
            self.backend.create_customer(name='')

    def test_create_time_entry_with_hours(self):
        # create dummy customer to reference
        cust = self.backend.create_customer(name='Acme')
        entry = self.backend.create_time_entry(user_id='user1', customer_id=cust['id'], date='2025-08-04', hours=1.3)
        # Hours should be rounded to 1.5
        self.assertAlmostEqual(entry['hours'], 1.5)
        self.assertEqual(len(self.backend.list_time_entries()), 1)

    def test_create_time_entry_with_start_and_end(self):
        cust = self.backend.create_customer(name='Acme')
        # 45 minutes should round to 0.5
        entry = self.backend.create_time_entry(user_id='user1', customer_id=cust['id'], date='2025-08-04', start_time='10:00', end_time='10:45')
        # 45 minutes (0.75h) rounds to 1.0h (nearest half hour)
        self.assertAlmostEqual(entry['hours'], 1.0)

    def test_time_entry_minimum_hours(self):
        cust = self.backend.create_customer(name='Acme')
        with self.assertRaises(ValidationError):
            self.backend.create_time_entry(user_id='user1', customer_id=cust['id'], date='2025-08-04', hours=0.3)

    def test_time_entry_requires_date_and_user(self):
        cust = self.backend.create_customer(name='Acme')
        with self.assertRaises(ValidationError):
            self.backend.create_time_entry(user_id='', customer_id=cust['id'], date='2025-08-04', hours=1)
        with self.assertRaises(ValidationError):
            self.backend.create_time_entry(user_id='user1', customer_id=cust['id'], date='invalid-date', hours=1)


if __name__ == '__main__':
    unittest.main()