import { AlertCircle, Calendar, DollarSign, ShoppingBag, Utensils } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/database';
import { useAuth } from '../contexts/AuthContext';

interface DonationFormProps {
  ngoId: string;
  ngoName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<DonationFormData>;
}

interface DonationFormData {
  type: 'money' | 'food' | 'essentials';
  amount?: number;
  description: string;
  quantity?: number;
  unit?: string;
  deliveryDate?: string;
  essentialType?: string;
}

const DonationForm: React.FC<DonationFormProps> = ({
  ngoId,
  ngoName,
  onSuccess,
  onCancel,
  initialData,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [donationType, setDonationType] = useState<'money' | 'food' | 'essentials'>(
    initialData?.type || 'money'
  );
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DonationFormData>({
    defaultValues: {
      type: initialData?.type || 'money',
      amount: initialData?.amount,
      description: initialData?.description || '',
      quantity: initialData?.quantity,
      unit: initialData?.unit,
      deliveryDate: initialData?.deliveryDate,
      essentialType: initialData?.essentialType,
    },
  });

  useEffect(() => {
    setDonationType(initialData?.type || 'money');
    reset({
      type: initialData?.type || 'money',
      amount: initialData?.amount,
      description: initialData?.description || '',
      quantity: initialData?.quantity,
      unit: initialData?.unit,
      deliveryDate: initialData?.deliveryDate,
      essentialType: initialData?.essentialType,
    });
  }, [initialData, reset]);

  const onSubmit = async (data: DonationFormData) => {
    if (!userProfile) {
      toast.error('Please sign in as a donor to continue.');
      navigate('/login');
      return;
    }

    if (userProfile.user_type !== 'donor') {
      toast.error('Only donor accounts can create donations.');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.createDonation({
        ngo_id: ngoId,
        donation_type: donationType,
        amount: donationType === 'money' ? Number(data.amount) : undefined,
        quantity: donationType !== 'money' ? Number(data.quantity) : undefined,
        unit: donationType !== 'money' ? data.unit : undefined,
        essential_type: donationType === 'essentials' ? data.essentialType : undefined,
        delivery_date: donationType !== 'money' ? data.deliveryDate : undefined,
        message: data.description,
        currency: 'USD',
        anonymous: false,
      });

      toast.success('Donation submitted successfully!');
      reset();
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to submit donation. Please try again.';
      if (/token|unauthorized|401/i.test(errorMessage)) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Make a Donation</h2>
        <p className="text-gray-600">Donating to: <span className="font-medium">{ngoName}</span></p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Donation Type Selection */}
        <div>
          <label className="form-label">Donation Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { type: 'money', label: 'Money', icon: DollarSign, desc: 'Monetary donation' },
              { type: 'food', label: 'Food', icon: Utensils, desc: 'Food items & supplies' },
              { type: 'essentials', label: 'Daily Essentials', icon: ShoppingBag, desc: 'Clothes, furniture, etc.' },
            ].map(({ type, label, icon: Icon, desc }) => (
              <button
                key={type}
                type="button"
                onClick={() => setDonationType(type as any)}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  donationType === type
                    ? 'border-primary-600 bg-primary-50 text-primary-600 shadow-md'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300 hover:shadow-sm'
                }`}
              >
                <Icon className="h-8 w-8 mx-auto mb-2" />
                <div className="text-base font-semibold mb-1">{label}</div>
                <div className="text-xs opacity-75">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Essential Type Selection (for daily essentials) */}
        {donationType === 'essentials' && (
          <div>
            <label htmlFor="essentialType" className="form-label">
              Type of Essential Item
            </label>
            <select
              id="essentialType"
              className="input-field"
              {...register('essentialType', { required: 'Please select essential type' })}
            >
              <option value="">Select type</option>
              <option value="clothes">Clothes</option>
              <option value="furniture">Furniture</option>
              <option value="blankets">Blankets & Bedding</option>
              <option value="shoes">Shoes</option>
              <option value="kitchen">Kitchen Items</option>
              <option value="toiletries">Toiletries</option>
              <option value="other">Other</option>
            </select>
            {errors.essentialType && (
              <p className="mt-1 text-sm text-red-600">{errors.essentialType.message}</p>
            )}
          </div>
        )}

        {/* Amount/Quantity */}
        {donationType === 'money' ? (
          <div>
            <label htmlFor="amount" className="form-label">
              Amount (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="amount"
                type="number"
                step="0.01"
                min="1"
                className="input-field pl-10"
                placeholder="Enter amount"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 1, message: 'Amount must be at least ₹1' },
                })}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="form-label">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                className="input-field"
                placeholder="Enter quantity"
                {...register('quantity', {
                  required: 'Quantity is required',
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
                {...register('unit', { required: 'Unit is required' })}
              >
                <option value="">Select unit</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="lbs">Pounds (lbs)</option>
                <option value="pieces">Pieces</option>
                <option value="boxes">Boxes</option>
                <option value="bags">Bags</option>
                <option value="items">Items</option>
                <option value="sets">Sets</option>
                <option value="bottles">Bottles</option>
                <option value="other">Other</option>
              </select>
              {errors.unit && (
                <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            className="input-field"
            placeholder={
              donationType === 'money' 
                ? 'Add a message about your donation (optional)...' 
                : donationType === 'food'
                ? 'Describe the food items (e.g., rice, canned goods, vegetables)...'
                : 'Describe the essential items (e.g., winter clothes, bed frames, kitchen utensils)...'
            }
            {...register('description', {
              required: 'Description is required',
              minLength: {
                value: 10,
                message: 'Description must be at least 10 characters',
              },
            })}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Delivery Date */}
        {donationType !== 'money' && (
          <div>
            <label htmlFor="deliveryDate" className="form-label">
              Preferred Delivery Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="deliveryDate"
                type="date"
                className="input-field pl-10"
                min={new Date().toISOString().split('T')[0]}
                {...register('deliveryDate', {
                  required: 'Delivery date is required',
                  validate: (value) => {
                    if (!value) return 'Delivery date is required';
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
                    if (selectedDate < today) {
                      return 'Delivery date cannot be in the past';
                    }
                    return true;
                  },
                })}
              />
            </div>
            {errors.deliveryDate && (
              <p className="mt-1 text-sm text-red-600">{errors.deliveryDate.message}</p>
            )}
          </div>
        )}

        {/* Information Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important Information</p>
              <ul className="space-y-1">
                <li>• Your donation will be reviewed by the NGO</li>
                <li>• You'll receive updates on the donation status</li>
                <li>• Contact the NGO directly for delivery arrangements</li>
              </ul>
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
            {isLoading ? 'Submitting...' : 'Submit Donation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DonationForm; 