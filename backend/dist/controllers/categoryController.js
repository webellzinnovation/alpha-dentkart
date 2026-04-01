"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = getAllCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const firebase_1 = require("../config/firebase");
const logger_1 = __importDefault(require("../utils/logger"));
let cacheService;
try {
    cacheService = require('../services/cacheService');
}
catch (e) {
    console.log('cacheService not available');
}
async function getAllCategories(req, res) {
    try {
        console.log('Fetching categories from Firebase...');
        const snapshot = await firebase_1.db.collection('categories').get();
        console.log('Categories fetched:', snapshot.size);
        const categories = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.json({ categories });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        logger_1.default.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories: ' + error.message });
    }
}
async function createCategory(req, res) {
    try {
        const { name, icon, ...otherData } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }
        const newCategory = {
            name,
            icon: icon || 'folder',
            ...otherData,
            createdAt: new Date().toISOString()
        };
        const docRef = await firebase_1.db.collection('categories').add(newCategory);
        await cacheService.invalidateCategoriesCache();
        res.status(201).json({
            message: 'Category created successfully',
            category: { id: docRef.id, ...newCategory }
        });
    }
    catch (error) {
        logger_1.default.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
}
async function updateCategory(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updates = req.body;
        const docRef = firebase_1.db.collection('categories').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Category not found' });
        }
        updates.updatedAt = new Date().toISOString();
        await docRef.update(updates);
        await cacheService.invalidateCategoriesCache();
        res.json({ message: 'Category updated successfully' });
    }
    catch (error) {
        logger_1.default.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
}
async function deleteCategory(req, res) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const docRef = firebase_1.db.collection('categories').doc(String(id));
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Category not found' });
        }
        await docRef.delete();
        await cacheService.invalidateCategoriesCache();
        res.json({ message: 'Category deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
}
//# sourceMappingURL=categoryController.js.map