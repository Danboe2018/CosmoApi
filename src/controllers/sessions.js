const joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jwt-simple');

exports.createSessions = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const schema = {
    email: joi.string().email().min(7).max(40).required(),
    password: joi.string().regex(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/).required()
  };

  joi.validate(req.body, schema, async (err) => {
    if (err) {
      return next(new Error('Invalid password: must be 7-15 characters & one special character.'))
    }

    await req.db.collection.findOne({ type: 'USER_TYPE', email }, (err, user) => {
      if (err) {
        return next(err)
      }

      if (!user) {
        return next(new Error('USer does not exist!'))
      }

      bcrypt.compare(password, user.passwordHash, (err, match) => {
        if (match) {
          try {
            const token = jwt.encode({
              authorized: true,
              sessionIP: req.ip,
              sessionUA: req.header['user-agent'],
              userId: user._id.toHexString(),
              displayName: user.displayName
            }, process.env.JWT_SECRET);

            res.status(201).json({
              displayName: user.displayName,
              userId: user._id.toHexString(),
              token,
              msg: 'User is Authorized'
            })
          } catch (err) {
            next(err);
          }
        } else {
          return next(new Error('Wrong Password'));
        }
      })

    })
  });
};

exports.deleteSession = async (req,res,next) => {
  if(req.params.id !== req.auth.userId) {
    return next(new Error("Invalid logout"));
  }

  res.status(200).json({
    msg: 'User logged out successfully'
  })
};