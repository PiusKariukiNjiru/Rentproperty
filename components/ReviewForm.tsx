import React, { useState } from 'react';
import { Review, User, Property } from '../types';
import StarRating from './StarRating';
import LoadingSpinner from './LoadingSpinner';

interface ReviewFormProps {
  revieweeId: string;
  propertyId?: string;
  onSubmit: (reviewData: Omit<Review, 'id' | 'isModerated' | 'isApproved' | 'isFlagged' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel?: () => void;
  initialData?: Review | null;
  isLoading?: boolean;
  revieweeName?: string;
  propertyTitle?: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  revieweeId,
  propertyId,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
  revieweeName,
  propertyTitle,
}) => {
  const [rating, setRating] = useState<number>(initialData?.rating || 0);
  const [title, setTitle] = useState<string>(initialData?.title || '');
  const [content, setContent] = useState<string>(initialData?.content || '');
  const [errors, setErrors] = useState<{ rating?: string; content?: string }>({});

  const validate = (): boolean => {
    const newErrors: { rating?: string; content?: string } = {};

    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!content.trim()) {
      newErrors.content = 'Review content is required';
    } else if (content.trim().length < 10) {
      newErrors.content = 'Review must be at least 10 characters';
    } else if (content.trim().length > 1000) {
      newErrors.content = 'Review must be less than 1000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        reviewerId: '', // Will be set by backend from token
        revieweeId,
        propertyId: propertyId || undefined,
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
        isModerated: false,
        isApproved: false,
        isFlagged: false,
      });

      // Reset form if not editing
      if (!initialData) {
        setRating(0);
        setTitle('');
        setContent('');
      }
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border border-neutral">
      <h3 className="text-xl font-semibold text-neutral-darker mb-4">
        {initialData ? 'Edit Review' : 'Write a Review'}
      </h3>

      {revieweeName && (
        <p className="text-sm text-neutral-dark mb-4">
          Reviewing: <span className="font-medium">{revieweeName}</span>
          {propertyTitle && (
            <>
              {' '}for property: <span className="font-medium">{propertyTitle}</span>
            </>
          )}
        </p>
      )}

      {/* Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-dark mb-2">
          Rating <span className="text-danger">*</span>
        </label>
        <StarRating
          rating={rating}
          interactive={true}
          onRatingChange={setRating}
          showLabel={true}
          size="lg"
        />
        {errors.rating && (
          <p className="mt-1 text-sm text-danger">{errors.rating}</p>
        )}
      </div>

      {/* Title (optional) */}
      <div className="mb-4">
        <label htmlFor="review-title" className="block text-sm font-medium text-neutral-dark mb-1">
          Title (optional)
        </label>
        <input
          type="text"
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          className="w-full px-4 py-2 border border-neutral rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker"
          placeholder="e.g., Great landlord, responsive and helpful"
        />
      </div>

      {/* Content */}
      <div className="mb-4">
        <label htmlFor="review-content" className="block text-sm font-medium text-neutral-dark mb-1">
          Review <span className="text-danger">*</span>
        </label>
        <textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={1000}
          required
          className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-white placeholder-gray-400 bg-neutral-darker ${
            errors.content ? 'border-danger' : 'border-neutral'
          }`}
          placeholder="Share your experience... (minimum 10 characters)"
        />
        <div className="mt-1 flex justify-between">
          {errors.content && (
            <p className="text-sm text-danger">{errors.content}</p>
          )}
          <p className="text-xs text-neutral-dark ml-auto">
            {content.length} / 1000 characters
          </p>
        </div>
      </div>

      {/* Submit buttons */}
      <div className="flex items-center justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-neutral rounded-md text-neutral-dark hover:bg-neutral-light transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || rating === 0 || !content.trim()}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading && <LoadingSpinner size="sm" />}
          <span>{initialData ? 'Update Review' : 'Submit Review'}</span>
        </button>
      </div>

      {!initialData && (
        <p className="mt-4 text-xs text-neutral-dark">
          Note: Your review will be visible after moderation by the property owner.
        </p>
      )}
    </form>
  );
};

export default ReviewForm;



