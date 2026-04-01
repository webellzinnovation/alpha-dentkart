"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderHeroSlides = exports.deleteHeroSlide = exports.updateHeroSlide = exports.createHeroSlide = exports.getAllHeroSlides = void 0;
const firebase_1 = require("../config/firebase"); // Firestore
const logger_1 = __importDefault(require("../utils/logger"));
// Get all hero slides (active only for public, all for admin)
const getAllHeroSlides = async (req, res) => {
    try {
        const { active } = req.query;
        let query = firebase_1.db.collection('hero_slides').orderBy('order', 'asc');
        if (active === 'true') {
            query = query.where('isActive', '==', true);
        }
        const snapshot = await query.get();
        const slides = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(slides);
    }
    catch (error) {
        logger_1.default.error('Error fetching hero slides:', error);
        res.status(500).json({ error: 'Failed to fetch hero slides' });
    }
};
exports.getAllHeroSlides = getAllHeroSlides;
// Create new hero slide
const createHeroSlide = async (req, res) => {
    try {
        const { title, subtitle, image, link, order, isActive } = req.body;
        const newSlide = {
            title,
            subtitle,
            image,
            link,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date().toISOString()
        };
        const docRef = await firebase_1.db.collection('hero_slides').add(newSlide);
        res.status(201).json({ id: docRef.id, ...newSlide });
    }
    catch (error) {
        logger_1.default.error('Error creating hero slide:', error);
        res.status(500).json({ error: 'Failed to create hero slide' });
    }
};
exports.createHeroSlide = createHeroSlide;
// Update hero slide
const updateHeroSlide = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
        await firebase_1.db.collection('hero_slides').doc(String(id)).update(cleanUpdates);
        const updatedDoc = await firebase_1.db.collection('hero_slides').doc(String(id)).get();
        res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    catch (error) {
        logger_1.default.error('Error updating hero slide:', error);
        res.status(500).json({ error: 'Failed to update hero slide' });
    }
};
exports.updateHeroSlide = updateHeroSlide;
// Delete hero slide
const deleteHeroSlide = async (req, res) => {
    try {
        const { id } = req.params;
        await firebase_1.db.collection('hero_slides').doc(String(id)).delete();
        res.json({ message: 'Hero slide deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('Error deleting hero slide:', error);
        res.status(500).json({ error: 'Failed to delete hero slide' });
    }
};
exports.deleteHeroSlide = deleteHeroSlide;
// Reorder hero slides
const reorderHeroSlides = async (req, res) => {
    try {
        const { slides } = req.body; // Array of { id, order }
        const batch = firebase_1.db.batch();
        slides.forEach((slide) => {
            const ref = firebase_1.db.collection('hero_slides').doc(String(slide.id));
            batch.update(ref, { order: slide.order });
        });
        await batch.commit();
        res.json({ message: 'Hero slides reordered successfully' });
    }
    catch (error) {
        logger_1.default.error('Error reordering hero slides:', error);
        res.status(500).json({ error: 'Failed to reorder hero slides' });
    }
};
exports.reorderHeroSlides = reorderHeroSlides;
//# sourceMappingURL=heroSlideController.js.map