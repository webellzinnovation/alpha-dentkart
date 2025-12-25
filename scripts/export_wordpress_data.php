<?php
// scripts/export_wordpress_data.php
// UPLOAD THIS FILE TO YOUR WORDPRESS ROOT (public_html) AND ACCESS IT VIA BROWSER
// e.g., https://alphadentkart.com/export_wordpress_data.php

require_once('wp-load.php');

header('Content-Type: application/json');

if (!current_user_can('administrator')) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$args = array(
    'post_type' => 'product',
    'posts_per_page' => -1,
);

// 1. Export Products
$products = get_posts($args);
$export_data = [
    'products' => [],
    'users' => [],
    'orders' => []
];

foreach ($products as $post) {
    $product = wc_get_product($post->ID);

    $item = [
        'id' => $product->get_id(),
        'name' => $product->get_name(),
        'slug' => $product->get_slug(),
        'sku' => $product->get_sku(),
        'price' => $product->get_price(),
        'regular_price' => $product->get_regular_price(),
        'sale_price' => $product->get_sale_price(),
        'description' => $product->get_description(),
        'short_description' => $product->get_short_description(),
        'categories' => [],
        'brands' => [],
        'images' => [],
        'attributes' => [],
        'variations' => []
    ];

    // Brands (Auto-detect common WooCommerce Brand plugins)
    $brand_taxonomies = ['pwb-brand', 'product_brand', 'yith_product_brand', 'brand'];
    foreach ($brand_taxonomies as $tax) {
        if (taxonomy_exists($tax)) {
            $terms = get_the_terms($post->ID, $tax);
            if ($terms && !is_wp_error($terms)) {
                foreach ($terms as $term) {
                    // Try multiple meta keys for brand logos
                    $logo_meta_keys = [
                        'pwb_brand_image',           // Perfect WooCommerce Brands
                        'thumbnail_id',              // WooCommerce Brands
                        'brand_thumbnail_id',        // Some custom implementations
                        'yith_product_brand_image',  // YITH Brands
                        'brand_image',               // Generic
                        'logo'                       // Generic
                    ];

                    $logo_url = '';
                    foreach ($logo_meta_keys as $meta_key) {
                        $logo_value = get_term_meta($term->term_id, $meta_key, true);
                        if ($logo_value) {
                            // If it's an attachment ID, get the URL
                            if (is_numeric($logo_value)) {
                                $logo_url = wp_get_attachment_url($logo_value);
                            } else {
                                // It's already a URL
                                $logo_url = $logo_value;
                            }
                            if ($logo_url)
                                break;
                        }
                    }

                    $item['brands'][] = [
                        'id' => $term->term_id,
                        'name' => $term->name,
                        'slug' => $term->slug,
                        'logo' => $logo_url ?: ''
                    ];
                }
            }
        }
    }

    // Categories

    // Categories
    $terms = get_the_terms($post->ID, 'product_cat');
    if ($terms) {
        foreach ($terms as $term) {
            $item['categories'][] = [
                'id' => $term->term_id,
                'name' => $term->name,
                'slug' => $term->slug
            ];
        }
    }

    // Images
    $attachment_ids = $product->get_gallery_image_ids();
    $main_image_id = $product->get_image_id();
    if ($main_image_id) {
        $item['images'][] = wp_get_attachment_url($main_image_id);
    }
    foreach ($attachment_ids as $attachment_id) {
        $item['images'][] = wp_get_attachment_url($attachment_id);
    }

    // Variations (Attributes)
    $attributes = $product->get_attributes();
    foreach ($attributes as $attribute) {
        if ($attribute->is_taxonomy()) {
            $terms = wc_get_product_terms($product->get_id(), $attribute->get_name(), array('fields' => 'names'));
            $item['attributes'][] = [
                'name' => wc_attribute_label($attribute->get_name()),
                'values' => $terms
            ];
        } else {
            $item['attributes'][] = [
                'name' => $attribute->get_name(),
                'values' => $attribute->get_options()
            ];
        }
    }

    if ($product->is_type('variable')) {
        $available_variations = $product->get_available_variations();
        foreach ($available_variations as $variation) {
            $item['variations'][] = [
                'id' => $variation['variation_id'],
                'attributes' => $variation['attributes'],
                'price' => $variation['display_price'],
                'sku' => $variation['sku'],
                'stock' => $variation['max_qty']
            ];
        }
    }

    $export_data['products'][] = $item;
}

// 2. Export Users (Customers)
$users = get_users(['role__in' => ['customer', 'subscriber']]);
foreach ($users as $user) {
    $export_data['users'][] = [
        'id' => $user->ID,
        'email' => $user->user_email,
        'name' => $user->display_name,
        'registered' => $user->user_registered,
        'billing_phone' => get_user_meta($user->ID, 'billing_phone', true),
        // We do NOT export password hashes for safety in this JSON. 
        // Users will reset passwords on the new platform.
    ];
}

// 3. Export Orders
$orders = wc_get_orders(['limit' => -1]);
foreach ($orders as $order) {
    $export_data['orders'][] = [
        'id' => $order->get_id(),
        'user_id' => $order->get_user_id(),
        'status' => $order->get_status(),
        'total' => $order->get_total(),
        'date' => $order->get_date_created()->date('Y-m-d H:i:s'),
        'billing' => $order->get_address('billing'),
        'shipping' => $order->get_address('shipping'),
        'items' => array_map(function ($item) {
            return [
                'product_id' => $item->get_product_id(),
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'total' => $item->get_total()
            ];
        }, $order->get_items())
    ];
}

echo json_encode($export_data, JSON_PRETTY_PRINT);
?>