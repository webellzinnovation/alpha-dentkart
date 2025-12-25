<?php
// backend/scripts/import_data.php
// UPLOAD THIS FILE TO backend/scripts/ ON HOSTINGER

require_once '../api/config.php'; // Ensure this points to your config.php

// Increase limits for import process
ini_set('memory_limit', '2048M');
set_time_limit(0);

header('Content-Type: application/json');

// Check if JSON file exists
$jsonFile = '../../alphadentkart_data.json'; // Adjust path based on where you upload it
if (!file_exists($jsonFile)) {
    // Fallback if uploaded in same dir
    $jsonFile = 'alphadentkart_data.json';
}

if (!file_exists($jsonFile)) {
    die(json_encode(['error' => 'JSON File not found. Upload alphadentkart_data.json next to this script.']));
}

$data = json_decode(file_get_contents($jsonFile), true);

if (!$data) {
    die(json_encode(['error' => 'Invalid JSON Format']));
}

echo "Starting Import...\n";

try {
    // 1. Import Brands
    $stmtBrand = $pdo->prepare("INSERT INTO brands (id, name, slug, logo_url) VALUES (:id, :name, :slug, :logo) ON DUPLICATE KEY UPDATE name=VALUES(name), logo_url=VALUES(logo_url)");
    if (!empty($data['products'])) {
        foreach ($data['products'] as $product) {
            foreach ($product['brands'] as $brand) {
                $stmtBrand->execute([
                    ':id' => $brand['id'],
                    ':name' => $brand['name'],
                    ':slug' => $brand['slug'],
                    ':logo' => $brand['logo'] ?? null
                ]);
            }
        }
    }
    echo "Brands Imported.\n";

    // 2. Import Categories
    $stmtCat = $pdo->prepare("INSERT INTO categories (id, name, slug) VALUES (:id, :name, :slug) ON DUPLICATE KEY UPDATE name=VALUES(name)");
    if (!empty($data['products'])) {
        foreach ($data['products'] as $product) {
            foreach ($product['categories'] as $cat) {
                $stmtCat->execute([
                    ':id' => $cat['id'],
                    ':name' => $cat['name'],
                    ':slug' => $cat['slug']
                ]);
            }
        }
    }
    echo "Categories Imported.\n";

    // 3. Import Products
    $stmtProd = $pdo->prepare("INSERT INTO products (id, name, slug, sku, price, sale_price, description, short_description, main_image_url, brand_id, category_id) VALUES (:id, :name, :slug, :sku, :price, :sale_price, :desc, :short_desc, :img, :bid, :cid) ON DUPLICATE KEY UPDATE price=VALUES(price), stock_quantity=VALUES(stock_quantity)");

    $stmtAttr = $pdo->prepare("INSERT INTO product_attribute_values (product_id, value) VALUES (:pid, :val)");

    $stmtVar = $pdo->prepare("INSERT INTO product_variations (product_id, price, attributes) VALUES (:pid, :price, :attr)");

    foreach ($data['products'] as $p) {
        $brandId = !empty($p['brands']) ? $p['brands'][0]['id'] : null;
        $catId = !empty($p['categories']) ? $p['categories'][0]['id'] : null;
        $mainImg = !empty($p['images']) ? $p['images'][0] : null;

        $stmtProd->execute([
            ':id' => $p['id'],
            ':name' => $p['name'],
            ':slug' => $p['slug'],
            ':sku' => $p['sku'],
            ':price' => (float) $p['price'],
            ':sale_price' => (float) $p['sale_price'],
            ':desc' => $p['description'],
            ':short_desc' => $p['short_description'],
            ':img' => $mainImg,
            ':bid' => $brandId,
            ':cid' => $catId
        ]);

        // Variations
        if (!empty($p['variations'])) {
            foreach ($p['variations'] as $v) {
                $stmtVar->execute([
                    ':pid' => $p['id'],
                    ':price' => $v['price'],
                    ':attr' => json_encode($v['attributes'])
                ]);
            }
        }
    }
    echo "Products Imported.\n";

    // 4. Import Users
    $stmtUser = $pdo->prepare("INSERT INTO users (wp_user_id, email, full_name, role) VALUES (:wpid, :email, :name, 'customer') ON DUPLICATE KEY UPDATE email=VALUES(email)");
    if (!empty($data['users'])) {
        foreach ($data['users'] as $u) {
            $stmtUser->execute([
                ':wpid' => $u['id'],
                ':email' => $u['email'],
                ':name' => $u['name']
            ]);
        }
    }
    echo "Users Imported.\n";

    // 5. Import Orders
    $stmtOrder = $pdo->prepare("INSERT INTO orders (wp_order_id, user_id, total_amount, status, created_at, shipping_address, items_snapshot) VALUES (:wpid, (SELECT id FROM users WHERE wp_user_id = :uid), :total, :status, :date, :addr, :items) ON DUPLICATE KEY UPDATE status=VALUES(status)");

    if (!empty($data['orders'])) {
        foreach ($data['orders'] as $o) {
            $stmtOrder->execute([
                ':wpid' => $o['id'],
                ':uid' => $o['user_id'],
                ':total' => $o['total'],
                ':status' => $o['status'],
                ':date' => $o['date'],
                ':addr' => json_encode($o['shipping']),
                ':items' => json_encode($o['items'])
            ]);
        }
    }
    echo "Orders Imported.\n";
    echo "SUCCESS: Database Population Complete.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>