"""
Core business logic for the TiM time tracking application.

This module defines a `TiMBackend` class that manages customers and time entries.
It performs basic validation, including enforcing a minimum time entry length
and rounding hours to the nearest 0.5.  In a production system these methods
would interface with a persistent data store; here we use in‑memory lists
to keep the example simple and fully testable in this environment.
"""

import uuid
from datetime import datetime


class ValidationError(Exception):
    """Custom exception raised when input data is invalid."""


class TiMBackend:
    def __init__(self) -> None:
        self.customers: list[dict] = []
        self.time_entries: list[dict] = []

    # Customer management
    def create_customer(self, name: str, hourly_rate: float | int = 0, currency: str = 'USD', account_manager_id: str | None = None, status: str = 'active') -> dict:
        if not name:
            raise ValidationError('Customer name is required')
        customer = {
            'id': str(uuid.uuid4()),
            'name': name,
            'accountManagerId': account_manager_id,
            'hourlyRate': float(hourly_rate),
            'currency': currency,
            'status': status
        }
        self.customers.append(customer)
        return customer

    def list_customers(self) -> list[dict]:
        return list(self.customers)

    # Time entry management
    def create_time_entry(self, *, user_id: str, customer_id: str, date: str, hours: float | None = None,
                          start_time: str | None = None, end_time: str | None = None,
                          description: str = '', status: str = 'draft') -> dict:
        """Create a time entry with validation.

        Either `hours` or `start_time`/`end_time` must be provided.  Hours are
        rounded to the nearest 0.5 and must be at least 0.5.
        """
        if not user_id or not customer_id or not date:
            raise ValidationError('user_id, customer_id and date are required')

        # Parse date to ensure it's valid
        try:
            datetime.strptime(date, '%Y-%m-%d')
        except ValueError:
            raise ValidationError('date must be in YYYY-MM-DD format')

        computed_hours = hours
        # If hours not provided, compute from start/end times
        if computed_hours is None:
            if start_time is None or end_time is None:
                raise ValidationError('Either hours or start_time and end_time must be provided')
            try:
                start_dt = datetime.strptime(f"{date}T{start_time}", '%Y-%m-%dT%H:%M')
                end_dt = datetime.strptime(f"{date}T{end_time}", '%Y-%m-%dT%H:%M')
            except ValueError:
                raise ValidationError('start_time and end_time must be in HH:MM format')
            diff = end_dt - start_dt
            computed_hours = diff.total_seconds() / 3600.0

        # Round up to the nearest 0.5 hour.  A value of 0.75 becomes 1.0,
        # 1.3 becomes 1.5, etc.  Entries less than 0.5 after rounding are invalid.
        # Enforce minimum of 0.5 hours before rounding.  Entries shorter than
        # 30 minutes (0.5 h) are invalid.
        if computed_hours < 0.5:
            raise ValidationError('Minimum time entry is 0.5 hours')
        # Round to the nearest half hour.  This uses standard rounding: 0.75 h
        # becomes 1.0 h, 1.25 h becomes 1.5 h, etc.
        rounded_hours = round(computed_hours * 2) / 2

        entry = {
            'id': str(uuid.uuid4()),
            'userId': user_id,
            'customerId': customer_id,
            'date': date,
            'startTime': start_time,
            'endTime': end_time,
            'hours': rounded_hours,
            'description': description,
            'status': status
        }
        self.time_entries.append(entry)
        return entry

    def list_time_entries(self) -> list[dict]:
        return list(self.time_entries)