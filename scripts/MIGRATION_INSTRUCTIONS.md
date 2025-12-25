# How to Export Your Data from WordPress

Follow these simple steps to move your Products, Customers, and Orders to the new Alpha Dentkart App.

### Step 1: Upload the Script
1.  Log in to your **Hostinger hPanel**.
2.  Click on **File Manager**.
3.  Navigate to the `public_html` folder (this is your live website folder).
4.  **Upload** the file `export_wordpress_data.php` (found in this `scripts/` folder) into `public_html`.

### Step 2: Run the Extraction
1.  Open your web browser.
2.  Visit this URL: `https://www.alphadentkart.com/export_wordpress_data.php`
3.  **Important**: You must be logged in as an **Administrator** on your WordPress site in the same browser, or the script will block you for security.

### Step 3: Save the Data
1.  You will see a large amount of text (JSON formatted data) on your screen.
2.  Right-click on the page and select **"Save As..."**.
3.  Name the file `alphadentkart_data.json` and save it to your computer.

### Step 4: Security Cleanup (Crucial)
1.  Go back to **Hostinger File Manager**.
2.  **Delete** the `export_wordpress_data.php` file from `public_html`.
3.  This ensures no one else can download your data.

### Step 5: Send the Data
-   Once you have the `alphadentkart_data.json` file, I will help you import it into your new Hostinger MySQL database.
