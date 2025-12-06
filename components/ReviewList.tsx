import React, { useEffect, useState } from 'react';
import { Review, ReviewStats } from '../types';
import ReviewCard from './ReviewCard';
import StarRating from './StarRating';
import LoadingSpinner from './LoadingSpinner';

interface ReviewListProps {
  reviews: Review[];
  stats?: ReviewStats;
  currentUserId?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onRespond?: (review: Review) => void;
  showProperty?: boolean;
  isLoading?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  stats,
  currentUserId,
  onEdit,
  onDelete,
  onRespond,
  showProperty = false,
  isLoading = false,
}) => {
  const [filteredReviews, setFilteredReviews] = useState<Review[]>(reviews);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  useEffect(() => {
    let filtered = [...reviews];

    // Filter by rating
    if (ratingFilter !== null) {
      filtered = filtered.filter(review => review.rating === ratingFilter);
    }

    // Sort reviews
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    setFilteredReviews(filtered);
  }, [reviews, sortBy, ratingFilter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-neutral">
        <p className="text-neutral-dark">No reviews yet. Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats and Filters */}
      {stats && (
        <div className="bg-white rounded-lg shadow-md p-6 border border-neutral mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <StarRating rating={stats.averageRating} size="lg" showLabel={true} />
                <span className="text-lg font-semibold text-neutral-darker">
                  {stats.averageRating.toFixed(1)} out of 5
                </span>
              </div>
              <p className="text-sm text-neutral-dark">
                Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
            <div className="text-right">
              {Object.entries(stats.ratingDistribution)
                .reverse()
                .map(([rating, count]) => (
                  <div key={rating} className="flex items-center space-x-2 text-sm mb-1">
                    <span className="w-12 text-right">{rating} star</span>
                    <div className="w-32 bg-neutral-light rounded-full h-2">
                      <div
                        className="bg-warning h-2 rounded-full"
                        style={{
                          width: `${stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-left text-neutral-dark">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-neutral mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-neutral rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-white bg-neutral-darker"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-dark mb-1">Filter by rating</label>
            <select
              value={ratingFilter === null ? 'all' : ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? null : parseInt(e.target.value))}
              className="px-3 py-2 border border-neutral rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-white bg-neutral-darker"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-neutral">
            <p className="text-neutral-dark">No reviews match your filters.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDelete={onDelete}
              onRespond={onRespond}
              showProperty={showProperty}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewList;



