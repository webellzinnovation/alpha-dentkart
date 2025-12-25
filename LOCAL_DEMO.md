# How to Run the Local Demo (Migrated Data)

I have configured your local React application to use the **Exported WordPress Data** (`alphadentkart_data.json`) instead of the mock data.

### Step 1: Install Dependencies
I have already started installing the necessary libraries (`npm install`). 
-   If you see a `node_modules` folder in your project, you are ready.
-   If not, run this command in your terminal:
    ```powershell
    npm install
    ```

### Step 2: Start the App
Run the following command to start the local server:
```powershell
npm run dev
```

### Step 3: View the Demo
Open your browser to:
**http://localhost:5173**

### What to Expect
-   **Products**: You should see your **real products** (e.g., Colgate, Prevest) instead of the fake "Dental Chair" placeholders.
-   **Search**: You can search for real brands or products.
-   **Speed**: Loading might take a split second initially as it processes the 14MB data file, but then it should be instant.

### Note on Images
Since we are viewing this locally, images will load directly from your live site URLs (`https://alphadentkart.com/...`). This requires an internet connection.
