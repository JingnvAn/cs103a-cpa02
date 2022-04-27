'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var itemSchema = Schema({
    catagory: String,
    name: String,
    price: Number,
    size: String,
    picture: Object,
    inventory: Number,
    details: String,
    ingredients: String,
    warnings: String,
    directions: String,
})
module.exports = mongoose.model( 'Item', itemSchema );