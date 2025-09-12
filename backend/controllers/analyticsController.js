const { GroupOrder, Product } = require('../models/model');
const mongoose = require('mongoose');

exports.getSupplierAnalytics = async (req, res) => {
  try {
    const supplierId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Monthly Revenue (for the last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await GroupOrder.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $match: {
          'product.supplier': supplierId,
          status: { $in: ['completed', 'delivered'] },
          updatedAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' }
          },
          totalRevenue: {
            $sum: {
              $multiply: [
                '$currentQty',
                { $ifNull: ['$product.pricePerKg', 0] }
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          revenue: '$totalRevenue'
        }
      }
    ]);

    // 2. Top Selling Products
    const topProducts = await GroupOrder.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $match: {
          'product.supplier': supplierId,
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$product._id',
          name: { $first: '$product.name' },
          totalQuantitySold: { $sum: '$currentQty' }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 5 }
    ]);

    res.json({ monthlyRevenue, topProducts });

  } catch (err) {
    console.error('Error fetching supplier analytics:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};
