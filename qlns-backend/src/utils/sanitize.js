function publicUser(user) {
  if (!user) return null;
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.securityAnswers;
  delete obj.__v;
  return obj;
}

module.exports = { publicUser };
