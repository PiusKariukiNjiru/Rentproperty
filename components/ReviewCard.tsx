import React from 'react';
import { Review, User } from '../types';
import StarRating from './StarRating';
import { UserCircleIcon } from './icons';

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onRespond?: (review: Review) => void;
  showProperty?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUserId,
  onEdit,
  onDelete,
  onRespond,
  showProperty = false,
}) => {
  const reviewer = typeof review.reviewerId === 'object' ? review.reviewerId : null;
  const reviewee = typeof review.revieweeId === 'object' ? review.revieweeId : null;
  const property = typeof review.propertyId === 'object' ? review.propertyId : null;

  const isReviewer = currentUserId && String(review.reviewerId) === currentUserId;
  const isReviewee = currentUserId && String(review.revieweeId) === currentUserId;
  const canEdit = isReviewer;
  const canDelete = isReviewer;
  const canRespond = isReviewee && !review.response;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-neutral">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0">
            {reviewer?.profilePicture ? (
              <img
                src={reviewer.profilePicture}
                alt={reviewer.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="w-12 h-12 text-neutral-dark" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-neutral-darker">{reviewer?.name || 'Anonymous'}</h4>
              {reviewer?.userType && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                  {reviewer.userType}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-neutral-dark">{formatDate(review.createdAt)}</span>
            </div>
            {showProperty && property && (
              <p className="text-sm text-neutral-dark mb-1">
                Review for: <span className="font-medium">{property.title}</span>
              </p>
            )}
            {review.title && (
              <h5 className="font-medium text-neutral-darker mb-2">{review.title}</h5>
            )}
            <p className="text-neutral-dark text-sm leading-relaxed">{review.content}</p>
          </div>
        </div>
      </div>

      {/* Response from reviewee */}
      {review.response && (
        <div className="mt-4 pl-4 border-l-4 border-primary bg-primary/5 rounded-r p-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-semibold text-sm text-primary">
              Response from {reviewee?.name || 'Property Owner'}
            </span>
            <span className="text-xs text-neutral-dark">{formatDate(review.response.respondedAt)}</span>
          </div>
          <p className="text-sm text-neutral-dark">{review.response.content}</p>
        </div>
      )}

      {/* Action buttons */}
      {(canEdit || canDelete || canRespond) && (
        <div className="mt-4 pt-4 border-t border-neutral flex items-center space-x-3">
          {canRespond && onRespond && (
            <button
              onClick={() => onRespond(review)}
              className="text-sm text-primary hover:text-blue-700 font-medium"
            >
              Respond
            </button>
          )}
          {canEdit && onEdit && (
            <button
              onClick={() => onEdit(review)}
              className="text-sm text-primary hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          )}
          {canDelete && onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this review?')) {
                  onDelete(review.id);
                }
              }}
              className="text-sm text-danger hover:text-red-700 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Moderation status (for reviewers) */}
      {isReviewer && !review.isApproved && (
        <div className="mt-3 pt-3 border-t border-neutral">
          <p className="text-xs text-warning">
            {review.isModerated
              ? 'This review has been rejected by the property owner.'
              : 'This review is pending moderation and will be visible after approval.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;

