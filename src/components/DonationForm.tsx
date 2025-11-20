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
  essentialSubType?: string;
  shirtQuantity?: number;
  pantQuantity?: number;
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

  // Mapping of essential types to their sub-options
  const essentialSubOptions: Record<string, string[]> = {
    clothes: [
      'Winter Clothes',
      'Summer Clothes',
      'Children\'s Clothes',
      'Men\'s Clothes',
      'Women\'s Clothes',
      'Baby Clothes',
      'Formal Wear',
      'Casual Wear',
    ],
    furniture: [
      'Chairs',
      'Tables',
      'Beds',
      'Sofas',
      'Cabinets',
      'Desks',
      'Wardrobes',
      'Shelving Units',
    ],
    blankets: [
      'Blankets',
      'Bed Sheets',
      'Pillows',
      'Mattresses',
      'Quilts',
      'Comforters',
      'Sleeping Bags',
    ],
    shoes: [
      'Men\'s Shoes',
      'Women\'s Shoes',
      'Children\'s Shoes',
      'Sports Shoes',
      'Formal Shoes',
      'Casual Shoes',
      'Boots',
      'Sandals',
    ],
    kitchen: [
      'Cookware',
      'Dinnerware',
      'Cutlery',
      'Kitchen Utensils',
      'Storage Containers',
      'Appliances',
      'Glassware',
    ],
    toiletries: [
      'Soap & Shampoo',
      'Toothbrushes & Toothpaste',
      'Towels',
      'Sanitary Products',
      'Hair Care Products',
      'Personal Care Items',
    ],
    other: [],
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<DonationFormData>({
    defaultValues: {
      type: initialData?.type || 'money',
      amount: initialData?.amount,
      description: initialData?.description || '',
      quantity: initialData?.quantity,
      unit: initialData?.unit,
      deliveryDate: initialData?.deliveryDate,
      essentialType: initialData?.essentialType,
      essentialSubType: initialData?.essentialSubType,
      shirtQuantity: initialData?.shirtQuantity,
      pantQuantity: initialData?.pantQuantity,
    },
  });

  const selectedEssentialType = watch('essentialType');
  const availableSubOptions = selectedEssentialType ? essentialSubOptions[selectedEssentialType] || [] : [];

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
      essentialSubType: initialData?.essentialSubType,
      shirtQuantity: initialData?.shirtQuantity,
      pantQuantity: initialData?.pantQuantity,
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
      // Combine essential type and sub-type if available
      const essentialTypeValue = donationType === 'essentials' 
        ? (data.essentialSubType 
            ? `${data.essentialType}: ${data.essentialSubType}` 
            : data.essentialType)
        : undefined;

      // Build message with shirt/pant quantities if clothes donation
      let donationMessage = data.description;
      if (donationType === 'essentials' && selectedEssentialType === 'clothes') {
        const shirtQty = data.shirtQuantity || 0;
        const pantQty = data.pantQuantity || 0;
        const quantityParts = [];
        if (shirtQty > 0) quantityParts.push(`${shirtQty} Shirt${shirtQty > 1 ? 's' : ''}`);
        if (pantQty > 0) quantityParts.push(`${pantQty} Pant${pantQty > 1 ? 's' : ''}`);
        if (quantityParts.length > 0) {
          donationMessage = `Quantity: ${quantityParts.join(', ')}. ${data.description}`;
        }
      }

      // Calculate total quantity for clothes (shirt + pant), otherwise use regular quantity
      const totalQuantity = donationType === 'essentials' && selectedEssentialType === 'clothes'
        ? (data.shirtQuantity || 0) + (data.pantQuantity || 0)
        : (donationType !== 'money' ? Number(data.quantity) : undefined);

      await apiService.createDonation({
        ngo_id: ngoId,
        donation_type: donationType,
        amount: donationType === 'money' ? Number(data.amount) : undefined,
        quantity: totalQuantity,
        unit: donationType !== 'money' ? data.unit : undefined,
        essential_type: essentialTypeValue,
        delivery_date: donationType !== 'money' ? data.deliveryDate : undefined,
        message: donationMessage,
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
          <div className="space-y-4">
            <div>
              <label htmlFor="essentialType" className="form-label">
                Type of Essential Item
              </label>
              <select
                id="essentialType"
                className="input-field"
                {...register('essentialType', { 
                  required: 'Please select essential type',
                  onChange: (e) => {
                    // Reset sub-type when main type changes
                    setValue('essentialSubType', '');
                    // Reset shirt and pant quantities when type changes away from clothes
                    if (e.target.value !== 'clothes') {
                      setValue('shirtQuantity', undefined);
                      setValue('pantQuantity', undefined);
                    }
                  }
                })}
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

            {/* Sub-options dropdown (appears when a type is selected) */}
            {selectedEssentialType && availableSubOptions.length > 0 && (
              <div>
                <label htmlFor="essentialSubType" className="form-label">
                  Specific Item
                </label>
                <select
                  id="essentialSubType"
                  className="input-field"
                  {...register('essentialSubType', { 
                    required: 'Please select a specific item' 
                  })}
                >
                  <option value="">Select specific item</option>
                  {availableSubOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.essentialSubType && (
                  <p className="mt-1 text-sm text-red-600">{errors.essentialSubType.message}</p>
                )}
              </div>
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
        ) : donationType === 'essentials' && selectedEssentialType === 'clothes' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="shirtQuantity" className="form-label">
                  Shirt Quantity
                </label>
                <input
                  id="shirtQuantity"
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="Enter number of shirts"
                  {...register('shirtQuantity', {
                    min: { value: 0, message: 'Quantity cannot be negative' },
                    validate: (value) => {
                      const pantQty = watch('pantQuantity') || 0;
                      const shirtQty = value || 0;
                      if (shirtQty === 0 && pantQty === 0) {
                        return 'Please enter quantity for at least one item (Shirt or Pant)';
                      }
                      return true;
                    },
                  })}
                />
                {errors.shirtQuantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.shirtQuantity.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="pantQuantity" className="form-label">
                  Pant Quantity
                </label>
                <input
                  id="pantQuantity"
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="Enter number of pants"
                  {...register('pantQuantity', {
                    min: { value: 0, message: 'Quantity cannot be negative' },
                    validate: (value) => {
                      const shirtQty = watch('shirtQuantity') || 0;
                      const pantQty = value || 0;
                      if (shirtQty === 0 && pantQty === 0) {
                        return 'Please enter quantity for at least one item (Shirt or Pant)';
                      }
                      return true;
                    },
                  })}
                />
                {errors.pantQuantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.pantQuantity.message}</p>
                )}
              </div>
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
                <option value="quantity">Quantity</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="lbs">Pounds (lbs)</option>
                <option value="pieces">Pieces</option>
                <option value="sets">Sets</option>
                <option value="items">Items</option>
                <option value="boxes">Boxes</option>
                <option value="bags">Bags</option>
                <option value="other">Other</option>
              </select>
              {errors.unit && (
                <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
              )}
            </div>
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
                <option value="quantity">Quantity</option>
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