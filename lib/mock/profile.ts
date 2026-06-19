export type ProfileListing = {
  id: string
  title: string
  price: number
  imageUrl: string
}

export type ProfileReview = {
  id: string
  author: string
  rating: number
  comment: string
  date: string
}

export type MockProfile = {
  fullName: string
  username: string
  avatarUrl: string
  coverUrl: string
  rating: number
  reviewCount: number
  memberSince: string
  stats: {
    listings: number
    sold: number
    responseRate: string
  }
  listings: ProfileListing[]
  reviews: ProfileReview[]
  about: string
}

export const mockProfile: MockProfile = {
  fullName: 'Neha Patel',
  username: 'nehapatel',
  avatarUrl:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  coverUrl:
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=400&fit=crop',
  rating: 4.9,
  reviewCount: 18,
  memberSince: 'January 2023',
  stats: {
    listings: 23,
    sold: 18,
    responseRate: '98%',
  },
  listings: [
    {
      id: '1',
      title: 'iPhone 13 Pro 128GB',
      price: 45000,
      imageUrl:
        'https://images.unsplash.com/photo-1632661671477-5961d4a48f24?w=400&h=400&fit=crop',
    },
    {
      id: '2',
      title: 'MacBook Air M1',
      price: 54999,
      imageUrl:
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop',
    },
    {
      id: '3',
      title: 'Sony Headphones',
      price: 4999,
      imageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    },
  ],
  reviews: [
    {
      id: '1',
      author: 'Rahul Sharma',
      rating: 5,
      comment: 'Great seller! Item exactly as described and fast delivery.',
      date: '2 weeks ago',
    },
    {
      id: '2',
      author: 'Priya Mehta',
      rating: 5,
      comment: 'Very responsive and professional. Would buy again.',
      date: '1 month ago',
    },
    {
      id: '3',
      author: 'Arjun Singh',
      rating: 4,
      comment: 'Good experience overall. Product was in excellent condition.',
      date: '2 months ago',
    },
  ],
  about:
    'Hi! I\'m Neha, a trusted seller on FoxVent with over 2 years of experience. I specialize in electronics and gadgets, and I always ensure every item is accurately described and well-packaged for shipping.',
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
