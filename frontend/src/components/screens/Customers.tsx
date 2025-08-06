import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Plus, 
  Edit, 
  Archive, 
  Users, 
  DollarSign, 
  Building2, 
  Filter,
  Search,
  Eye
} from 'lucide-react';
import { customersApi, usersApi } from '../../services/api';
import { Customer, User } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Customers: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', filters],
    queryFn: () => {
      // Filter out empty parameters to avoid validation errors
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      return customersApi.getCustomers(cleanFilters);
    },
  });

  // Fetch users for assignment
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => customersApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowForm(false);
      toast.success('Customer created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create customer');
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      customersApi.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowForm(false);
      setSelectedCustomer(null);
      toast.success('Customer updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update customer');
    },
  });

  // Archive customer mutation
  const archiveMutation = useMutation({
    mutationFn: (customerId: string) => customersApi.deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer archived successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to archive customer');
    },
  });

  if (customersLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading customers..." />
      </div>
    );
  }

  const customers = customersData?.data || [];
  const users = usersData?.data || [];

  // Filter customers based on search and status
  const filteredCustomers = customers.filter((customer: Customer) => {
    if (filters.status && customer.status !== filters.status) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        (customer.contact_info?.email && customer.contact_info.email.toLowerCase().includes(searchLower)) ||
        (customer.contact_info?.phone && customer.contact_info.phone.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const handleSubmit = (formData: any) => {
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleArchive = (customer: Customer) => {
    if (confirm(`Are you sure you want to archive ${customer.name}?`)) {
      archiveMutation.mutate(customer.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">Manage your clients and projects</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="form-input pl-10"
                />
              </div>
            </div>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="form-select text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Customer List</h2>
        </div>
        <div className="card-body">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No customers found</p>
              <p className="text-sm text-gray-400">
                {filters.search || filters.status ? 'Try adjusting your filters' : 'Get started by adding your first customer'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer: Customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">
                              Created {customer.created_at ? format(new Date(customer.created_at), 'MMM d, yyyy') : 'Unknown date'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                                                        {customer.contact_info?.email || 'No email'}
                        </div>
                        <div className="text-sm text-gray-500">
                                                      {customer.contact_info?.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {customer.assigned_user_ids?.length || 0} members
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {customer.account_manager_name && `AM: ${customer.account_manager_name}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            ${customer.billing_info?.hourly_rate || '0'}/hr
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.billing_info?.currency || 'USD'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : customer.status === 'inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowDetails(true);
                            }}
                            className="btn btn-sm btn-outline"
                            title="View Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowForm(true);
                            }}
                            className="btn btn-sm btn-outline"
                            title="Edit Customer"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          {customer.status !== 'archived' && (
                            <button
                              onClick={() => handleArchive(customer)}
                              className="btn btn-sm btn-outline text-red-600 hover:text-red-700"
                              title="Archive Customer"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={selectedCustomer}
          users={users}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedCustomer(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Customer Details Modal */}
      {showDetails && selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          users={users}
          onClose={() => {
            setShowDetails(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

// Customer Form Component
interface CustomerFormProps {
  customer: Customer | null;
  users: User[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  users,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    contact_info: customer?.contact_info || {
      email: '',
      phone: '',
      address: '',
    },
    billing_info: customer?.billing_info || {
      hourly_rate: 0,
      currency: 'USD',
      payment_terms: 'Net 30',
    },
    assigned_user_ids: customer?.assigned_user_ids || [],
    account_manager_id: customer?.account_manager_id || '',
    leading_engineer_id: customer?.leading_engineer_id || '',
    working_schedule_id: customer?.working_schedule_id || '',
    status: customer?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    onSubmit(formData);
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter(id => id !== userId)
        : [...prev.assignedUserIds, userId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="space-y-4">
              <div>
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'archived' })}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  value={formData.contact_info.email}
                  onChange={(e) => setFormData({
                    ...formData,
                                          contact_info: { ...formData.contact_info, email: e.target.value }
                  })}
                  className="form-input"
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactInfo: { ...formData.contactInfo, phone: e.target.value }
                  })}
                  className="form-input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="form-label">Address</label>
              <textarea
                value={formData.contactInfo.address}
                onChange={(e) => setFormData({
                  ...formData,
                  contactInfo: { ...formData.contactInfo, address: e.target.value }
                })}
                className="form-textarea"
                rows={3}
                placeholder="Enter full address"
              />
            </div>
          </div>

          {/* Billing Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Billing Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Hourly Rate</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.billingInfo.hourlyRate}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingInfo: { ...formData.billingInfo, hourlyRate: parseFloat(e.target.value) || 0 }
                  })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="form-label">Currency</label>
                <select
                  value={formData.billingInfo.currency}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingInfo: { ...formData.billingInfo, currency: e.target.value }
                  })}
                  className="form-select"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div>
                <label className="form-label">Payment Terms</label>
                <select
                  value={formData.billingInfo.paymentTerms}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingInfo: { ...formData.billingInfo, paymentTerms: e.target.value }
                  })}
                  className="form-select"
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Team Assignment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Account Manager</label>
                <select
                  value={formData.accountManagerId}
                  onChange={(e) => setFormData({ ...formData, accountManagerId: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select Account Manager</option>
                  {users.filter(user => user.roles.includes('account_manager')).map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Leading Engineer</label>
                <select
                  value={formData.leadingEngineerId}
                  onChange={(e) => setFormData({ ...formData, leadingEngineerId: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select Leading Engineer</option>
                  {users.filter(user => user.roles.includes('engineer')).map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="form-label">Assigned Team Members</label>
              <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-gray-500 text-sm">No users available</p>
                ) : (
                  <div className="space-y-2">
                    {users.map(user => (
                      <label key={user.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.assignedUserIds.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="form-checkbox"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.roles.map(role => (
                              <span
                                key={role}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {role.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (customer ? 'Update Customer' : 'Create Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Customer Details Component
interface CustomerDetailsProps {
  customer: Customer;
  users: User[];
  onClose: () => void;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ customer, users, onClose }) => {
  const assignedUsers = users.filter(user => customer.assignedUserIds?.includes(user.id));
  const accountManager = users.find(user => user.id === customer.accountManagerId);
  const leadingEngineer = users.find(user => user.id === customer.leadingEngineerId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Customer Name</label>
                <p className="text-sm text-gray-900 mt-1">{customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    customer.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : customer.status === 'inactive'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900 mt-1">
                  {customer.contactInfo?.email || 'Not provided'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="text-sm text-gray-900 mt-1">
                  {customer.contactInfo?.phone || 'Not provided'}
                </p>
              </div>
            </div>
            {customer.contactInfo?.address && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="text-sm text-gray-900 mt-1">{customer.contactInfo.address}</p>
              </div>
            )}
          </div>

          {/* Billing Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Billing Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Hourly Rate</label>
                <p className="text-sm text-gray-900 mt-1">
                  ${customer.billingInfo?.hourlyRate || '0'} {customer.billingInfo?.currency || 'USD'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Payment Terms</label>
                <p className="text-sm text-gray-900 mt-1">
                  {customer.billingInfo?.paymentTerms || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Team Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Team Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Account Manager</label>
                <p className="text-sm text-gray-900 mt-1">
                  {accountManager?.name || 'Not assigned'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Leading Engineer</label>
                <p className="text-sm text-gray-900 mt-1">
                  {leadingEngineer?.name || 'Not assigned'}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700">Assigned Team Members</label>
              {assignedUsers.length === 0 ? (
                <p className="text-sm text-gray-500 mt-1">No team members assigned</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {assignedUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers; 