
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
    id: string | number;
    children: React.ReactNode;
    className?: string;
    handle?: boolean;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, className, handle = false }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${className} ${isDragging ? 'shadow-2xl ring-2 ring-primary ring-offset-2' : ''}`}
            {...(!handle ? attributes : {})}
            {...(!handle ? listeners : {})}
        >
            {children}
            {handle && (
                <div 
                    {...attributes} 
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600"
                >
                    <i className="fas fa-grip-vertical"></i>
                </div>
            )}
        </div>
    );
};
