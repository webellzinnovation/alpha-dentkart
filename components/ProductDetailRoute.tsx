import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Component to handle product detail route
export function ProductDetailRoute({
    products,
    onProductSelect
}: {
    products: any[],
    onProductSelect: (product: any) => void
}) {
    const { id } = useParams();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (id && products.length > 0) {
            const product = products.find(p => p.id.toString() === id);
            if (product) {
                onProductSelect(product);
            } else {
                // Product not found, redirect to home
                navigate('/');
            }
        }
    }, [id, products, onProductSelect, navigate]);

    return null; // This component just handles the routing logic
}
