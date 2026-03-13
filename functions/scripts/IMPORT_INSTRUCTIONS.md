# How to Import Your Data to Hostinger MySQL

Follow these steps to load your `alphadentkart_data.json` into your new live database.

### Prerequisites
1.  You must have created the Database and Tables (Step 1 & 2 of previous instructions).
2.  You must have updated `backend/api/config.php` with your live DB credentials.

### Step 1: Upload Files
1.  Log in to **Hostinger File Manager**.
2.  Navigate to your `public_html` folder.
3.  Ensure you have a `backend` folder. Inside it, create a `scripts` folder if it doesn't exist.
4.  Upload these two files into `public_html/backend/scripts/`:
    -   `import_data.php` (The script I just created)
    -   `alphadentkart_data.json` (The data file you downloaded)

### Step 2: Run the Import
1.  Open your browser.
2.  Visit: `https://alphadentkart.com/backend/scripts/import_data.php`
3.  Wait for the script to finish. It will print "Brands Imported...", "Products Imported...", etc.
4.  **Success**: You should see "Database Population Complete".

### Step 3: Verify
1.  Go to Hostinger -> phpMyAdmin.
2.  Open your database (`alphadentkart_db`).
3.  Check the `products` table. It should now have 4,000+ rows!

### Step 4: Cleanup
1.  **Delete** `import_data.php` and `alphadentkart_data.json` from the server immediately after success.
