import React from 'react';
import { OrderStatusUpdate } from '../types';

interface OrderStatusTimelineProps {
    history?: OrderStatusUpdate[];
    currentStatus: string;
}

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ history, currentStatus }) => {
    const isReturn = currentStatus.startsWith('Return');
    
    const steps = isReturn 
        ? [
            { status: 'Return Initiated', icon: 'fa-undo', label: 'Return Initiated' },
            { status: 'Return Approved', icon: 'fa-check-circle', label: 'Return Approved' },
            { status: 'Return Completed', icon: 'fa-box-open', label: 'Return Completed' }
          ]
        : [
            { status: 'Processing', icon: 'fa-box', label: 'Order Confirmed' },
            { status: 'Shipped', icon: 'fa-truck', label: 'In Transit' },
            { status: 'Delivered', icon: 'fa-check-circle', label: 'Delivered' }
          ];

    if (currentStatus === 'Cancelled') {
        return (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-800/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600">
                    <i className="fas fa-times-circle"></i>
                </div>
                <div>
                    <h4 className="font-bold text-red-800 dark:text-red-400">Order Cancelled</h4>
                    <p className="text-xs text-red-600/70">This order has been cancelled and will not be processed further.</p>
                </div>
            </div>
        );
    }

    if (currentStatus === 'Return Rejected') {
        return (
            <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-100 dark:border-rose-800/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                    <i className="fas fa-ban"></i>
                </div>
                <div>
                    <h4 className="font-bold text-rose-800 dark:text-rose-400">Return Rejected</h4>
                    <p className="text-xs text-rose-600/70">The return request for this order was rejected by the administration.</p>
                </div>
            </div>
        );
    }

    // Helper to determine if a step is reached based on currentStatus if history is missing
    const getStatusIndex = (status: string) => {
        const flow = isReturn 
            ? ['Return Initiated', 'Return Approved', 'Return Completed']
            : ['Processing', 'Shipped', 'Delivered'];
        return flow.indexOf(status);
    };

    const currentIndex = getStatusIndex(currentStatus);

    return (
        <div className="py-6">
            <div className="relative">
                {/* Connection Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800"></div>

                <div className="space-y-8 relative">
                    {steps.map((step, index) => {
                        const historyItem = history?.find(h => h.status === step.status);
                        const isCompleted = historyItem || getStatusIndex(step.status) <= currentIndex;
                        const isCurrent = currentStatus === step.status;

                        return (
                            <div key={step.status} className="flex gap-6 items-start">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 ${
                                    isCompleted 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                } ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}`}>
                                    <i className={`fas ${step.icon}`}></i>
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="flex justify-between items-center">
                                        <h4 className={`font-bold text-sm ${isCompleted ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                            {step.label}
                                        </h4>
                                        {historyItem && (
                                            <span className="text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded">
                                                {new Date(historyItem.timestamp).toLocaleDateString()} {new Date(historyItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs mt-1 ${isCompleted ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {step.status === 'Processing' && 'We are preparing your medical supplies.'}
                                        {step.status === 'Shipped' && 'Order is on its way to your clinic.'}
                                        {step.status === 'Delivered' && 'Order has been successfully delivered.'}
                                        {step.status === 'Return Initiated' && 'Return request has been logged and is under review.'}
                                        {step.status === 'Return Approved' && 'Return request approved. Please prepare the package for pickup.'}
                                        {step.status === 'Return Completed' && 'Return received and processed successfully.'}
                                    </p>
                                    {historyItem?.note && (
                                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <p className="text-[10px] italic text-gray-500">"{historyItem.note}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default OrderStatusTimeline;
