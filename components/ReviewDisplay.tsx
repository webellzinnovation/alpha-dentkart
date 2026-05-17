import React, { useState, useEffect } from 'react';
import { Review } from '../types';
import OptimizedImageMemo from './OptimizedImage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faUser, faCheckCircle, faThumbsUp } from '@fortawesome/free-solid-svg-icons';



interface ReviewDisplayProps {
  productId: number;
  reviews?: Review[];
  onWriteReview?: () => void;
  userRole?: string;
}

const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  productId,
  reviews = [],
  onWriteReview,
  userRole
}) => {
  const [filter, setFilter] = useState<'all' | 'verified' | 'rating'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    if (filter === 'verified' && !review.isVerified) return false;
    if (filter === 'rating' && ratingFilter && review.rating !== ratingFilter) return false;
    return true;
  });

  // Calculate rating distribution
  const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 : 0
  }));

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const StarRating: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg' }> = ({ 
    rating, 
    size = 'md' 
  }) => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <FontAwesomeIcon
            key={star}
            icon={faStar}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const ReviewItem: React.FC<{ review: Review }> = ({ review }) => {
    const [showFull, setShowFull] = useState(false);
    const isExpanded = expandedReviews.has(review.id);

    const toggleExpanded = () => {
      const newExpanded = new Set(expandedReviews);
      if (newExpanded.has(review.id)) {
        newExpanded.delete(review.id);
      } else {
        newExpanded.add(review.id);
      }
      setExpandedReviews(newExpanded);
    };

    return (
      <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {review.user.avatar ? (
                  <OptimizedImageMemo 
                    src={review.user.avatar} 
                    alt={review.user.name}
                    className="w-full h-full object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{review.user.name}</p>
                  {review.user.userType === 'dental-doctor' && (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">Verified Doctor</span>
                    </div>
                  )}
                  {review.user.userType === 'dental-student' && (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-indigo-500" />
                      <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-tight">Dental Student</span>
                    </div>
                  )}
                  {review.user.userType === 'dental-business' && (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3 text-teal-500" />
                      <span className="text-[10px] text-teal-600 font-bold uppercase tracking-tight">Dental Business</span>
                    </div>
                  )}
                  {review.isVerified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Verified Purchase</span>
                  )}
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-2">{review.title}</h3>
        
        <div className="text-gray-700 mb-3">
          {showFull || isExpanded ? review.content : `${review.content.substring(0, 200)}...`}
        </div>

        {review.content.length > 200 && !isExpanded && (
          <button
            onClick={() => setShowFull(true)}
            className="text-pink-600 hover:text-pink-700 text-sm font-medium mb-3"
          >
            Read more
          </button>
        )}

        {review.clinicalUse && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
            <p className="text-sm font-medium text-blue-900 mb-1">Clinical Use Case:</p>
            <p className="text-sm text-blue-700">{review.clinicalUse}</p>
          </div>
        )}

        {(review.efficacy || review.safety) && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {review.efficacy && (
              <div className="bg-green-50 border border-green-200 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <StarRating rating={review.efficacy} size="sm" />
                  <span className="text-sm font-medium text-green-900">Efficacy</span>
                </div>
              </div>
            )}
            {review.safety && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <StarRating rating={review.safety} size="sm" />
                  <span className="text-sm font-medium text-yellow-900">Safety</span>
                </div>
              </div>
            )}
          </div>
        )}

        {review.images && review.images.length > 0 && (
          <div className="mb-3">
            <div className="flex gap-2 overflow-x-auto">
              {review.images.map((image, index) => (
                <OptimizedImageMemo
                  key={index}
                  src={image}
                  alt={`Review image ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  width={80}
                  height={80}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
          >
            <FontAwesomeIcon icon={faThumbsUp} className="w-4 h-4" />
            <span>Helpful ({review.helpful})</span>
          </button>
          
          {userRole === 'admin' && (
            <div className="flex gap-2">
              {!review.isApproved && (
                <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                  Approve
                </button>
              )}
              <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Reviews Summary */}
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} size="lg" />
              <p className="text-sm text-gray-500 mt-1">
                {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
              </p>
            </div>
            
            <div className="flex-1">
              <div className="space-y-2">
                {ratingCounts.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-12">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {onWriteReview && (
          <button
            onClick={onWriteReview}
            className="w-full bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors duration-200 font-medium"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any);
              setRatingFilter(null);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          >
            <option value="all">All Reviews</option>
            <option value="verified">Verified Purchases Only</option>
            <option value="rating">By Rating</option>
          </select>

          {filter === 'rating' && (
            <select
              value={ratingFilter || ''}
              onChange={(e) => setRatingFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div>
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">No reviews yet</div>
            <p className="text-gray-400">Be the first to review this product!</p>
          </div>
        ) : (
          filteredReviews.map(review => (
            <ReviewItem key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewDisplay;