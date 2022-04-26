'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var itemSchema = Schema({
    catagory: String,
    name: String,
    price: Number,
    size: Number,
    unit: String,
    unitPrice: Number,
    picture: Image,
    inventory: Number,
    tag: String,
    details: String,
    ingredients: String,
    warnings: String,
    directions: String,
})