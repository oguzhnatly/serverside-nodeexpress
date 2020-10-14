const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate'); 
const cors = require('./cors'); 
const Favorites = require('../models/favorite');

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({ user: req.user._id })
    .populate('user')
    .populate('dishes')
    .then((favorites) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.cors, authenticate.verifyUser, (req,res,next) => {
    Favorites.findOne({ user: req.user._id })
    .then((favorites) => {
        if (favorites) {
            favorites.update({ $addToSet: { dishes: req.body }  }, { new: true })
            .then((favorites) => {
                console.log('Favorites Updated ', favorites);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err));
        } else {
            Favorites.create({ 'user': req.user._id, 'dishes': req.body })
            then((favorites) => {
                console.log('Favorites Created ', favorites);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));  
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({ 'user': req.user._id })
        .then((resp) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        }, (err) => next(err))
        .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
        res.statusCode = 403;
        res.end('GET operation not supported on /favorites/'+ req.params.dishId);
    })
    .post(cors.cors, authenticate.verifyUser, (req,res,next) => {
        Favorites.findOne({ user: req.user._id })
        .then((favorite) => {
            if(favorite) {
                if (favorite.dishes.indexOf(req.params.dishId) === -1) {
                    favorite.dishes.push(req.params.dishId)
                    favorite.save()
                    .then((favorite) => {
                        console.log('Favorite Created ', favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    }, (err) => next(err));
                }
                else {
                    err = new Error('The dish ' + req.params.dishId + ' is already in your list of favorites');
                    err.status = 404;
                    return next(err);
                }
            } else {
                Favorites.create({ 'user': req.user._id, 'dishes': [req.params.dishId] })
                .then((favorite) => {
                    console.log('Favorite Created ', favorite);
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }, (err) => next(err));
            }
        }, (err) => next(err))
        .catch((err) => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites/' + req.params.dishId);
    })
    .delete(cors.cors, authenticate.verifyUser, (req,res,next) => {
        Favorites.findOne({ user: req.user._id })
        .then((favorite) => {
            if (favorite) {
                favoriteToDeleteIndex = favorite.dishes.indexOf(req.params.dishId);
                if (favoriteToDeleteIndex !== -1) {
                    favorite.dishes.splice(favoriteToDeleteIndex, 1);
                    favorite.save()
                    .then((favorite) => {
                        console.log('Favorite Deleted ', favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    }, (err) => next(err));
                } else {
                    err = new Error('Dish ' + req.params.dishId + ' not found - it looks like this dish not in your list of favorites');
                    err.status = 403;
                    return next(err); 
                }
            } else {
                err = new Error('Favorites not found - You might have not created your list of favorites yet');
                err.status = 403;
                return next(err);
            }
        }, (err) => next(err))
        .catch((err) => next(err));
    });

module.exports = favoriteRouter;