import { Bell, Calendar, DollarSign, Package } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Requirement } from '../types';

interface RequirementFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface RequirementFormData {
  title: string;
  description: string;
  category: 'money' | 'food' | 'essentials' | 'other';
  quantity?: number;
  unit?: string;
  urgency: 'low' | 'medium' | 'high';
  deadline?: string;
}

const RequirementForm: React.FC<RequirementFormProps> = ({ onSuccess, onCancel, className }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RequirementFormData>({
    defaultValues: {
      category: 'money',
      urgency: 'medium',
    },
  });

  const onSubmit = async (data: RequirementFormData) => {
    setIsLoading(true);
    try {
      // Mock requirement creation - in real app, save to Supabase
      const requirement: Partial<Requirement> = {
        title: data.title,
        description: data.description,
        category: data.category,
        amount_needed: data.quantity,
        currency: 'USD',
        priority: data.urgency,
        deadline: data.deadline,
        status: 'active',
      };

      console.log('Creating requirement:', requirement);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Requirement posted successfully! All donors will be notified.');
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to post requirement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`card ${className ?? 'max-w-2xl mx-auto'}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Post a Requirement</h2>
        <p className="text-gray-600">Let donors know what your organization needs</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="form-label">
            Requirement Title
          </label>
          <input
            id="title"
            type="text"
            className="input-field"
            placeholder="e.g., Food items for children's program"
            {...register('title', {
              required: 'Title is required',
              minLength: {
                value: 5,
                message: 'Title must be at least 5 characters',
              },
            })}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="form-label">Category</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { type: 'money', label: 'Money', icon: DollarSign },
              { type: 'food', label: 'Food', icon: Package },
              { type: 'essentials', label: 'Essentials', icon: Package },
              { type: 'other', label: 'Other', icon: Package },
            ].map(({ type, label, icon: Icon }) => (
              <label
                key={type}
                className="relative cursor-pointer"
              >
                <input
                  type="radio"
                  value={type}
                  className="sr-only"
                  {...register('category')}
                />
                <div className="p-4 border-2 rounded-lg text-center transition-colors peer-checked:border-primary-600 peer-checked:bg-primary-50 peer-checked:text-primary-600 border-gray-300 bg-white text-gray-700 hover:border-gray-400">
                  <Icon className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="form-label">
              Quantity Needed
            </label>
            <input
              id="quantity"
              type="number"
              min="1"
              className="input-field"
              placeholder="Enter quantity"
              {...register('quantity', {
                min: { value: 1, message: 'Quantity must be at least 1' },
              })}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="unit" className="form-label">
              Unit
            </label>
            <select
              id="unit"
              className="input-field"
              {...register('unit')}
            >
              <option value="">Select unit (optional)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="lbs">Pounds (lbs)</option>
              <option value="pieces">Pieces</option>
              <option value="boxes">Boxes</option>
              <option value="bags">Bags</option>
              <option value="bottles">Bottles</option>
              <option value="USD">USD</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="form-label">
            Detailed Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="input-field"
            placeholder="Provide detailed information about your requirement, how it will be used, and any specific needs..."
            {...register('description', {
              required: 'Description is required',
              minLength: {
                value: 20,
                message: 'Description must be at least 20 characters',
              },
            })}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Urgency */}
        <div>
          <label className="form-label">Urgency Level</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
              { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
              { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' },
            ].map(({ value, label, color }) => (
              <label
                key={value}
                className="relative cursor-pointer"
              >
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...register('urgency')}
                />
                <div className={`p-3 border-2 rounded-lg text-center transition-colors peer-checked:border-gray-900 border-gray-300 bg-white hover:border-gray-400`}>
                  <div className="text-sm font-medium">{label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label htmlFor="deadline" className="form-label">
            Deadline (Optional)
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="deadline"
              type="date"
              className="input-field pl-10"
              min={new Date().toISOString().split('T')[0]}
              {...register('deadline')}
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Leave empty if there's no specific deadline
          </p>
        </div>

        {/* Information Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <Bell className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Notification</p>
              <p>All donors on the platform will be notified about your requirement. Make sure to provide clear and accurate information.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 btn-outline"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 btn-primary"
          >
            {isLoading ? 'Posting...' : 'Post Requirement'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequirementForm; 