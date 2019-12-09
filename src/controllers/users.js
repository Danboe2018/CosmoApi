const bcrypt = require('bcryptjs');
const joi = require('joi');
const ObjectId = require('mongodb').ObjectID;

exports.createUser = async (req, res, next) => {
  const email = req.body.email;
  const displayName = req.body.displayName;
  const password = req.body.password;

  const schema = {
    displayName: joi.string().alphanum().min(3).max(20).required(),
    email: joi.string().email().min(7).max(40).required(),
    password: joi.string().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/).required()
  };

  joi.validate(req.body, schema, async (err) => {
    if (err) {
      console.log("Error: ", err);
      return next(new Error('Invalid password: must be 7-15 characters & one special character.'))
    }

    await req.db.collection.findOne({ type: 'USER_TYPE', email }, (err, doc) => {
      if (err) {
        return next(err)
      }

      if (doc) {
        return next(new Error('Email account already registered'));
      }

      let newUser = {
        type: 'USER_TYPE',
        displayName,
        email,
        passwordHash: null,
        date: Date.now()
      };

      bcrypt.hash(password, 10, function getHash(err, hash) {
        if (err) {
          return next(err);
        }

        newUser.passwordHash = hash;
        req.db.collection.insertOne(newUser, function createUser(err, results) {
          if (err) {
            return next(err);
          }

          res.status(201).json(results.ops[0]);
        })
      })
    });
  });
};

exports.deleteUser = async (req, res, next) => {
  if (req.params.id !== req.auth.userId) {
    return next(new Error('Unable to delete account'));
  }

  await req.db.collection.findOneAndDelete({ type: 'USER_TYPE', id: ObjectId(req.auth.userId), }, (err, result) => {
    if (err) {
      return next(err);
    } else if (result.ok !== 1) {
      return next(new Error('Unable to delete user account'))
    }

    res.status(200).json({ msg: 'User account deleted.' })
  })
};

exports.loginUser = async (req, res, next) => {
  if (req.params.id !== req.auth.userId) {
    return next(new Error('Invalid request!'));
  }

  await req.db.collection.findOne({ type: 'USER_TYPE', _id: ObjectId(req.auth.userId) }, (err, doc) => {
    if (err) {
      return next(err);
    }

    let userProfile = {
      email: doc.email,
      displayName: doc.displayName,
      date: doc.date
    };

    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    res.status(200).json(userProfile);
  });
};