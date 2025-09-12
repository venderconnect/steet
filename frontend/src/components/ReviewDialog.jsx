import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addProductReview } from '../services/productService';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Star, Loader2 } from 'lucide-react';

const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`cursor-pointer ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
};

const ReviewDialog = ({ product, isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: (reviewData) => addProductReview(product._id, reviewData),
    onSuccess: () => {
      toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Refetch products to show new rating
      onClose();
    },
    onError: (err) => toast({ title: "Error", description: err.response?.data?.msg, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (rating === 0 || comment.trim() === '') {
      toast({ title: "Please provide a rating and a comment.", variant: "destructive" });
      return;
    }
    submitReview({ rating, comment });
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {product.name}</DialogTitle>
          <DialogDescription>Share your thoughts on this product with other vendors.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <p className="font-medium">Your Rating</p>
            <StarRating rating={rating} setRating={setRating} />
          </div>
          <div className="space-y-2">
            <p className="font-medium">Your Comment</p>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the quality? Was the description accurate?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
