import { PrismaClient } from '@prisma/client';

export interface QuickReorderData {
  userId: string;
  orderId: string;
  notes?: string;
  modifyQuantities?: boolean;
  quantityModifications?: Array<{
    orderItemId: string;
    newQuantity: number;
  }>;
}

export interface QuickReorderResponse {
  success: boolean;
  reorder?: any;
  error?: string;
}

export class QuickReorderService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createQuickReorder(data: QuickReorderData): Promise<QuickReorderResponse> {
    try {
      // Get original order
      const originalOrder = await this.prisma.order.findUnique({
        where: { id: data.orderId },
        include: {
          items: {
            include: {
              product: true
            }
          },
          shippingAddress: true,
          billingAddress: true,
          coupon: true
        }
      });

      if (!originalOrder) {
        return {
          success: false,
          error: 'Original order not found'
        };
      }

      // Check if order belongs to user
      if (originalOrder.userId !== data.userId) {
        return {
          success: false,
          error: 'Unauthorized to reorder this order'
        };
      }

      // Check if order is completed (only completed orders can be reordered)
      if (originalOrder.status !== 'delivered') {
        return {
          success: false,
          error: 'Only delivered orders can be reordered'
        };
      }

      // Create new order with same items
      const newOrderData: any = {
        userId: data.userId,
        status: 'pending',
        subtotal: originalOrder.subtotal,
        total: originalOrder.total,
        discountAmount: originalOrder.discountAmount,
        taxAmount: originalOrder.taxAmount,
        shippingAmount: originalOrder.shippingAmount,
        orderType: 'quick_reorder',
        originalOrderId: data.orderId,
        notes: data.notes || `Quick reorder from order ${data.orderId}`,
        shippingAddress: originalOrder.shippingAddress ? {
          name: originalOrder.shippingAddress.name,
          phone: originalOrder.shippingAddress.phone,
          address: originalOrder.shippingAddress.address,
          city: originalOrder.shippingAddress.city,
          state: originalOrder.shippingAddress.state,
          pincode: originalOrder.shippingAddress.pincode,
          country: originalOrder.shippingAddress.country,
        } : undefined,
        billingAddress: originalOrder.billingAddress ? {
          name: originalOrder.billingAddress.name,
          phone: originalOrder.billingAddress.phone,
          address: originalOrder.billingAddress.address,
          city: originalOrder.billingAddress.city,
          state: originalOrder.billingAddress.state,
          pincode: originalOrder.billingAddress.pincode,
          country: originalOrder.billingAddress.country,
        } : undefined,
        createdAt: new Date()
      };

      // Apply coupon if original order had one and it's still valid
      if (originalOrder.coupon) {
        const coupon = await this.prisma.coupon.findUnique({
          where: { code: originalOrder.coupon.code }
        });

        if (coupon && coupon.isActive && coupon.expiresAt > new Date()) {
          newOrderData.couponId = originalOrder.coupon.id;
        }
      }

      // Create new order
      const newOrder = await this.prisma.order.create({
        data: newOrderData
      });

      // Create order items
      const orderItems = [];
      for (const originalItem of originalOrder.items) {
        let quantity = originalItem.quantity;
        let price = originalItem.price;

        // Apply quantity modifications if provided
        if (data.modifyQuantities && data.quantityModifications) {
          const modification = data.quantityModifications.find(
            mod => mod.orderItemId === originalItem.id
          );
          if (modification) {
            quantity = modification.newQuantity;
            // Update subtotal and total based on new quantity
            const quantityDifference = modification.newQuantity - originalItem.quantity;
            newOrderData.subtotal += (originalItem.price * quantityDifference);
            newOrderData.total += (originalItem.price * quantityDifference);
          }
        }

        // Check if product is still active and has sufficient stock
        const product = await this.prisma.product.findUnique({
          where: { id: originalItem.productId }
        });

        if (!product || !product.isActive) {
          continue; // Skip discontinued products
        }

        if (product.stock < quantity) {
          quantity = Math.min(quantity, product.stock); // Adjust to available stock
        }

        orderItems.push({
          orderId: newOrder.id,
          productId: originalItem.productId,
          quantity,
          price,
          originalPrice: originalItem.price,
          createdAt: new Date()
        });
      }

      if (orderItems.length === 0) {
        // Rollback order if no items available
        await this.prisma.order.delete({
          where: { id: newOrder.id }
        });
        return {
          success: false,
          error: 'No items available for reorder. Some products may be out of stock.'
        };
      }

      // Create order items
      await this.prisma.orderItem.createMany({
        data: orderItems
      });

      // Update order totals with actual values
      const actualSubtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const actualTotal = actualSubtotal + (originalOrder.shippingAmount || 0) - (originalOrder.discountAmount || 0);

      await this.prisma.order.update({
        where: { id: newOrder.id },
        data: {
          subtotal: actualSubtotal,
          total: actualTotal
        }
      });

      // Create reorder record for tracking
      await this.prisma.quickReorder.create({
        data: {
          originalOrderId: data.orderId,
          newOrderId: newOrder.id,
          userId: data.userId,
          notes: data.notes,
          quantityModifications: data.modifyQuantities ? JSON.stringify(data.quantityModifications) : null,
          createdAt: new Date()
        }
      });

      // Get complete new order with items
      const completeNewOrder = await this.prisma.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: {
            include: {
              product: true
            }
          },
          shippingAddress: true,
          billingAddress: true,
          coupon: true
        }
      });

      return {
        success: true,
        reorder: completeNewOrder
      };
    } catch (error) {
      console.error('Error creating quick reorder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create quick reorder'
      };
    }
  }

  async getUserReorders(userId: string, filters?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<{ reorders: any[]; total: number }> {
    try {
      const where: any = { userId };
      
      if (filters?.status) {
        where.status = filters.status;
      }

      const [reorders, total] = await Promise.all([
        this.prisma.quickReorder.findMany({
          where,
          include: {
            originalOrder: {
              include: {
                items: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                        price: true,
                        images: true
                      }
                    }
                  }
                }
              }
            },
            newOrder: {
              include: {
                items: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                        price: true,
                        images: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: filters?.limit || 20,
          skip: filters?.offset || 0
        }),
        this.prisma.quickReorder.count({ where })
      ]);

      return { reorders, total };
    } catch (error) {
      console.error('Error fetching user reorders:', error);
      return { reorders: [], total: 0 };
    }
  }

  async getReorderById(reorderId: string, userId: string): Promise<any | null> {
    try {
      const reorder = await this.prisma.quickReorder.findFirst({
        where: {
          id: reorderId,
          userId
        },
        include: {
          originalOrder: {
            include: {
              items: {
                include: {
                  product: true
                }
              },
              shippingAddress: true,
              billingAddress: true
            }
          },
          newOrder: {
            include: {
              items: {
                include: {
                  product: true
                }
              },
              shippingAddress: true,
              billingAddress: true
            }
          }
        }
      });

      return reorder;
    } catch (error) {
      console.error('Error fetching reorder by ID:', error);
      return null;
    }
  }

  async cancelReorder(reorderId: string, userId: string, reason: string): Promise<QuickReorderResponse> {
    try {
      const reorder = await this.prisma.quickReorder.findFirst({
        where: {
          id: reorderId,
          userId
        },
        include: {
          newOrder: true
        }
      });

      if (!reorder) {
        return {
          success: false,
          error: 'Reorder not found'
        };
      }

      // Can only cancel pending reorders
      if (reorder.newOrder.status !== 'pending') {
        return {
          success: false,
          error: 'Can only cancel pending reorders'
        };
      }

      // Cancel the associated order
      await this.prisma.order.update({
        where: { id: reorder.newOrderId },
        data: {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date()
        }
      });

      // Update reorder status
      await this.prisma.quickReorder.update({
        where: { id: reorderId },
        data: {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date()
        }
      });

      return {
        success: true,
        reorder: {
          ...reorder,
          newOrder: {
            ...reorder.newOrder,
            status: 'cancelled',
            cancellationReason: reason,
            cancelledAt: new Date()
          }
        }
      };
    } catch (error) {
      console.error('Error cancelling reorder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel reorder'
      };
    }
  }

  async getReorderStats(userId: string): Promise<{
    totalReorders: number;
    successfulReorders: number;
    cancelledReorders: number;
    pendingReorders: number;
    averageOrderValue: number;
    mostReorderedProducts: Array<{
      productId: string;
      productName: string;
      reorderCount: number;
    }>;
  }> {
    try {
      const [stats, productStats] = await Promise.all([
        this.prisma.quickReorder.groupBy({
          by: ['status'],
          where: { userId },
          _count: { status: true }
        }),
        this.prisma.quickReorder.findMany({
          where: { userId },
          include: {
            newOrder: {
              include: {
                items: {
                  include: {
                    product: true
                  }
                }
              }
            }
          }
        })
      ]);

      const statusCounts = stats.reduce((acc, item) => {
        acc[item.status] = (item._count.status as number) || 0;
        return acc;
      }, {} as Record<string, number>);

      const totalReorders = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
      const successfulReorders = statusCounts['completed'] || 0;
      const cancelledReorders = statusCounts['cancelled'] || 0;
      const pendingReorders = statusCounts['pending'] || 0;

      // Calculate average order value for successful reorders
      const successfulOrders = productStats.filter(r => r.status === 'completed');
      const averageOrderValue = successfulOrders.length > 0
        ? successfulOrders.reduce((sum, r) => sum + r.newOrder.total, 0) / successfulOrders.length
        : 0;

      // Find most reordered products
      const productCounts: Record<string, { name: string; count: number }> = {};
      productStats.forEach(reorder => {
        if (reorder.status === 'completed') {
          reorder.newOrder.items.forEach(item => {
            if (productCounts[item.productId]) {
              productCounts[item.productId].count += 1;
            } else {
              productCounts[item.productId] = {
                name: item.product?.name || 'Unknown',
                count: 1
              };
            }
          });
        }
      });

      const mostReorderedProducts = Object.entries(productCounts)
        .map(([productId, data]) => ({
          productId,
          productName: data.name,
          reorderCount: data.count
        }))
        .sort((a, b) => b.reorderCount - a.reorderCount)
        .slice(0, 5);

      return {
        totalReorders,
        successfulReorders,
        cancelledReorders,
        pendingReorders,
        averageOrderValue,
        mostReorderedProducts
      };
    } catch (error) {
      console.error('Error fetching reorder stats:', error);
      return {
        totalReorders: 0,
        successfulReorders: 0,
        cancelledReorders: 0,
        pendingReorders: 0,
        averageOrderValue: 0,
        mostReorderedProducts: []
      };
    }
  }

  async getRecommendedReorders(userId: string, limit: number = 5): Promise<any[]> {
    try {
      // Get user's completed orders to find frequently reordered products
      const completedOrders = await this.prisma.order.findMany({
        where: {
          userId,
          status: 'delivered'
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      // Calculate product frequency in orders
      const productFrequency: Record<string, {
        productId: string;
        product: any;
        count: number;
        lastOrdered: Date;
        totalQuantity: number;
      }> = {};

      completedOrders.forEach(order => {
        order.items.forEach(item => {
          if (productFrequency[item.productId]) {
            productFrequency[item.productId].count += 1;
            productFrequency[item.productId].totalQuantity += item.quantity;
            if (order.createdAt > productFrequency[item.productId].lastOrdered) {
              productFrequency[item.productId].lastOrdered = order.createdAt;
            }
          } else {
            productFrequency[item.productId] = {
              productId: item.productId,
              product: item.product,
              count: 1,
              lastOrdered: order.createdAt,
              totalQuantity: item.quantity
            };
          }
        });
      });

      // Sort by frequency and recency
      const recommended = Object.values(productFrequency)
        .filter(p => p.product && p.product.isActive && p.product.stock > 0)
        .sort((a, b) => {
          // First by frequency
          if (b.count !== a.count) {
            return b.count - a.count;
          }
          // Then by last ordered date (more recent first)
          return b.lastOrdered.getTime() - a.lastOrdered.getTime();
        })
        .slice(0, limit)
        .map(item => ({
          ...item.product,
          reorderFrequency: item.count,
          totalOrdered: item.totalQuantity,
          lastOrdered: item.lastOrdered
        }));

      return recommended;
    } catch (error) {
      console.error('Error fetching recommended reorders:', error);
      return [];
    }
  }
}

export default QuickReorderService;